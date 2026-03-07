"use client"

import { AppShell } from "@/components/app-shell"
import { KnowledgeGraph } from "@/components/mindmap/knowledge-graph"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const legendItems = [
  { status: "Completed", color: "bg-success", description: "Mastered concepts" },
  { status: "In Progress", color: "bg-warning", description: "Currently learning" },
  { status: "Weak", color: "bg-destructive", description: "Needs improvement" },
  { status: "Recommended", color: "bg-primary", description: "Suggested next" },
  { status: "Locked", color: "bg-muted", description: "Prerequisites needed" },
]

export default function MindMapPage() {
  return (
    <AppShell>
      <div className="space-y-4 h-[calc(100vh-8rem)]">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Learning Mind Map</h1>
            <p className="text-muted-foreground">
              Explore your knowledge graph and discover learning paths
            </p>
          </div>
          
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
        </div>

        {/* Mind Map Container */}
        <Card className="flex-1 overflow-hidden h-[calc(100%-5rem)]">
          <CardContent className="p-0 h-full">
            <KnowledgeGraph />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
