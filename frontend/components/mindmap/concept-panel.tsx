"use client"

import { useRouter } from "next/navigation"
import { X, BookOpen, Code, Link2, ArrowRight, CheckCircle2, PlayCircle, RotateCcw } from "lucide-react"
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
  onMarkStart?:    (nodeId: string) => void
  onMarkComplete?: (nodeId: string) => void
  onMarkUncomplete?: (nodeId: string) => void
}

const statusLabels: Record<ConceptStatus, { label: string; color: string }> = {
  completed:     { label: "Completed",   color: "bg-success/10 text-success border-success/30"         },
  "in-progress": { label: "In Progress", color: "bg-warning/10 text-warning border-warning/30"         },
  weak:          { label: "Needs Work",  color: "bg-destructive/10 text-destructive border-destructive/30" },
  recommended:   { label: "Recommended", color: "bg-primary/10 text-primary border-primary/30"         },
  locked:        { label: "Locked",      color: "bg-muted text-muted-foreground border-border"         },
}

export function ConceptPanel({ concept, onClose, onMarkStart, onMarkComplete, onMarkUncomplete }: ConceptPanelProps) {
  const router = useRouter()
  if (!concept) return null

  const statusInfo    = statusLabels[concept.status]
  const isCompleted   = concept.status === "completed"
  const isInProgress  = concept.status === "in-progress"
  const isLocked      = concept.status === "locked"
  const isStartable   = concept.status === "recommended" || concept.status === "weak"

  return (
    <div className="absolute right-4 top-4 z-50 w-96 rounded-xl border border-border bg-card shadow-xl">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-card-foreground">{concept.label}</h3>
          <Badge variant="outline" className={statusInfo.color}>{statusInfo.label}</Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)] max-h-[500px]">
        <div className="p-4 space-y-5">

          {/* Skill level */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Skill Level</p>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`h-2 flex-1 rounded-full ${i < concept.level ? "bg-primary" : "bg-muted"}`} />
              ))}
              <span className="text-sm font-medium text-foreground ml-2">{concept.level}/5</span>
            </div>
          </div>

          <Separator />

          {/* Explanation */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Explanation</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{concept.explanation}</p>
          </div>

          {concept.practiceProblems.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">Practice Problems</p>
                </div>
                <div className="space-y-2">
                  {concept.practiceProblems.map((problem, i) => (
                    <div key={i}
                      onClick={() => router.push(`/practice?topic=${encodeURIComponent(concept.label)}`)}
                      className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 cursor-pointer hover:bg-secondary transition-colors">
                      <span className="text-sm text-foreground">{problem}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {concept.resources.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">Learning Resources</p>
                </div>
                <div className="space-y-2">
                  {concept.resources.map((resource, i) => (
                    <div key={i}
                      onClick={() => router.push(`/resources?topic=${encodeURIComponent(concept.label)}`)}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2 cursor-pointer hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{resource.type}</Badge>
                        <span className="text-sm text-foreground line-clamp-1">{resource.title}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {concept.relatedTopics.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Related Topics</p>
                <div className="flex flex-wrap gap-2">
                  {concept.relatedTopics.map((topic) => (
                    <Badge key={topic} variant="secondary" className="cursor-pointer hover:bg-primary/10">{topic}</Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Action buttons */}
      <div className="p-4 border-t border-border space-y-2">
        {isLocked ? (
          <p className="text-center text-sm text-muted-foreground py-1">Complete prerequisites to unlock</p>
        ) : isCompleted ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 py-1 text-sm text-success font-medium">
              <CheckCircle2 className="h-4 w-4" /> Completed!
            </div>
            {onMarkUncomplete && (
              <Button variant="outline" className="w-full text-muted-foreground gap-2"
                onClick={() => onMarkUncomplete(concept.id)}>
                <RotateCcw className="h-4 w-4" /> Mark as Not Started
              </Button>
            )}
          </div>
        ) : isInProgress ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 py-1 text-sm text-warning font-medium">
              <PlayCircle className="h-4 w-4" /> In Progress
            </div>
            {onMarkComplete && (
              <Button className="w-full gap-2" onClick={() => onMarkComplete(concept.id)}>
                <CheckCircle2 className="h-4 w-4" /> Mark as Finished
              </Button>
            )}
            {onMarkUncomplete && (
              <Button variant="outline" className="w-full text-muted-foreground gap-2"
                onClick={() => onMarkUncomplete(concept.id)}>
                <RotateCcw className="h-4 w-4" /> Mark as Not Started
              </Button>
            )}
          </div>
        ) : isStartable ? (
          <div className="space-y-2">
            {onMarkStart && (
              <Button variant="outline" className="w-full gap-2 border-warning/40 text-warning hover:bg-warning/10"
                onClick={() => onMarkStart(concept.id)}>
                <PlayCircle className="h-4 w-4" /> Mark as Started
              </Button>
            )}
            {onMarkComplete && (
              <Button className="w-full gap-2" onClick={() => onMarkComplete(concept.id)}>
                <CheckCircle2 className="h-4 w-4" /> Mark as Finished
              </Button>
            )}
          </div>
        ) : null}

        <Button
          className="w-full"
          variant={isCompleted || isLocked ? "default" : "outline"}
          onClick={() => router.push(`/practice?topic=${encodeURIComponent(concept.label)}`)}>
          Practice This Topic <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}