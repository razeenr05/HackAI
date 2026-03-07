from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="HackAI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic schemas — match the TypeScript interfaces in the frontend exactly

class NodeData(BaseModel):
    label: str
    status: str   # "completed" | "in-progress" | "weak" | "recommended" | "locked"
    level: int    # 0–5, drives the skill dots in ConceptNode
    description: Optional[str] = None

class FlowNode(BaseModel):
    id: str
    position: dict # { x: float, y: float }
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

# Stub data 

STUB_NODES = [
    FlowNode(id="variables",    position={"x": 400, "y": 50},  data=NodeData(label="Variables",    status="completed",   level=4, description="Understanding data types and storage")),
    FlowNode(id="loops",        position={"x": 200, "y": 150}, data=NodeData(label="Loops",        status="completed",   level=4, description="Iteration and repetition")),
    FlowNode(id="functions",    position={"x": 600, "y": 150}, data=NodeData(label="Functions",    status="in-progress", level=3, description="Modular code blocks")),
    FlowNode(id="arrays",       position={"x": 100, "y": 280}, data=NodeData(label="Arrays",       status="in-progress", level=3, description="Ordered data collections")),
    FlowNode(id="recursion",    position={"x": 500, "y": 280}, data=NodeData(label="Recursion",    status="weak",        level=1, description="Self-referencing functions")),
    FlowNode(id="linked-lists", position={"x": 300, "y": 380}, data=NodeData(label="Linked Lists", status="recommended", level=2, description="Dynamic linear structures")),
    FlowNode(id="trees",        position={"x": 500, "y": 450}, data=NodeData(label="Trees",        status="locked",      level=1, description="Hierarchical structures")),
    FlowNode(id="sorting",      position={"x": 100, "y": 420}, data=NodeData(label="Sorting",      status="weak",        level=2, description="Ordering algorithms")),
]

STUB_EDGES = [
    FlowEdge(id="e1", source="variables",    target="loops",        animated=False, style={"stroke": "hsl(var(--border))"}),
    FlowEdge(id="e2", source="variables",    target="functions",    animated=False, style={"stroke": "hsl(var(--border))"}),
    FlowEdge(id="e3", source="loops",        target="arrays",       animated=False, style={"stroke": "hsl(var(--border))"}),
    FlowEdge(id="e4", source="functions",    target="recursion",    animated=True,  style={"stroke": "hsl(var(--destructive))"}),
    FlowEdge(id="e5", source="arrays",       target="linked-lists", animated=True,  style={"stroke": "hsl(var(--primary))"}),
    FlowEdge(id="e6", source="arrays",       target="sorting",      animated=False, style={"stroke": "hsl(var(--border))"}),
    FlowEdge(id="e7", source="recursion",    target="trees",        animated=False, style={"stroke": "hsl(var(--border))", "opacity": 0.4}),
    FlowEdge(id="e8", source="linked-lists", target="trees",        animated=False, style={"stroke": "hsl(var(--border))", "opacity": 0.4}),
]

STUB_DETAILS = {
    "variables":    ConceptDetail(id="variables",    label="Variables",    status="completed",   level=4, description="Understanding data types and storage",  explanation="Variables are containers for storing data values. In programming, variables hold information that can change during execution. They have types like numbers, strings, and booleans.",                                                         practiceProblems=["Declare different variable types", "Variable scope challenge", "Type conversion exercise"], resources=[ResourceItem(title="Variables Deep Dive", type="Video"), ResourceItem(title="Interactive Tutorial", type="Tutorial")], relatedTopics=["Types", "Constants", "Scope"]),
    "loops":        ConceptDetail(id="loops",        label="Loops",        status="completed",   level=4, description="Iteration and repetition",               explanation="Loops repeat a block of code multiple times. For loops run a known number of times, while loops run on a condition, and do-while loops run at least once.",                                                                           practiceProblems=["Sum of array elements", "Pattern printing", "Nested loop challenge"],            resources=[ResourceItem(title="Loop Mastery Course", type="Course"), ResourceItem(title="Common Loop Patterns", type="Article")],      relatedTopics=["Arrays", "Control Flow", "Iteration"]),
    "functions":    ConceptDetail(id="functions",    label="Functions",    status="in-progress", level=3, description="Modular code blocks",                    explanation="Functions are reusable blocks of code that perform specific tasks. They accept parameters, process data, and return results — reducing repetition and improving maintainability.",                                                   practiceProblems=["Create utility functions", "Higher-order functions", "Callback patterns"],        resources=[ResourceItem(title="Functions Fundamentals", type="Video"), ResourceItem(title="Clean Function Design", type="Article")],  relatedTopics=["Parameters", "Return Values", "Closures"]),
    "arrays":       ConceptDetail(id="arrays",       label="Arrays",       status="in-progress", level=3, description="Ordered data collections",               explanation="Arrays are ordered collections accessible by index. They are fundamental data structures used to store multiple values of the same type in a single variable.",                                                                       practiceProblems=["Array manipulation", "Two pointer technique", "Sliding window"],                 resources=[ResourceItem(title="Array Methods Guide", type="Tutorial"), ResourceItem(title="Array Algorithms", type="Course")],        relatedTopics=["Loops", "Indexing", "Sorting"]),
    "recursion":    ConceptDetail(id="recursion",    label="Recursion",    status="weak",        level=1, description="Self-referencing functions",              explanation="Recursion is a technique where a function calls itself to solve smaller instances of the same problem. It needs a base case to stop and a recursive case that moves toward it.",                                                   practiceProblems=["Factorial calculation", "Fibonacci sequence", "Tree traversal"],                 resources=[ResourceItem(title="Recursion Explained", type="Video"), ResourceItem(title="Visualizing Recursion", type="Interactive")], relatedTopics=["Functions", "Call Stack", "Base Case"]),
    "linked-lists": ConceptDetail(id="linked-lists", label="Linked Lists", status="recommended", level=2, description="Dynamic linear structures",              explanation="Linked lists store elements in nodes where each node points to the next. Unlike arrays, they allow efficient insertion and deletion without reorganizing the entire structure.",                                                 practiceProblems=["Reverse linked list", "Detect cycle", "Merge sorted lists"],                     resources=[ResourceItem(title="Linked List Basics", type="Video"), ResourceItem(title="Implementation Guide", type="Tutorial")],    relatedTopics=["Pointers", "Memory", "Nodes"]),
    "trees":        ConceptDetail(id="trees",        label="Trees",        status="locked",      level=1, description="Hierarchical structures",                 explanation="Trees are hierarchical structures with a root and child nodes. Binary trees, BSTs, and balanced trees are common variants used for efficient searching, sorting, and organizing hierarchical data.",                            practiceProblems=["Tree traversal", "BST operations", "Tree height"],                               resources=[ResourceItem(title="Tree Data Structures", type="Course"), ResourceItem(title="Binary Trees Explained", type="Video")],   relatedTopics=["Recursion", "Graphs", "Traversal"]),
    "sorting":      ConceptDetail(id="sorting",      label="Sorting",      status="weak",        level=2, description="Ordering algorithms",                    explanation="Sorting algorithms arrange elements in order. Bubble, merge, quick, and heap sort are common. Understanding time and space complexity helps choose the right algorithm for each situation.",                                        practiceProblems=["Implement merge sort", "Quick sort variations", "Sort analysis"],                resources=[ResourceItem(title="Sorting Visualized", type="Interactive"), ResourceItem(title="Algorithm Analysis", type="Article")],  relatedTopics=["Arrays", "Complexity", "Comparison"]),
}

# Routes

@app.get("/", tags=["health"])
def health_check():
    return {"status": "ok", "message": "HackAI API is running"}


# Mind map

@app.get("/api/mindmap/{user_id}", response_model=MindMapResponse, tags=["mindmap"])
def get_mindmap(user_id: str):
    """
    Returns all React Flow nodes + edges for the canvas.
    Node status drives colour in ConceptNode; edge animated/style drives arrows.
    TODO: replace stub data with DB query.
    TODO: apply user progress so completed nodes show correctly.
    """
    return MindMapResponse(nodes=STUB_NODES, edges=STUB_EDGES)


# Concept detail

@app.get("/api/nodes/{node_id}", response_model=ConceptDetail, tags=["nodes"])
def get_concept_detail(node_id: str):
    """
    Returns the full detail object for the ConceptPanel side drawer.
    Matches the ConceptDetails interface in knowledge-graph.tsx exactly.
    TODO: replace with DB query.
    """
    detail = STUB_DETAILS.get(node_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Node '{node_id}' not found")
    return detail


# User progress 

@app.get("/api/progress/{user_id}", response_model=ProgressResponse, tags=["progress"])
def get_progress(user_id: str):
    """
    Returns a user's completed node IDs.
    TODO (Member 4): query the UserProgress table.
    """
    return ProgressResponse(user_id=user_id, completed_node_ids=[])


@app.post("/api/progress/complete", response_model=ProgressResponse, tags=["progress"])
def complete_node(payload: ProgressUpdate):
    """
    Marks a node as completed for a user.
    TODO (Member 4): insert/update UserProgress row and return updated list.
    """
    return ProgressResponse(user_id=payload.user_id, completed_node_ids=[payload.node_id])


@app.get("/api/progress/{user_id}/unlock/{node_id}", response_model=UnlockCheckResponse, tags=["progress"])
def check_unlock(user_id: str, node_id: str):
    """
    Called when a user clicks a LOCKED node.
    TODO (Member 4): check the user's history against prerequisite nodes.
    """
    locked_prereqs = {"trees": ["recursion", "linked-lists"]}
    prereqs = locked_prereqs.get(node_id, [])
    return UnlockCheckResponse(
        node_id=node_id,
        is_unlocked=len(prereqs) == 0,
        missing_prerequisites=prereqs,
    )


# -- YouTube snippet (Member 3 will implement the service layer) -------------

@app.get("/api/snippet/{node_id}", tags=["snippets"])
def get_snippet(node_id: str):
    """
    Returns a timestamped YouTube snippet for a topic node.
    TODO (Member 3): call youtube_service.get_video_snippet(topic).
    """
    detail = STUB_DETAILS.get(node_id)
    topic = detail.label if detail else node_id.replace("-", " ").title()
    return {
        "node_id": node_id,
        "topic": topic,
        "video_id": "placeholder",
        "video_title": f"Learn {topic}",
        "start_seconds": 0,
        "end_seconds": 0,
        "thumbnail_url": "",
    }
