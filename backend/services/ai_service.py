import os
import json
import urllib.request
import urllib.error

def generate_knowledge_graph(goal: str) -> dict:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("No GEMINI_API_KEY found in environment variables.")

    prompt = f"""
A user wants to learn: "{goal}"

Generate a personalized learning knowledge graph.

Rules:
- Generate 8 to 12 nodes total
- Order nodes from foundational to advanced
- Every non-root node MUST have at least one prerequisite edge pointing to it
- The first 1-2 nodes should have status "recommended", all others "locked"
- All nodes start at level 0
- IDs must be lowercase with hyphens only (e.g. "dribbling-basics")
- practice_problems should be real exercises the user can do for "{goal}"
- resource types: Video, Article, Course, Tutorial, Book, Website
- Make content SPECIFIC to "{goal}"

Return ONLY valid JSON with no explanation and no markdown code fences:
{{
  "nodes": [
    {{
      "id": "string",
      "label": "string",
      "description": "one sentence",
      "explanation": "2-3 sentences for a beginner",
      "status": "recommended or locked",
      "level": 0,
      "practice_problems": ["exercise 1", "exercise 2", "exercise 3"],
      "related_topics": ["topic1", "topic2"],
      "resources": [
        {{"title": "resource name", "type": "Video"}}
      ]
    }}
  ],
  "edges": [
    {{"source": "prerequisite-id", "target": "node-that-requires-it"}}
  ]
}}
"""

    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.7}
    }).encode("utf-8")

    # Try models in order until one works
    models = [
        "gemini-2.5-flash",
        "gemini-3.1-flash-lite",
        "gemini-2.0-flash-lite",
        "gemini-1.5-flash-8b",
    ]

    last_error = None
    for model in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        req = urllib.request.Request(
            url,
            data=body,
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": api_key,
            },
            method="POST"
        )
        try:
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            # Success — parse and return
            text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1]
            if text.endswith("```"):
                text = text.rsplit("```", 1)[0]
            return json.loads(text.strip())
        except urllib.error.HTTPError as e:
            last_error = f"{model} -> {e.code}: {e.read().decode('utf-8')[:200]}"
            continue  # try next model

    raise RuntimeError(f"All models failed. Last error: {last_error}")