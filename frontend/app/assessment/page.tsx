"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Sparkles, Loader2, Search, ArrowRight, BookOpen } from "lucide-react"

interface NodeSkill {
  id: string
  label: string
  level: number
  status: string
  description: string
}

export default function AssessmentPage() {
  const router = useRouter()
  const [goal,         setGoal]         = useState("")
  const [generating,   setGenerating]   = useState(false)
  const [genStatus,    setGenStatus]    = useState<"idle" | "success" | "error">("idle")
  const [nodes,        setNodes]        = useState<NodeSkill[]>([])
  const [loadingNodes, setLoadingNodes] = useState(true)
  const [savedGoal,    setSavedGoal]    = useState("")

  useEffect(() => {
    const uid = localStorage.getItem("hackai_user_id") || "user-1"
    const localGoal = localStorage.getItem("hackai_goal") || ""

    fetch(`http://localhost:8000/api/goal/${uid}`)
      .then(r => r.json())
      .then(d => { const g = d.goal || localGoal; setSavedGoal(g); setGoal(g) })
      .catch(() => { setSavedGoal(localGoal); setGoal(localGoal) })

    fetch(`http://localhost:8000/api/mindmap/${uid}`)
      .then(r => r.json())
      .then(d => {
        setNodes((d.nodes || []).map((n: any) => ({
          id: n.id, label: n.data.label, level: n.data.level,
          status: n.data.status, description: n.data.description || "",
        })))
        setLoadingNodes(false)
      })
      .catch(() => setLoadingNodes(false))
  }, [])

  const handleGenerate = async () => {
    if (!goal.trim()) return
    setGenerating(true); setGenStatus("idle")
    const uid = localStorage.getItem("hackai_user_id") || "user-1"
    try {
      await fetch(`http://localhost:8000/api/graph/${uid}`, { method: "DELETE" })
      const res = await fetch("http://localhost:8000/api/generate-graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: uid, goal: goal.trim(), force: true }),
      })
      if (!res.ok) throw new Error("failed")
      localStorage.setItem("hackai_goal", goal.trim())
      setSavedGoal(goal.trim())
      setGenStatus("success")
      setTimeout(() => router.push("/mindmap"), 900)
    } catch { setGenStatus("error") }
    finally { setGenerating(false) }
  }

  const completedCount = nodes.filter(n => n.status === "completed").length
  const avgLevel = nodes.length > 0 ? (nodes.reduce((s, n) => s + n.level, 0) / nodes.length).toFixed(1) : "—"

  const statusColors: Record<string, string> = {
    completed:     "bg-success/10 text-success border-success/30",
    "in-progress": "bg-warning/10 text-warning border-warning/30",
    weak:          "bg-destructive/10 text-destructive border-destructive/30",
    recommended:   "bg-primary/10 text-primary border-primary/30",
    locked:        "bg-muted text-muted-foreground",
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Skill Assessment</h1>
          <p className="text-muted-foreground">Enter a topic to generate your personalised learning graph.</p>
        </div>

        {/* Goal Input */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">What do you want to learn?</CardTitle>
            </div>
            <CardDescription>Any topic — machine learning, quantum physics, guitar, cooking…</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="e.g. machine learning, quantum physics, guitar..."
                  value={goal} onChange={e => { setGoal(e.target.value); setGenStatus("idle") }}
                  onKeyDown={e => e.key === "Enter" && handleGenerate()} className="pl-9" />
              </div>
              <Button onClick={handleGenerate} disabled={!goal.trim() || generating}>
                {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
                  : <><Sparkles className="mr-2 h-4 w-4" />Generate</>}
              </Button>
            </div>
            {genStatus === "success" && (
              <div className="flex items-center gap-2 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" /> Graph generated! Redirecting to mind map...
              </div>
            )}
            {genStatus === "error" && (
              <p className="text-sm text-destructive">Generation failed — make sure the backend is running.</p>
            )}
            {savedGoal && savedGoal !== goal && (
              <p className="text-xs text-muted-foreground">
                Current topic: <span className="text-primary font-medium">{savedGoal}</span>
                {" · "}<button onClick={() => router.push("/mindmap")} className="underline hover:text-foreground">View mind map →</button>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Progress summary */}
        {savedGoal && nodes.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Topic</p>
                    <p className="text-xl font-bold text-primary truncate max-w-[200px]">{savedGoal}</p>
                  </div>
                  <div className="h-10 w-px bg-border" />
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold text-foreground">{completedCount}/{nodes.length}</p>
                  </div>
                  <div className="h-10 w-px bg-border" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Level</p>
                    <p className="text-2xl font-bold text-primary">{avgLevel}/5</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => router.push("/mindmap")}>
                    <BookOpen className="mr-2 h-4 w-4" />Mind Map
                  </Button>
                  <Button size="sm" onClick={() => router.push("/practice")}>
                    Practice <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Completion</span>
                  <span className="text-sm font-medium">{Math.round((completedCount / nodes.length) * 100)}%</span>
                </div>
                <Progress value={(completedCount / nodes.length) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Node grid */}
        {loadingNodes ? (
          <div className="flex items-center gap-3 text-muted-foreground py-8 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" /><span>Loading your graph...</span>
          </div>
        ) : nodes.length > 0 ? (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Knowledge Nodes — {savedGoal}</CardTitle>
                <Badge variant="secondary">{nodes.length} topics</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                {nodes.map(node => (
                  <div key={node.id}
                    onClick={() => router.push(`/practice?topic=${encodeURIComponent(node.label)}`)}
                    className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer hover:border-primary/30 hover:bg-secondary/30 transition-all">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="font-medium text-foreground text-sm truncate">{node.label}</p>
                      {node.description && <p className="text-xs text-muted-foreground truncate">{node.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className={`h-2 w-2 rounded-full ${i < node.level ? "bg-primary" : "bg-muted"}`} />
                        ))}
                      </div>
                      <Badge variant="outline" className={`text-xs ${statusColors[node.status] || ""}`}>
                        {node.status === "in-progress" ? "In Progress" : node.status.charAt(0).toUpperCase() + node.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-10 text-center space-y-2">
              <Sparkles className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="font-medium text-foreground">No learning graph yet</p>
              <p className="text-sm text-muted-foreground">Enter a topic above and hit Generate.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}