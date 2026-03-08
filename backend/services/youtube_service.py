"""
backend/services/youtube_service.py

Searches YouTube for a topic using yt-dlp (replaces broken youtube-search-python),
fetches the transcript via youtube-transcript-api, and asks Gemini for the best
educational start/end timestamps.
"""

from __future__ import annotations

import json
import logging
import os
import re
from typing import Optional

from dotenv import load_dotenv
from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled

load_dotenv()

logger = logging.getLogger(__name__)

GEMINI_API_KEY: str        = os.getenv("GEMINI_API_KEY", "")
LLM_MODEL: str             = os.getenv("LLM_MODEL", "gemini-2.0-flash")
TRANSCRIPT_CHAR_LIMIT: int = 8_000
MAX_SEARCH_RESULTS: int    = 5


# ---------------------------------------------------------------------------
# YouTube search — uses yt-dlp, no API key, no proxy issues
# ---------------------------------------------------------------------------

def _search_youtube(topic: str) -> list[dict]:
    try:
        import yt_dlp  # type: ignore
    except ImportError:
        logger.error("yt-dlp not installed")
        return []

    ydl_opts = {
        "quiet":        True,
        "no_warnings":  True,
        "extract_flat": True,
        "skip_download": True,
        "noplaylist":   True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(
                f"ytsearch{MAX_SEARCH_RESULTS}:{topic} tutorial",
                download=False,
            )
        candidates = []
        for entry in (info.get("entries", []) if info else []):
            vid_id = entry.get("id", "")
            if not vid_id:
                continue
            candidates.append({
                "title":    entry.get("title", ""),
                "url":      f"https://www.youtube.com/watch?v={vid_id}",
                "channel":  entry.get("channel", entry.get("uploader", "")),
                "video_id": vid_id,
            })
        return candidates
    except Exception as exc:
        logger.error("yt-dlp search failed: %s", exc)
        return []


# ---------------------------------------------------------------------------
# Transcript helpers
# ---------------------------------------------------------------------------

def _fetch_transcript(video_id: str) -> Optional[list[dict]]:
    """Supports both youtube-transcript-api <1.0 (static) and >=1.0 (instance)."""
    try:
        # v1.0+ uses instance API: YouTubeTranscriptApi().fetch(video_id)
        api = YouTubeTranscriptApi()
        transcript = api.fetch(video_id, languages=["en", "en-US"])
        # v1.0 returns FetchedTranscript object — convert to list of dicts
        return [{"start": s.start, "duration": s.duration, "text": s.text} for s in transcript]
    except AttributeError:
        pass
    except Exception as exc:
        logger.warning("Transcript v1.0 error for %s: %s", video_id, exc)

    try:
        # v0.x uses class method: YouTubeTranscriptApi.get_transcript(video_id)
        return YouTubeTranscriptApi.get_transcript(video_id, languages=["en", "en-US"])
    except (NoTranscriptFound, TranscriptsDisabled) as exc:
        logger.warning("No transcript for %s: %s", video_id, exc)
        return None
    except Exception as exc:
        logger.error("Transcript error for %s: %s", video_id, exc)
        return None


def _transcript_to_text(transcript: list[dict]) -> str:
    lines: list[str] = []
    total = 0
    for seg in transcript:
        line = f"[{int(seg.get('start', 0))}s] {seg.get('text', '').replace(chr(10), ' ').strip()}"
        total += len(line)
        if total > TRANSCRIPT_CHAR_LIMIT:
            lines.append("... (truncated)")
            break
        lines.append(line)
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Gemini timestamp picker
# ---------------------------------------------------------------------------

def _ask_gemini_for_timestamps(topic: str, video_title: str, transcript_text: str) -> dict:
    import urllib.request, urllib.error

    if not GEMINI_API_KEY:
        return {"start_time": 0, "end_time": 120, "reasoning": "No Gemini API key"}

    prompt = (
        "You are an educational content analyst. "
        "Given a YouTube transcript with timestamps in seconds, "
        "find the single best 2-4 minute continuous segment where the speaker directly explains the topic. "
        "Look for where the core concept is introduced and explained clearly. "
        "Reply ONLY with a raw JSON object — no markdown, no code fences, no extra text:\n"
        '{"start_time": 120, "end_time": 360, "reasoning": "example"}\n\n'
        f"Topic to find: {topic}\n"
        f"Video title: {video_title}\n\n"
        f"Transcript (format: [Nseconds] text):\n{transcript_text}"
    )

    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 300}
    }).encode("utf-8")

    models = ["gemini-2.0-flash-lite", "gemini-1.5-flash-8b", "gemini-2.5-flash"]
    for model in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        req = urllib.request.Request(url, data=body,
            headers={"Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY}, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            raw = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            raw = re.sub(r"```(?:json)?|```", "", raw).strip()
            parsed = json.loads(raw)
            start  = int(parsed.get("start_time", 0))
            end    = int(parsed.get("end_time", start + 180))
            if end <= start:      end = start + 180
            if end - start > 600: end = start + 600
            if start < 0:         start = 0
            return {"start_time": start, "end_time": end, "reasoning": str(parsed.get("reasoning", ""))}
        except urllib.error.HTTPError as e:
            logger.warning("Gemini %s failed: %s", model, e.code)
            continue
        except Exception as exc:
            logger.error("Gemini timestamp error: %s", exc)
            continue
    return {"start_time": 0, "end_time": 180, "reasoning": "Could not determine best segment"}


# ---------------------------------------------------------------------------
# Pick best candidate
# ---------------------------------------------------------------------------

def _pick_best_candidate(candidates: list[dict]) -> Optional[dict]:
    for c in candidates:
        vid = c.get("video_id") or re.search(r"v=([A-Za-z0-9_-]{11})", c["url"])
        if not vid:
            continue
        if isinstance(vid, re.Match):
            vid = vid.group(1)
        transcript = _fetch_transcript(vid)
        if transcript is not None:
            c["transcript"] = transcript
            c["video_id"]   = vid
            return c
    return None


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def get_video_snippet(topic: str) -> dict:
    logger.info("Fetching snippet for: %r", topic)

    try:
        candidates = _search_youtube(topic)
    except Exception as exc:
        logger.error("Search failed: %s", exc)
        candidates = []

    if not candidates:
        logger.warning("No YouTube results for %r", topic)
        return _placeholder(topic)

    best = _pick_best_candidate(candidates)
    if best is None:
        logger.warning("No transcriptable video for %r", topic)
        return _placeholder(topic, url=candidates[0]["url"])

    llm = _ask_gemini_for_timestamps(topic, best["title"], _transcript_to_text(best["transcript"]))

    return {
        "url":          best["url"],
        "start_time":   llm["start_time"],
        "end_time":     llm["end_time"],
        "reasoning":    llm["reasoning"],
        "video_title":  best["title"],
        "channel_name": best["channel"],
    }


def _placeholder(topic: str, url: str = "") -> dict:
    return {
        "url":          url or "https://www.youtube.com/results?search_query=" + topic.replace(" ", "+"),
        "start_time":   0,
        "end_time":     120,
        "reasoning":    f"Could not find a snippet for '{topic}'.",
        "video_title":  "",
        "channel_name": "",
    }