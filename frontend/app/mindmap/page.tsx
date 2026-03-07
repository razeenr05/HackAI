"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { KnowledgeGraph } from "@/components/mindmap/knowledge-graph"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

const legendItems = [
  { status: "Completed",   color: "bg-success" },
  { status: "In Progress", color: "bg-warning" },
  { status: "Weak",        color: "bg-destructive" },
  { status: "Recommended", color: "bg-primary" },
  { status: "Locked",      color: "bg-muted" },
]

export default function MindMapPage() {
  const router = useRouter()
  const [goal, setGoal] = useState("")

  useEffect(() => {
    const stored = localStorage.getItem("hackai_goal")
    if (stored) setGoal(stored)
  }, [])

  return (
    <AppShell>
      <div className="space-y-4 h-[calc(100vh-8rem)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {goal ? `Learning: ${goal}` : "Learning Mind Map"}
            </h1>
            <p className="text-muted-foreground">
              Explore your knowledge graph and discover learning paths
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Legend */}
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

            {/* Change topic button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/learn")}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              New Topic
            </Button>
          </div>
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
