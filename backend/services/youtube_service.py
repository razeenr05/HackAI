"""
backend/services/youtube_service.py

Searches YouTube via yt-dlp, fetches transcript via youtube-transcript-api >=1.0,
and asks Gemini for the most relevant 60-90 second snippet.
"""

from __future__ import annotations

import json
import logging
import os
import re
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

GEMINI_API_KEY: str        = os.getenv("GEMINI_API_KEY", "")
TRANSCRIPT_CHAR_LIMIT: int = 8_000
MAX_SEARCH_RESULTS: int    = 8
SNIPPET_MAX_SECONDS: int   = 90

# Gemini models to try in order (only models that actually exist)
GEMINI_MODELS = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
]


# ---------------------------------------------------------------------------
# YouTube search via yt-dlp
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
# Transcript — youtube-transcript-api v1.0+
# ---------------------------------------------------------------------------

def _fetch_transcript(video_id: str) -> Optional[list[dict]]:
    """Fetch English transcript using youtube-transcript-api >=1.0."""
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        api = YouTubeTranscriptApi()
        fetched = api.fetch(video_id, languages=["en", "en-US", "en-GB"])
        raw = fetched.to_raw_data()
        if not raw:
            return None
        return [
            {
                "start": float(seg.get("start", 0)),
                "duration": float(seg.get("duration", 0)),
                "text": str(seg.get("text", "")).strip(),
            }
            for seg in raw
        ]
    except Exception as exc:
        logger.warning("Transcript error for %s: %s", video_id, exc)
        return None


def _transcript_to_text(transcript: list[dict]) -> str:
    lines: list[str] = []
    total = 0
    for seg in transcript:
        try:
            start_int = int(float(seg.get("start", 0)))
        except (TypeError, ValueError):
            start_int = 0
        line = f"[{start_int}s] {seg.get('text', '').replace(chr(10), ' ').strip()}"
        total += len(line)
        if total > TRANSCRIPT_CHAR_LIMIT:
            lines.append("... (truncated)")
            break
        lines.append(line)
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Gemini — pick best 60-90s snippet
# ---------------------------------------------------------------------------

def _ask_gemini_for_timestamps(topic: str, video_title: str, transcript_text: str) -> dict:
    import urllib.request, urllib.error

    if not GEMINI_API_KEY:
        return {"start_time": 0, "end_time": SNIPPET_MAX_SECONDS, "reasoning": "No Gemini API key"}

    prompt = (
        "You are an educational video analyst. "
        "Given a YouTube transcript with timestamps in [Nseconds] format, "
        "find the single most relevant continuous snippet (60 to 90 seconds max) "
        "where the speaker directly teaches or explains the topic below. "
        "The start_time is the exact second the user should jump to for maximum relevance. "
        "The end_time MUST be no more than 90 seconds after start_time. "
        "Prefer the segment where the core concept is introduced and explained clearly.\n\n"
        "Reply ONLY with a raw JSON object — no markdown, no code fences:\n"
        '{"start_time": <seconds>, "end_time": <seconds>, "reasoning": "brief explanation"}\n\n'
        f"Topic: {topic}\n"
        f"Video title: {video_title}\n\n"
        f"Transcript:\n{transcript_text}"
    )

    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 300}
    }).encode("utf-8")

    for model in GEMINI_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        req = urllib.request.Request(url, data=body,
            headers={"Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY}, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            raw = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            raw = re.sub(r"```(?:json)?|```", "", raw).strip()
            parsed = None
            try:
                parsed = json.loads(raw)
            except json.JSONDecodeError:
                # Truncated or malformed JSON (e.g. "Unterminated string") — try to salvage start_time/end_time
                start_m = re.search(r'"start_time"\s*:\s*(\d+)', raw)
                end_m   = re.search(r'"end_time"\s*:\s*(\d+)', raw)
                if start_m and end_m:
                    start = max(0, int(start_m.group(1)))
                    end   = int(end_m.group(1))
                    if end <= start:
                        end = start + SNIPPET_MAX_SECONDS
                    if end - start > SNIPPET_MAX_SECONDS:
                        end = start + SNIPPET_MAX_SECONDS
                    return {"start_time": start, "end_time": end, "reasoning": "Parsed from partial response"}
                if start_m:
                    start = max(0, int(start_m.group(1)))
                    return {"start_time": start, "end_time": start + SNIPPET_MAX_SECONDS, "reasoning": "Parsed start from partial response"}
            if parsed is not None:
                start  = max(0, int(parsed.get("start_time", 0)))
                end    = int(parsed.get("end_time", start + SNIPPET_MAX_SECONDS))
                if end <= start:
                    end = start + SNIPPET_MAX_SECONDS
                if end - start > SNIPPET_MAX_SECONDS:
                    end = start + SNIPPET_MAX_SECONDS
                return {"start_time": start, "end_time": end, "reasoning": str(parsed.get("reasoning", ""))}
        except urllib.error.HTTPError as e:
            logger.warning("Gemini %s failed: %s", model, e.code)
            continue
        except (KeyError, IndexError, TypeError, ValueError) as exc:
            logger.warning("Gemini timestamp parse (%s): %s", model, exc)
            continue
        except Exception as exc:
            logger.error("Gemini timestamp error (%s): %s", model, exc)
            continue
    return {"start_time": 0, "end_time": SNIPPET_MAX_SECONDS, "reasoning": "Could not determine best segment"}


# ---------------------------------------------------------------------------
# Pick best candidate (first video with a transcript)
# ---------------------------------------------------------------------------

def _pick_best_candidate(candidates: list[dict]) -> Optional[dict]:
    for c in candidates:
        vid = c.get("video_id") or re.search(r"v=([A-Za-z0-9_-]{11})", c["url"])
        if not vid:
            continue
        if isinstance(vid, re.Match):
            vid = vid.group(1)
        transcript = _fetch_transcript(vid)
        if transcript is not None and len(transcript) > 0:
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
        "end_time":     SNIPPET_MAX_SECONDS,
        "reasoning":    f"Could not find a snippet for '{topic}'.",
        "video_title":  "",
        "channel_name": "",
    }
