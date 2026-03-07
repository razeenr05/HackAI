"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Lightbulb, Code, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Difficulty = "Easy" | "Medium" | "Hard"

interface PracticeProblemCardProps {
  id: string
  title: string
  description: string
  difficulty: Difficulty
  topic: string
  hint: string
  expectedOutput: string
  isCompleted?: boolean
  onStart?: () => void
}

const difficultyConfig: Record<Difficulty, { color: string; bg: string }> = {
  Easy: { color: "text-success", bg: "bg-success/10 border-success/30" },
  Medium: { color: "text-warning", bg: "bg-warning/10 border-warning/30" },
  Hard: { color: "text-destructive", bg: "bg-destructive/10 border-destructive/30" },
}

export function PracticeProblemCard({
  id,
  title,
  description,
  difficulty,
  topic,
  hint,
  expectedOutput,
  isCompleted = false,
  onStart,
}: PracticeProblemCardProps) {
  const [showHint, setShowHint] = useState(false)
  const [showOutput, setShowOutput] = useState(false)
  const config = difficultyConfig[difficulty]

  return (
    <Card className={cn("transition-all", isCompleted && "border-success/30 bg-success/5")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              {isCompleted && (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              )}
              <h3 className="font-semibold text-card-foreground">{title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-xs", config.bg, config.color)}>
                {difficulty}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {topic}
              </Badge>
            </div>
          </div>
          <Button size="sm" onClick={onStart} disabled={isCompleted}>
            {isCompleted ? "Completed" : "Start"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>

        {/* Hint Section */}
        <div className="rounded-lg border border-border">
          <button
            onClick={() => setShowHint(!showHint)}
            className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors rounded-t-lg"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-warning" />
              <span>Hint</span>
            </div>
            {showHint ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {showHint && (
            <div className="px-3 py-2 border-t border-border bg-secondary/30">
              <p className="text-sm text-muted-foreground">{hint}</p>
            </div>
          )}
        </div>

        {/* Expected Output Section */}
        <div className="rounded-lg border border-border">
          <button
            onClick={() => setShowOutput(!showOutput)}
            className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors rounded-t-lg"
          >
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-primary" />
              <span>Expected Output</span>
            </div>
            {showOutput ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {showOutput && (
            <div className="px-3 py-2 border-t border-border bg-secondary/30">
              <code className="text-sm text-foreground font-mono">{expectedOutput}</code>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
