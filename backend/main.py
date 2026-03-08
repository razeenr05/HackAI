from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
import math
import os
import json

from database import get_db, engine, run_migrations
import models
import auth as auth_module

models.Base.metadata.create_all(bind=engine)
run_migrations()

app = FastAPI(title="HackAI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_module.router)


# ---------------------------------------------------------------------------
# Schemas
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
    force: bool = False

class SaveGoalRequest(BaseModel):
    user_id: str
    goal: str

class GradeAnswerRequest(BaseModel):
    question: str
    topic: str
    user_answer: str

class MultipleChoiceRequest(BaseModel):
    question: str
    topic: str

class CheckAnswerRequest(BaseModel):
    question: str
    topic: str
    selected_answer: str
    correct_answer: str

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
    node_id: Optional[str] = None
    problem_index: Optional[int] = None


class PracticeCompleteRequest(BaseModel):
    user_id: str
    node_id: str
    problem_index: int


def _layout_nodes(raw_nodes: list, raw_edges: list) -> dict:
    """Top-to-bottom learning path layout. Nodes flow from foundations to advanced."""
    prereq_map: dict[str, list[str]] = {}
    children_map: dict[str, list[str]] = {}
    for e in raw_edges:
        prereq_map.setdefault(e["target"], []).append(e["source"])
        children_map.setdefault(e["source"], []).append(e["target"])

    depth: dict[str, int] = {}
    roots = [n["id"] for n in raw_nodes if n["id"] not in prereq_map or not prereq_map[n["id"]]]
    if not roots:
        roots = [raw_nodes[0]["id"]] if raw_nodes else []
    queue = [(r, 0) for r in roots]
    while queue:
        node_id, d = queue.pop(0)
        if node_id in depth and depth[node_id] >= d:
            continue
        depth[node_id] = d
        for child in children_map.get(node_id, []):
            queue.append((child, d + 1))

    max_depth = max(depth.values()) if depth else 0
    for n in raw_nodes:
        if n["id"] not in depth:
            depth[n["id"]] = max_depth + 1

    layers: dict[int, list[str]] = {}
    for node_id, d in depth.items():
        layers.setdefault(d, []).append(node_id)

    positions: dict[str, tuple[float, float]] = {}
    X_GAP = 260
    Y_GAP = 200
    CENTER_X = 500

    for layer_idx, node_ids in sorted(layers.items()):
        count = len(node_ids)
        total_width = (count - 1) * X_GAP
        for i, node_id in enumerate(node_ids):
            x = CENTER_X + i * X_GAP - total_width / 2
            y = layer_idx * Y_GAP + 80
            positions[node_id] = (x, y)

    return positions


def _wipe_user_graph(user_id: str, db: Session, goal_id: Optional[int] = None):
    """Wipe nodes (and related data) for a user. If goal_id is set, only wipe that goal's nodes."""
    if goal_id is not None:
        nodes = db.query(models.Node).filter(models.Node.user_id == user_id, models.Node.goal_id == goal_id).all()
    else:
        nodes = db.query(models.Node).filter(models.Node.user_id == user_id).all()
    node_ids = [n.id for n in nodes]
    if node_ids:
        db.query(models.UserProgress).filter(models.UserProgress.node_id.in_(node_ids)).delete(synchronize_session=False)
        db.query(models.Edge).filter(models.Edge.source_id.in_(node_ids)).delete(synchronize_session=False)
        db.query(models.Edge).filter(models.Edge.target_id.in_(node_ids)).delete(synchronize_session=False)
        db.query(models.NodeResource).filter(models.NodeResource.node_id.in_(node_ids)).delete(synchronize_session=False)
        db.query(models.Node).filter(models.Node.id.in_(node_ids)).delete(synchronize_session=False)
    db.commit()


@app.get("/", tags=["health"])
def health_check():
    return {"status": "ok", "message": "HackAI API is running"}


@app.post("/api/goal", tags=["goal"])
def save_goal(payload: SaveGoalRequest, db: Session = Depends(get_db)):
    lg = db.query(models.LearningGoal).filter(
        models.LearningGoal.user_id == payload.user_id,
        models.LearningGoal.goal == payload.goal.strip(),
    ).first()
    goal_id = lg.id if lg else None
    existing = db.query(models.UserGoal).filter(models.UserGoal.user_id == payload.user_id).first()
    if existing:
        existing.goal = payload.goal.strip()
        existing.goal_id = goal_id
    else:
        db.add(models.UserGoal(user_id=payload.user_id, goal=payload.goal.strip(), goal_id=goal_id))
    db.commit()
    return {"status": "ok", "goal": payload.goal}


@app.get("/api/goal/{user_id}", tags=["goal"])
def get_goal(user_id: str, db: Session = Depends(get_db)):
    row = db.query(models.UserGoal).filter(models.UserGoal.user_id == user_id).first()
    return {"goal": row.goal if row else "", "goal_id": row.goal_id if row and row.goal_id is not None else None}


@app.get("/api/learning-goals/{user_id}", tags=["goal"])
def list_learning_goals(user_id: str, db: Session = Depends(get_db)):
    """List all learning goals (past topics) for the user, most recent first."""
    rows = db.query(models.LearningGoal).filter(
        models.LearningGoal.user_id == user_id
    ).order_by(models.LearningGoal.created_at.desc()).all()
    return [{"id": r.id, "goal": r.goal, "created_at": r.created_at.isoformat() if r.created_at else None} for r in rows]


class SetCurrentGoalRequest(BaseModel):
    user_id: str
    goal_id: int


@app.post("/api/current-goal", tags=["goal"])
def set_current_goal(payload: SetCurrentGoalRequest, db: Session = Depends(get_db)):
    """Set the user's current learning goal (e.g. when resuming a past topic)."""
    lg = db.query(models.LearningGoal).filter(
        models.LearningGoal.id == payload.goal_id,
        models.LearningGoal.user_id == payload.user_id,
    ).first()
    if not lg:
        raise HTTPException(status_code=404, detail="Learning goal not found")
    _set_current_goal(db, payload.user_id, lg.goal, payload.goal_id)
    db.commit()
    return {"goal": lg.goal, "goal_id": payload.goal_id}


@app.delete("/api/learning-goals/{user_id}/{goal_id}", tags=["goal"])
def delete_learning_goal(user_id: str, goal_id: int, db: Session = Depends(get_db)):
    """Delete a single learning goal and all its data (mind map, progress, practice completion)."""
    lg = db.query(models.LearningGoal).filter(
        models.LearningGoal.id == goal_id,
        models.LearningGoal.user_id == user_id,
    ).first()
    if not lg:
        raise HTTPException(status_code=404, detail="Learning goal not found")
    node_ids = [n.id for n in db.query(models.Node).filter(
        models.Node.user_id == user_id, models.Node.goal_id == goal_id
    ).all()]
    if node_ids:
        db.query(models.UserPracticeCompletion).filter(
            models.UserPracticeCompletion.node_id.in_(node_ids)
        ).delete(synchronize_session=False)
    _wipe_user_graph(user_id, db, goal_id=goal_id)
    db.query(models.LearningGoal).filter(
        models.LearningGoal.id == goal_id, models.LearningGoal.user_id == user_id
    ).delete(synchronize_session=False)
    row = db.query(models.UserGoal).filter(models.UserGoal.user_id == user_id).first()
    if row and row.goal_id == goal_id:
        row.goal_id = None
        row.goal = ""
    db.commit()
    return {"status": "ok", "message": "Learning goal deleted"}


@app.post("/api/generate-graph", tags=["mindmap"])
def generate_graph(payload: GenerateGraphRequest, db: Session = Depends(get_db)):
    from services.ai_service import generate_knowledge_graph
    goal_text = payload.goal.strip()
    existing_goal_row = db.query(models.LearningGoal).filter(
        models.LearningGoal.user_id == payload.user_id,
        models.LearningGoal.goal == goal_text,
    ).first()
    if existing_goal_row:
        goal_id = existing_goal_row.id
        if payload.force:
            _wipe_user_graph(payload.user_id, db, goal_id=goal_id)
        else:
            existing = db.query(models.Node).filter(
                models.Node.user_id == payload.user_id, models.Node.goal_id == goal_id
            ).first()
            if existing:
                _set_current_goal(db, payload.user_id, goal_text, goal_id)
                db.commit()
                return {"status": "ok", "goal": payload.goal, "cached": True, "node_count": 0, "goal_id": goal_id}
    else:
        existing_goal_row = models.LearningGoal(user_id=payload.user_id, goal=goal_text)
        db.add(existing_goal_row)
        db.flush()
        goal_id = existing_goal_row.id

    graph = generate_knowledge_graph(payload.goal)
    positions = _layout_nodes(graph["nodes"], graph["edges"])
    node_id_map = {}
    for n in graph["nodes"]:
        db_id = f"{payload.user_id}-{goal_id}-{n['id']}"
        node_id_map[n["id"]] = db_id
        node = models.Node(
            id=db_id, user_id=payload.user_id, goal_id=goal_id, label=n["label"],
            description=n.get("description", ""), explanation=n.get("explanation", ""),
            status=n.get("status", "locked"), level=n.get("level", 0),
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
    _set_current_goal(db, payload.user_id, goal_text, goal_id)
    db.commit()
    return {"status": "ok", "goal": payload.goal, "node_count": len(graph["nodes"]), "edge_count": len(graph["edges"]), "goal_id": goal_id}


def _set_current_goal(db: Session, user_id: str, goal: str, goal_id: Optional[int]):
    row = db.query(models.UserGoal).filter(models.UserGoal.user_id == user_id).first()
    if row:
        row.goal = goal
        row.goal_id = goal_id
    else:
        db.add(models.UserGoal(user_id=user_id, goal=goal, goal_id=goal_id))


@app.delete("/api/graph/{user_id}", tags=["mindmap"])
def delete_graph(user_id: str, db: Session = Depends(get_db)):
    _wipe_user_graph(user_id, db, goal_id=None)
    db.query(models.LearningGoal).filter(models.LearningGoal.user_id == user_id).delete(synchronize_session=False)
    db.query(models.UserGoal).filter(models.UserGoal.user_id == user_id).delete(synchronize_session=False)
    db.commit()
    return {"status": "ok", "message": f"Graph deleted for {user_id}"}


@app.get("/api/mindmap/{user_id}", response_model=MindMapResponse, tags=["mindmap"])
def get_mindmap(
    user_id: str,
    goal_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """Get mind map for user. Uses goal_id query param if provided, else current goal from user_goals."""
    if goal_id is None:
        row = db.query(models.UserGoal).filter(models.UserGoal.user_id == user_id).first()
        goal_id = row.goal_id if row else None
    if goal_id is not None:
        db_nodes = db.query(models.Node).filter(
            models.Node.user_id == user_id, models.Node.goal_id == goal_id
        ).all()
    else:
        db_nodes = db.query(models.Node).filter(models.Node.user_id == user_id).all()
    user_node_ids = {n.id for n in db_nodes}
    db_edges = db.query(models.Edge).filter(
        models.Edge.source_id.in_(user_node_ids), models.Edge.target_id.in_(user_node_ids)
    ).all()
    completed_ids = {
        r.node_id for r in db.query(models.UserProgress).filter(
            models.UserProgress.user_id == user_id, models.UserProgress.node_id.in_(user_node_ids)
        ).all()
    }
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
        flow_nodes.append(FlowNode(id=node.id, position={"x": node.position_x, "y": node.position_y}, type="concept",
            data=NodeData(label=node.label, status=status, level=node.level, description=node.description)))
    flow_edges = []
    for edge in db_edges:
        is_animated = edge.source_id in completed_ids
        flow_edges.append(FlowEdge(id=f"e{edge.id}", source=edge.source_id, target=edge.target_id, animated=is_animated,
            style={"stroke": "var(--primary)" if is_animated else "var(--border)"}))
    return MindMapResponse(nodes=flow_nodes, edges=flow_edges)


@app.get("/api/nodes/{node_id}", response_model=ConceptDetail, tags=["nodes"])
def get_concept_detail(node_id: str, db: Session = Depends(get_db)):
    node = db.query(models.Node).filter(models.Node.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail=f"Node '{node_id}' not found")
    return ConceptDetail(id=node.id, label=node.label, status=node.status, level=node.level,
        description=node.description or "", explanation=node.explanation or "",
        practiceProblems=node.practice_problems, resources=[ResourceItem(title=r.title, type=r.type) for r in node.resources],
        relatedTopics=node.related_topics)


@app.get("/api/progress/{user_id}", response_model=ProgressResponse, tags=["progress"])
def get_progress(user_id: str, db: Session = Depends(get_db)):
    completed = db.query(models.UserProgress).filter(models.UserProgress.user_id == user_id).all()
    return ProgressResponse(user_id=user_id, completed_node_ids=[r.node_id for r in completed])


@app.post("/api/progress/complete", response_model=ProgressResponse, tags=["progress"])
def complete_node(payload: ProgressUpdate, db: Session = Depends(get_db)):
    from datetime import date
    exists = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == payload.user_id,
        models.UserProgress.node_id == payload.node_id
    ).first()
    if not exists:
        db.add(models.UserProgress(user_id=payload.user_id, node_id=payload.node_id))
        # Record activity for today (for streak tracking)
        today_str = date.today().isoformat()
        activity_exists = db.query(models.UserActivity).filter(
            models.UserActivity.user_id == payload.user_id,
            models.UserActivity.activity_date == today_str
        ).first()
        if not activity_exists:
            db.add(models.UserActivity(user_id=payload.user_id, activity_date=today_str))
        db.commit()
    completed = db.query(models.UserProgress).filter(models.UserProgress.user_id == payload.user_id).all()
    return ProgressResponse(user_id=payload.user_id, completed_node_ids=[r.node_id for r in completed])



@app.post("/api/progress/start", tags=["progress"])
def start_node(payload: ProgressUpdate, db: Session = Depends(get_db)):
    """Mark a node as in-progress."""
    node = db.query(models.Node).filter(models.Node.id == payload.node_id).first()
    if node:
        node.status = "in-progress"
        db.commit()
    completed = db.query(models.UserProgress).filter(models.UserProgress.user_id == payload.user_id).all()
    return ProgressResponse(user_id=payload.user_id, completed_node_ids=[r.node_id for r in completed])


@app.delete("/api/progress/uncomplete", response_model=ProgressResponse, tags=["progress"])
def uncomplete_node(payload: ProgressUpdate, db: Session = Depends(get_db)):
    """Remove a completion record so a node can be marked uncomplete."""
    db.query(models.UserProgress).filter(
        models.UserProgress.user_id == payload.user_id,
        models.UserProgress.node_id == payload.node_id
    ).delete(synchronize_session=False)
    db.commit()
    completed = db.query(models.UserProgress).filter(models.UserProgress.user_id == payload.user_id).all()
    return ProgressResponse(user_id=payload.user_id, completed_node_ids=[r.node_id for r in completed])


@app.post("/api/progress/weak", response_model=ProgressResponse, tags=["progress"])
def mark_weak_node(payload: ProgressUpdate, db: Session = Depends(get_db)):
    """Mark a node as 'weak' (needs work) without changing completion records."""
    node = db.query(models.Node).filter(models.Node.id == payload.node_id).first()
    if node:
        node.status = "weak"
        db.commit()
    completed = db.query(models.UserProgress).filter(models.UserProgress.user_id == payload.user_id).all()
    return ProgressResponse(user_id=payload.user_id, completed_node_ids=[r.node_id for r in completed])


@app.get("/api/progress/{user_id}/unlock/{node_id}", response_model=UnlockCheckResponse, tags=["progress"])
def check_unlock(user_id: str, node_id: str, db: Session = Depends(get_db)):
    completed_ids = {r.node_id for r in db.query(models.UserProgress).filter(models.UserProgress.user_id == user_id).all()}
    prereqs = models.get_all_prerequisites(db, node_id)
    missing = [p.label for p in prereqs if p.id not in completed_ids]
    return UnlockCheckResponse(node_id=node_id, is_unlocked=len(missing) == 0, missing_prerequisites=missing)


@app.post("/api/generate-choices", tags=["practice"])
def generate_choices(payload: MultipleChoiceRequest):
    """Generate 4 multiple-choice options for a practice question, with the correct answer marked."""
    import urllib.request, urllib.error
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    prompt = f"""You are creating a multiple-choice quiz question.

Topic: {payload.topic}
Question: {payload.question}

Generate exactly 4 answer choices. One must be correct, three must be plausible but wrong.
Reply ONLY with valid JSON, no markdown:
{{
  "choices": ["choice A", "choice B", "choice C", "choice D"],
  "correct_index": <0-3>,
  "explanation": "<one sentence explaining why the correct answer is right>"
}}"""

    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.4}
    }).encode("utf-8")

    models_list = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"]
    for model in models_list:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        req = urllib.request.Request(url, data=body,
            headers={"Content-Type": "application/json", "x-goog-api-key": api_key}, method="POST")
        try:
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            if text.endswith("```"):
                text = text.rsplit("```", 1)[0]
            parsed = json.loads(text.strip())
            return {
                "choices": parsed["choices"],
                "correct_index": int(parsed["correct_index"]),
                "explanation": parsed.get("explanation", "")
            }
        except urllib.error.HTTPError:
            continue
        except Exception:
            continue
    return {
        "choices": ["Option A", "Option B", "Option C", "Option D"],
        "correct_index": 0,
        "explanation": "Could not generate choices."
    }


@app.post("/api/grade-answer", tags=["practice"])
def grade_answer(payload: GradeAnswerRequest):
    import urllib.request, urllib.error
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    prompt = f"""You are an educational AI grading a student's answer.

Topic: {payload.topic}
Question: {payload.question}
Student's Answer: {payload.user_answer}

Evaluate the answer and respond with ONLY valid JSON (no markdown fences):
{{
  "correct": true or false,
  "score": <integer 0-100>,
  "feedback": "<2-3 sentences of constructive feedback>",
  "model_answer": "<a concise correct answer>"
}}

Be fair but accurate. Score above 70 means the student demonstrated understanding."""
    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.3}
    }).encode("utf-8")
    models_list = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"]
    last_err = ""
    for model in models_list:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        req = urllib.request.Request(url, data=body,
            headers={"Content-Type": "application/json", "x-goog-api-key": api_key}, method="POST")
        try:
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            if text.endswith("```"):
                text = text.rsplit("```", 1)[0]
            return json.loads(text.strip())
        except urllib.error.HTTPError as e:
            last_err = f"{model}: {e.code}"
            continue
        except Exception as e:
            last_err = str(e)
            continue
    return {"correct": False, "score": 0, "feedback": f"Grading temporarily unavailable ({last_err})", "model_answer": "Please try again."}


@app.get("/api/dashboard/{user_id}", tags=["dashboard"])
def get_dashboard(user_id: str, db: Session = Depends(get_db)):
    from datetime import date, timedelta
    row = db.query(models.UserGoal).filter(models.UserGoal.user_id == user_id).first()
    goal_id = row.goal_id if row else None
    if goal_id is not None:
        all_nodes = db.query(models.Node).filter(
            models.Node.user_id == user_id, models.Node.goal_id == goal_id
        ).all()
    else:
        all_nodes = db.query(models.Node).filter(models.Node.user_id == user_id).all()
    completed_ids = {r.node_id for r in db.query(models.UserProgress).filter(models.UserProgress.user_id == user_id).all()}
    completed_ids = completed_ids & {n.id for n in all_nodes}
    total = len(all_nodes)
    completed = len(completed_ids)
    overall_progress = round((completed / total) * 100) if total > 0 else 0
    avg_level = round(sum(n.level for n in all_nodes) / total, 1) if total > 0 else 0.0
    weak_nodes = [n for n in all_nodes if n.status in ("weak", "in-progress") and n.id not in completed_ids]
    knowledge_gaps = [{"name": n.label, "level": n.level, "status": "weak"} for n in weak_nodes[:3]]
    recommended_nodes = [n for n in all_nodes if n.status == "recommended" and n.id not in completed_ids]
    recommended_topics = [{"title": n.label, "description": n.description or "", "reason": "Next on your learning path",
        "improvement": "Unlock the next topics", "difficulty": "Beginner" if n.level <= 1 else "Intermediate" if n.level <= 3 else "Advanced",
        "href": f"/practice?topic={n.label}"} for n in recommended_nodes[:2]]
    skill_data = [{"subject": n.label[:20], "value": n.level, "fullMark": 5} for n in all_nodes[:6]]

    # Calculate real streak from activity table
    activity_rows = db.query(models.UserActivity).filter(
        models.UserActivity.user_id == user_id
    ).order_by(models.UserActivity.activity_date.desc()).all()
    activity_dates = {row.activity_date for row in activity_rows}
    streak = 0
    check_date = date.today()
    while check_date.isoformat() in activity_dates:
        streak += 1
        check_date -= timedelta(days=1)

    return {"conceptsLearned": completed, "conceptsThisWeek": min(completed, 3), "averageSkillLevel": f"{avg_level}/5",
        "learningStreak": streak, "timeSpentHours": 0, "overallProgress": overall_progress, "skillData": skill_data,
        "progressData": [{"date": "Start", "progress": 0}, {"date": "Now", "progress": overall_progress}],
        "knowledgeGaps": knowledge_gaps, "recommendedTopics": recommended_topics}


@app.get("/api/recommendations/{user_id}", tags=["recommendations"])
def get_recommendations(user_id: str, db: Session = Depends(get_db)):
    row = db.query(models.UserGoal).filter(models.UserGoal.user_id == user_id).first()
    goal_id = row.goal_id if row else None
    if goal_id is not None:
        all_nodes = db.query(models.Node).filter(
            models.Node.user_id == user_id, models.Node.goal_id == goal_id
        ).all()
    else:
        all_nodes = db.query(models.Node).filter(models.Node.user_id == user_id).all()
    completed_ids = {r.node_id for r in db.query(models.UserProgress).filter(models.UserProgress.user_id == user_id).all()}
    user_node_ids = {n.id for n in all_nodes}
    db_edges = db.query(models.Edge).filter(models.Edge.source_id.in_(user_node_ids)).all()
    prereq_label_map: dict[str, list[str]] = {}
    node_by_id = {n.id: n for n in all_nodes}
    for e in db_edges:
        src = node_by_id.get(e.source_id)
        if src:
            prereq_label_map.setdefault(e.target_id, []).append(src.label)
    total = len(all_nodes)
    avg_level = round(sum(n.level for n in all_nodes) / total, 1) if total > 0 else 0.0
    status_priority = {"weak": 0, "recommended": 1, "in-progress": 2, "locked": 3}
    candidates = sorted([n for n in all_nodes if n.id not in completed_ids], key=lambda n: status_priority.get(n.status, 99))
    recommendations = []
    for n in candidates[:6]:
        current_lvl = n.level
        predicted_lvl = min(5, current_lvl + 2)
        priority = "High" if n.status == "weak" else "Medium" if n.status in ("recommended", "in-progress") else "Low"
        learning_path = [{"step": p, "completed": False} for p in n.practice_problems[:4]]
        if not learning_path:
            learning_path = [{"step": f"Introduction to {n.label}", "completed": False},
                {"step": f"Core concepts", "completed": False}, {"step": "Practice exercises", "completed": False}]
        benefits = [f"Master {n.label}"]
        if n.related_topics:
            benefits += [f"Build toward {t}" for t in n.related_topics[:2]]
        else:
            benefits += ["Strengthen your knowledge graph", "Unlock advanced topics"]
        recommendations.append({"id": n.id, "topic": n.label, "category": "Learning Path",
            "reason": f"Level {current_lvl}/5 — {n.description or 'key topic in your learning path'}",
            "currentLevel": current_lvl, "predictedLevel": predicted_lvl,
            "timeEstimate": "1-2 hours" if priority == "High" else "2-3 hours",
            "priority": priority, "prerequisites": prereq_label_map.get(n.id, []),
            "benefits": benefits, "learningPath": learning_path})
    completed_nodes = [n for n in all_nodes if n.id in completed_ids]
    skill_predictions = [{"skill": n.label[:20], "current": n.level, "predicted": n.level, "change": "+0"} for n in completed_nodes[:3]]
    predicted_avg = round(min(5.0, avg_level + 0.8), 1)
    skill_predictions.append({"skill": "Overall", "current": avg_level, "predicted": predicted_avg, "change": f"+{round(predicted_avg - avg_level, 1)}"})
    quick_wins = [{"topic": n.label, "time": "30 min", "boost": f"+{10 + n.level * 5}%"}
        for n in sorted([n for n in all_nodes if n.id not in completed_ids and n.level <= 2], key=lambda n: n.level)[:4]]
    return {"recommendations": recommendations, "skillPredictions": skill_predictions, "quickWins": quick_wins}


@app.get("/api/resources", response_model=List[Resource], tags=["resources"])
def get_resources(
    topic: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List resources. If user_id is provided, scope to that user's current learning goal."""
    query = db.query(models.NodeResource).join(models.Node)
    if user_id:
        row = db.query(models.UserGoal).filter(models.UserGoal.user_id == user_id).first()
        goal_id = row.goal_id if row else None
        if goal_id is not None:
            query = query.filter(models.Node.user_id == user_id, models.Node.goal_id == goal_id)
        else:
            query = query.filter(models.Node.user_id == user_id)
    if topic:
        query = query.filter(models.Node.label.ilike(f"%{topic}%"))
    rows = query.all()
    return [Resource(id=str(r.id), title=r.title, description=r.node.description or f"Learn about {r.node.label}",
        type=r.type.lower(), topic=r.node.label,
        difficulty="Beginner" if r.node.level <= 1 else "Intermediate" if r.node.level <= 3 else "Advanced",
        source="YouTube" if r.type == "Video" else "Web", featured=i < 3) for i, r in enumerate(rows)]


@app.get("/api/practice", response_model=List[PracticeProblem], tags=["practice"])
def get_practice(
    topic: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List practice problems. If user_id is provided, scope to current goal and return isCompleted from DB."""
    query = db.query(models.Node)
    if user_id:
        row = db.query(models.UserGoal).filter(models.UserGoal.user_id == user_id).first()
        goal_id = row.goal_id if row else None
        if goal_id is not None:
            query = query.filter(models.Node.user_id == user_id, models.Node.goal_id == goal_id)
        else:
            query = query.filter(models.Node.user_id == user_id)
    if topic:
        query = query.filter(models.Node.label.ilike(f"%{topic}%"))
    nodes = query.all()
    completed_set: set[tuple[str, int]] = set()
    if user_id:
        for r in db.query(models.UserPracticeCompletion).filter(
            models.UserPracticeCompletion.user_id == user_id
        ).all():
            completed_set.add((r.node_id, r.problem_index))
    problems = []
    problem_id = 1
    for node in nodes:
        for i, problem_text in enumerate(node.practice_problems):
            difficulty = "Easy" if i == 0 else "Medium" if i == 1 else "Hard"
            is_done = (node.id, i) in completed_set
            problems.append(PracticeProblem(
                id=str(problem_id),
                title=problem_text,
                description=f"Practice exercise for {node.label}: {problem_text}",
                difficulty=difficulty,
                topic=node.label,
                hint=f"Think about the core concepts of {node.label}.",
                expectedOutput="Complete the exercise as described.",
                isCompleted=is_done,
                node_id=node.id,
                problem_index=i,
            ))
            problem_id += 1
    return problems


@app.post("/api/practice/complete", tags=["practice"])
def complete_practice(payload: PracticeCompleteRequest, db: Session = Depends(get_db)):
    """Record that the user completed a practice problem. Idempotent."""
    node = db.query(models.Node).filter(models.Node.id == payload.node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    if payload.problem_index < 0 or payload.problem_index >= len(node.practice_problems):
        raise HTTPException(status_code=400, detail="Invalid problem_index")
    existing = db.query(models.UserPracticeCompletion).filter(
        models.UserPracticeCompletion.user_id == payload.user_id,
        models.UserPracticeCompletion.node_id == payload.node_id,
        models.UserPracticeCompletion.problem_index == payload.problem_index,
    ).first()
    if not existing:
        db.add(models.UserPracticeCompletion(
            user_id=payload.user_id,
            node_id=payload.node_id,
            problem_index=payload.problem_index,
        ))
        db.commit()
    return {"status": "ok", "message": "Practice problem marked complete"}


@app.get("/api/snippet/search", tags=["snippets"])
def search_snippet(topic: str = Query(...)):
    try:
        from services.youtube_service import get_video_snippet
        result = get_video_snippet(topic)
        return {"topic": topic, **result}
    except Exception as e:
        return {"topic": topic, "error": str(e)}


@app.get("/api/snippet/{node_id}", tags=["snippets"])
def get_snippet(node_id: str, db: Session = Depends(get_db)):
    node = db.query(models.Node).filter(models.Node.id == node_id).first()
    topic = node.label if node else node_id.replace("-", " ").title()
    try:
        from services.youtube_service import get_video_snippet
        result = get_video_snippet(topic)
        return {"node_id": node_id, **result}
    except Exception as e:
        return {"node_id": node_id, "topic": topic, "error": str(e)}