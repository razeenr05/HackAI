import os
import json
import urllib.request
import urllib.error

MAX_VIDEOS_PER_NODE = 7
MAX_ARTICLES_PER_NODE = 5
MAX_COURSES_PER_NODE = 3


def _cap_resources_per_node(graph: dict) -> None:
    """Enforce per-node resource limits: 7 videos, 5 articles, 3 courses."""
    for node in graph.get("nodes", []):
        resources = node.get("resources", [])
        if not resources:
            continue
        v, a, c, other = [], [], [], []
        for r in resources:
            t = (r.get("type") or "").lower()
            if t == "video":
                v.append(r)
            elif t == "article":
                a.append(r)
            elif t in ("course", "tutorial"):
                c.append(r)
            else:
                other.append(r)
        node["resources"] = v[:MAX_VIDEOS_PER_NODE] + a[:MAX_ARTICLES_PER_NODE] + c[:MAX_COURSES_PER_NODE] + other


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
- For resources per node: include ONLY the best-fit resources for learning "{goal}".
  Maximum per node: 7 Video, 5 Article, 3 Course (or Tutorial). Prefer quality over quantity.
  Types: Video, Article, Course, Tutorial, Book, Website. Pick the most relevant and educational.
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
        {{"title": "resource name", "type": "Video or Article or Course or Tutorial or Book or Website"}}
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

    models = [
        "gemini-2.5-flash-lite",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
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
            graph = json.loads(text.strip())
            _cap_resources_per_node(graph)
            return graph
        except urllib.error.HTTPError as e:
            last_error = f"{model} -> {e.code}: {e.read().decode('utf-8')[:200]}"
            continue  # try next model

    raise RuntimeError(f"All models failed. Last error: {last_error}")
