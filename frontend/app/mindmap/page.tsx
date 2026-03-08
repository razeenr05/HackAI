"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { KnowledgeGraph } from "@/components/mindmap/knowledge-graph"
import { Card, CardContent } from "@/components/ui/card"

const legendItems = [
  { status: "Completed",   color: "bg-success"    },
  { status: "In Progress", color: "bg-warning"     },
  { status: "Weak",        color: "bg-destructive" },
  { status: "Recommended", color: "bg-primary"     },
  { status: "Locked",      color: "bg-muted"       },
]

export default function MindMapPage() {
  const [goal, setGoal] = useState("")

  useEffect(() => {
    const userId = localStorage.getItem("hackai_user_id") || "user-1"
    // Always fetch goal from the backend (source of truth) to avoid stale localStorage
    fetch(`http://localhost:8000/api/goal/${userId}`)
      .then((r) => r.json())
      .then((d) => {
        const g = d.goal || localStorage.getItem("hackai_goal") || "your topic"
        setGoal(g)
        // Keep localStorage in sync
        if (d.goal) localStorage.setItem("hackai_goal", d.goal)
      })
      .catch(() => setGoal(localStorage.getItem("hackai_goal") || "your topic"))
  }, [])

  return (
    <AppShell>
      <div className="space-y-4 h-[calc(100vh-8rem)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Learning: <span className="text-primary">{goal}</span>
            </h1>
            <p className="text-muted-foreground">Explore your knowledge graph and discover learning paths</p>
          </div>

          <Card className="shrink-0">
            <CardContent className="p-3">
              <div className="flex flex-wrap items-center gap-3">
                {legendItems.map((item) => (
                  <div key={item.status} className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${item.color}`} />
                    <span className="text-xs text-muted-foreground">{item.status}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="flex-1 overflow-hidden h-[calc(100%-5rem)]">
          <CardContent className="p-0 h-full">
            <KnowledgeGraph />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}