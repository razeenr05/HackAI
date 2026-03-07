"use client"

import { useRouter } from "next/navigation"
import { X, BookOpen, Code, Link2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ConceptStatus } from "./concept-node"

interface ConceptPanelProps {
  concept: {
    id: string
    label: string
    status: ConceptStatus
    level: number
    description: string
    explanation: string
    practiceProblems: string[]
    resources: { title: string; type: string }[]
    relatedTopics: string[]
  } | null
  onClose: () => void
}

const statusLabels: Record<ConceptStatus, { label: string; color: string }> = {
  completed: { label: "Completed", color: "bg-success/10 text-success border-success/30" },
  "in-progress": { label: "In Progress", color: "bg-warning/10 text-warning border-warning/30" },
  weak: { label: "Needs Work", color: "bg-destructive/10 text-destructive border-destructive/30" },
  recommended: { label: "Recommended", color: "bg-primary/10 text-primary border-primary/30" },
  locked: { label: "Locked", color: "bg-muted text-muted-foreground border-border" },
}

export function ConceptPanel({ concept, onClose }: ConceptPanelProps) {
  const router = useRouter()
  
  if (!concept) return null

  const statusInfo = statusLabels[concept.status]
  
  const handleStartLearning = () => {
    router.push(`/practice?topic=${encodeURIComponent(concept.label)}`)
  }
  
  const handlePracticeClick = () => {
    router.push(`/practice?topic=${encodeURIComponent(concept.label)}`)
  }
  
  const handleResourceClick = () => {
    router.push(`/resources?topic=${encodeURIComponent(concept.label)}`)
  }

  return (
    <div className="absolute right-4 top-4 z-50 w-96 rounded-xl border border-border bg-card shadow-xl">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-card-foreground">{concept.label}</h3>
          <Badge variant="outline" className={statusInfo.color}>
            {statusInfo.label}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)] max-h-[500px]">
        <div className="p-4 space-y-5">
          {/* Skill Level */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Skill Level</p>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full ${
                    i < concept.level ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
              <span className="text-sm font-medium text-foreground ml-2">
                {concept.level}/5
              </span>
            </div>
          </div>

          <Separator />

          {/* Explanation */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Explanation</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {concept.explanation}
            </p>
          </div>

          <Separator />

          {/* Practice Problems */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Code className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Practice Problems</p>
            </div>
            <div className="space-y-2">
              {concept.practiceProblems.map((problem, i) => (
                <div
                  key={i}
                  onClick={handlePracticeClick}
                  className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 cursor-pointer hover:bg-secondary transition-colors"
                >
                  <span className="text-sm text-foreground">{problem}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Resources */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Learning Resources</p>
            </div>
            <div className="space-y-2">
              {concept.resources.map((resource, i) => (
                <div
                  key={i}
                  onClick={handleResourceClick}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 cursor-pointer hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {resource.type}
                    </Badge>
                    <span className="text-sm text-foreground">{resource.title}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Related Topics */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Related Topics</p>
            <div className="flex flex-wrap gap-2">
              {concept.relatedTopics.map((topic) => (
                <Badge key={topic} variant="secondary" className="cursor-pointer hover:bg-primary/10">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <Button className="w-full" onClick={handleStartLearning}>
          Start Learning
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
