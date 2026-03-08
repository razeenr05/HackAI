from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
import math

from database import get_db, engine
import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="HackAI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class NodeData(BaseModel):
    label: str
    status: str
    level: int
    description: Optional[str] = None

class FlowNode(BaseModel):
    id: str
    position: dict
    data: NodeData
    type: str = "concept"

class FlowEdge(BaseModel):
    id: str
    source: str
    target: str
    animated: bool = False
    style: Optional[dict] = None

class MindMapResponse(BaseModel):
    nodes: List[FlowNode]
    edges: List[FlowEdge]

class ResourceItem(BaseModel):
    title: str
    type: str

class ConceptDetail(BaseModel):
    id: str
    label: str
    status: str
    level: int
    description: str
    explanation: str
    practiceProblems: List[str]
    resources: List[ResourceItem]
    relatedTopics: List[str]

class ProgressUpdate(BaseModel):
    user_id: str
    node_id: str

class ProgressResponse(BaseModel):
    user_id: str
    completed_node_ids: List[str]

class UnlockCheckResponse(BaseModel):
    node_id: str
    is_unlocked: bool
    missing_prerequisites: List[str]

class GenerateGraphRequest(BaseModel):
    user_id: str
    goal: str

class Resource(BaseModel):
    id: str
    title: str
    description: str
    type: str
    timestamp: Optional[str] = None
    duration: Optional[str] = None
    topic: str
    difficulty: str
    source: str
    featured: bool = False

class PracticeProblem(BaseModel):
    id: str
    title: str
    description: str
    difficulty: str
    topic: str
    hint: str
    expectedOutput: str
    isCompleted: bool = False

class SnippetResponse(BaseModel):
    topic: str
    url: str
    start_time: int
    end_time: int
    reasoning: str
    video_title: str
    channel_name: str


# ---------------------------------------------------------------------------
# Helper: auto-layout nodes in a layered tree so they don't overlap
# ---------------------------------------------------------------------------

def _layout_nodes(raw_nodes: list, raw_edges: list) -> dict:
    prereq_map: dict[str, list[str]] = {}
    all_ids = {n["id"] for n in raw_nodes}
    for e in raw_edges:
        prereq_map.setdefault(e["target"], []).append(e["source"])

    depth: dict[str, int] = {}
    roots = [n["id"] for n in raw_nodes if n["id"] not in prereq_map or not prereq_map[n["id"]]]
    queue = [(r, 0) for r in roots]
    while queue:
        node_id, d = queue.pop(0)
        if node_id in depth:
            continue
        depth[node_id] = d
        for e in raw_edges:
            if e["source"] == node_id:
                queue.append((e["target"], d + 1))

    max_depth = max(depth.values()) if depth else 0
    for n in raw_nodes:
        if n["id"] not in depth:
            depth[n["id"]] = max_depth + 1

    layers: dict[int, list[str]] = {}
    for node_id, d in depth.items():
        layers.setdefault(d, []).append(node_id)

    positions: dict[str, tuple[float, float]] = {}
    x_gap = 220
    y_gap = 160
    for layer_idx, node_ids in sorted(layers.items()):
        count = len(node_ids)
        total_width = (count - 1) * x_gap
        for i, node_id in enumerate(node_ids):
            x = i * x_gap - total_width / 2 + 400
            y = layer_idx * y_gap + 50
            positions[node_id] = (x, y)

    return positions


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/", tags=["health"])
def health_check():
    return {"status": "ok", "message": "HackAI API is running"}


# ── Generate graph ────────────────────────────────────────────────────────────

@app.post("/api/generate-graph", tags=["mindmap"])
def generate_graph(payload: GenerateGraphRequest, db: Session = Depends(get_db)):
    from services.ai_service import generate_knowledge_graph

    existing = db.query(models.Node).filter(
        models.Node.user_id == payload.user_id
    ).first()
    if existing:
        return {"status": "ok", "goal": payload.goal, "cached": True, "node_count": 0}

    graph = generate_knowledge_graph(payload.goal)
    positions = _layout_nodes(graph["nodes"], graph["edges"])

    node_id_map = {}
    for n in graph["nodes"]:
        db_id = f"{payload.user_id}-{n['id']}"
        node_id_map[n["id"]] = db_id

        node = models.Node(
            id=db_id,
            user_id=payload.user_id,
            label=n["label"],
            description=n.get("description", ""),
            explanation=n.get("explanation", ""),
            status=n.get("status", "locked"),
            level=n.get("level", 0),
            position_x=positions.get(n["id"], (400, 50))[0],
            position_y=positions.get(n["id"], (400, 50))[1],
        )
        node.practice_problems = n.get("practice_problems", [])
        node.related_topics = n.get("related_topics", [])
        db.add(node)

        for r in n.get("resources", []):
            db.add(models.NodeResource(node_id=db_id, title=r["title"], type=r["type"]))

    db.flush()

    for e in graph["edges"]:
        src = node_id_map.get(e["source"])
        tgt = node_id_map.get(e["target"])
        if src and tgt:
            db.add(models.Edge(source_id=src, target_id=tgt))

    db.commit()

    return {
        "status": "ok",
        "goal": payload.goal,
        "node_count": len(graph["nodes"]),
        "edge_count": len(graph["edges"]),
    }


# ── Mind map ──────────────────────────────────────────────────────────────────

@app.get("/api/mindmap/{user_id}", response_model=MindMapResponse, tags=["mindmap"])
def get_mindmap(user_id: str, db: Session = Depends(get_db)):
    completed_ids = {
        row.node_id
        for row in db.query(models.UserProgress).filter(
            models.UserProgress.user_id == user_id
        ).all()
    }

    db_nodes = db.query(models.Node).filter(models.Node.user_id == user_id).all()
    db_edges = db.query(models.Edge).all()

    user_node_ids = {n.id for n in db_nodes}
    db_edges = [e for e in db_edges if e.source_id in user_node_ids and e.target_id in user_node_ids]

    prereq_map: dict[str, list[str]] = {}
    for edge in db_edges:
        prereq_map.setdefault(edge.target_id, []).append(edge.source_id)

    flow_nodes = []
    for node in db_nodes:
        prereqs = prereq_map.get(node.id, [])
        if node.id in completed_ids:
            status = "completed"
        elif prereqs and not all(p in completed_ids for p in prereqs):
            status = "locked"
        else:
            status = node.status

        flow_nodes.append(FlowNode(
            id=node.id,
            position={"x": node.position_x, "y": node.position_y},
            type="concept",
            data=NodeData(
                label=node.label,
                status=status,
                level=node.level,
                description=node.description,
            ),
        ))

    flow_edges = []
    for edge in db_edges:
        is_animated = edge.source_id in completed_ids
        flow_edges.append(FlowEdge(
            id=f"e{edge.id}",
            source=edge.source_id,
            target=edge.target_id,
            animated=is_animated,
            style={"stroke": "hsl(var(--primary))" if is_animated else "hsl(var(--border))"},
        ))

    return MindMapResponse(nodes=flow_nodes, edges=flow_edges)


# ── Concept detail ────────────────────────────────────────────────────────────

@app.get("/api/nodes/{node_id}", response_model=ConceptDetail, tags=["nodes"])
def get_concept_detail(node_id: str, db: Session = Depends(get_db)):
    node = db.query(models.Node).filter(models.Node.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail=f"Node '{node_id}' not found")
    return ConceptDetail(
        id=node.id,
        label=node.label,
        status=node.status,
        level=node.level,
        description=node.description or "",
        explanation=node.explanation or "",
        practiceProblems=node.practice_problems,
        resources=[ResourceItem(title=r.title, type=r.type) for r in node.resources],
        relatedTopics=node.related_topics,
    )


# ── Progress ──────────────────────────────────────────────────────────────────

@app.get("/api/progress/{user_id}", response_model=ProgressResponse, tags=["progress"])
def get_progress(user_id: str, db: Session = Depends(get_db)):
    completed = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == user_id
    ).all()
    return ProgressResponse(
        user_id=user_id,
        completed_node_ids=[r.node_id for r in completed],
    )


@app.post("/api/progress/complete", response_model=ProgressResponse, tags=["progress"])
def complete_node(payload: ProgressUpdate, db: Session = Depends(get_db)):
    exists = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == payload.user_id,
        models.UserProgress.node_id == payload.node_id,
    ).first()
    if not exists:
        db.add(models.UserProgress(user_id=payload.user_id, node_id=payload.node_id))
        db.commit()

    completed = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == payload.user_id
    ).all()
    return ProgressResponse(
        user_id=payload.user_id,
        completed_node_ids=[r.node_id for r in completed],
    )


@app.get("/api/progress/{user_id}/unlock/{node_id}", response_model=UnlockCheckResponse, tags=["progress"])
def check_unlock(user_id: str, node_id: str, db: Session = Depends(get_db)):
    completed_ids = {
        r.node_id for r in db.query(models.UserProgress).filter(
            models.UserProgress.user_id == user_id
        ).all()
    }
    prereqs = models.get_all_prerequisites(db, node_id)
    missing = [p.label for p in prereqs if p.id not in completed_ids]
    return UnlockCheckResponse(
        node_id=node_id,
        is_unlocked=len(missing) == 0,
        missing_prerequisites=missing,
    )


# ── Dashboard ─────────────────────────────────────────────────────────────────

@app.get("/api/dashboard/{user_id}", tags=["dashboard"])
def get_dashboard(user_id: str, db: Session = Depends(get_db)):
    all_nodes = db.query(models.Node).filter(models.Node.user_id == user_id).all()
    completed_ids = {
        r.node_id for r in db.query(models.UserProgress).filter(
            models.UserProgress.user_id == user_id
        ).all()
    }

    total = len(all_nodes)
    completed = len(completed_ids)
    overall_progress = round((completed / total) * 100) if total > 0 else 0
    avg_level = round(sum(n.level for n in all_nodes) / total, 1) if total > 0 else 0.0

    weak_nodes = [n for n in all_nodes if n.status == "weak" and n.id not in completed_ids]
    knowledge_gaps = [
        {"name": n.label, "level": n.level, "status": "weak"}
        for n in weak_nodes[:3]
    ]

    recommended_nodes = [n for n in all_nodes if n.status == "recommended" and n.id not in completed_ids]
    recommended_topics = [
        {
            "title": n.label,
            "description": n.description or "",
            "reason": "Next on your learning path",
            "improvement": "Unlock the next topics",
            "difficulty": "Beginner" if n.level <= 1 else "Intermediate" if n.level <= 3 else "Advanced",
            "href": f"/practice?topic={n.label}",
        }
        for n in recommended_nodes[:2]
    ]

    skill_data = [
        {"subject": n.label, "value": n.level, "fullMark": 5}
        for n in all_nodes[:6]
    ]

    return {
        "conceptsLearned": completed,
        "conceptsThisWeek": min(completed, 3),
        "averageSkillLevel": f"{avg_level}/5",
        "learningStreak": 0,
        "timeSpentHours": 0,
        "overallProgress": overall_progress,
        "skillData": skill_data,
        "progressData": [{"date": "Week 1", "progress": overall_progress}],
        "knowledgeGaps": knowledge_gaps,
        "recommendedTopics": recommended_topics,
    }


# ── Resources ─────────────────────────────────────────────────────────────────

@app.get("/api/resources", response_model=List[Resource], tags=["resources"])
def get_resources(topic: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(models.NodeResource).join(models.Node)
    if topic:
        query = query.filter(models.Node.label.ilike(f"%{topic}%"))

    rows = query.all()
    resources = []
    for i, r in enumerate(rows):
        resources.append(Resource(
            id=str(r.id),
            title=r.title,
            description=r.node.description or f"Learn about {r.node.label}",
            type=r.type.lower(),
            topic=r.node.label,
            difficulty="Beginner" if r.node.level <= 1 else "Intermediate" if r.node.level <= 3 else "Advanced",
            source="YouTube" if r.type.lower() == "video" else "Web",
            featured=i < 3,
        ))
    return resources


# ── Practice problems ─────────────────────────────────────────────────────────

@app.get("/api/practice", response_model=List[PracticeProblem], tags=["practice"])
def get_practice(topic: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(models.Node)
    if topic:
        query = query.filter(models.Node.label.ilike(f"%{topic}%"))

    nodes = query.all()
    problems = []
    problem_id = 1
    for node in nodes:
        for i, problem_text in enumerate(node.practice_problems):
            difficulty = "Easy" if i == 0 else "Medium" if i == 1 else "Hard"
            problems.append(PracticeProblem(
                id=str(problem_id),
                title=problem_text,
                description=f"Practice exercise for {node.label}: {problem_text}",
                difficulty=difficulty,
                topic=node.label,
                hint=f"Think about the fundamentals of {node.label}.",
                expectedOutput="Complete the exercise as described.",
                isCompleted=False,
            ))
            problem_id += 1
    return problems


# ── YouTube snippet by topic string  (used by Resources page) ─────────────────
#
#   IMPORTANT: this route MUST be defined before /api/snippet/{node_id}
#   otherwise FastAPI matches "search" as a node_id value.
#
#   GET /api/snippet/search?topic=Italian+Cooking+Basics

@app.get("/api/snippet/search", response_model=SnippetResponse, tags=["snippets"])
def get_snippet_by_topic(topic: str = Query(..., description="Topic to search YouTube for")):
    """
    Search YouTube for a topic, grab a transcript, and use Gemini to identify
    the best educational snippet.  Called directly by the frontend Resources page.
    """
    try:
        from services.youtube_service import get_video_snippet
        result = get_video_snippet(topic)
        return SnippetResponse(topic=topic, **result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── YouTube snippet by node ID ────────────────────────────────────────────────
#   IMPORTANT: keep this AFTER /api/snippet/search to avoid route conflict.

@app.get("/api/snippet/{node_id}", tags=["snippets"])
def get_snippet(node_id: str, db: Session = Depends(get_db)):
    node = db.query(models.Node).filter(models.Node.id == node_id).first()
    topic = node.label if node else node_id.replace("-", " ").title()

    try:
        from services.youtube_service import get_video_snippet
        result = get_video_snippet(topic)
        return {"node_id": node_id, **result}
    except (ImportError, NotImplementedError):
        return {
            "node_id": node_id,
            "topic": topic,
            "url": "",
            "start_time": 0,
            "end_time": 0,
            "reasoning": "",
            "video_title": f"Learn {topic}",
            "channel_name": "",
        }