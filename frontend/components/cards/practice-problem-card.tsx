"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Lightbulb, Code, CheckCircle2, X, Send, Loader2, Trophy, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
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

interface GradeResult {
  correct: boolean
  score: number
  feedback: string
  model_answer: string
}

const difficultyConfig: Record<Difficulty, { color: string; bg: string }> = {
  Easy:   { color: "text-success",     bg: "bg-success/10 border-success/30"     },
  Medium: { color: "text-warning",     bg: "bg-warning/10 border-warning/30"     },
  Hard:   { color: "text-destructive", bg: "bg-destructive/10 border-destructive/30" },
}

export function PracticeProblemCard({
  id, title, description, difficulty, topic, hint, expectedOutput, isCompleted = false, onStart,
}: PracticeProblemCardProps) {
  const [showHint,    setShowHint]    = useState(false)
  const [showOutput,  setShowOutput]  = useState(false)
  const [modalOpen,   setModalOpen]   = useState(false)
  const [answer,      setAnswer]      = useState("")
  const [grading,     setGrading]     = useState(false)
  const [result,      setResult]      = useState<GradeResult | null>(null)
  const [completed,   setCompleted]   = useState(isCompleted)

  const config = difficultyConfig[difficulty]

  const handleStart = () => {
    setResult(null)
    setAnswer("")
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!answer.trim()) return
    setGrading(true)
    try {
      const res = await fetch("http://localhost:8000/api/grade-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: title, topic, user_answer: answer }),
      })
      const data: GradeResult = await res.json()
      setResult(data)
      if (data.score >= 70) {
        setCompleted(true)
        onStart?.()
      }
    } catch {
      setResult({
        correct: false,
        score: 0,
        feedback: "Could not connect to grading service. Make sure the backend is running.",
        model_answer: "",
      })
    } finally {
      setGrading(false)
    }
  }

  const handleClose = () => {
    setModalOpen(false)
    setResult(null)
    setAnswer("")
  }

  return (
    <>
      <Card className={cn("transition-all", completed && "border-success/30 bg-success/5")}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                {completed && <CheckCircle2 className="h-4 w-4 text-success shrink-0" />}
                <h3 className="font-semibold text-card-foreground">{title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("text-xs", config.bg, config.color)}>{difficulty}</Badge>
                <Badge variant="secondary" className="text-xs">{topic}</Badge>
              </div>
            </div>
            <Button size="sm" onClick={handleStart} disabled={completed}
              className={completed ? "pointer-events-none" : ""}>
              {completed ? "Completed" : "Start"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>

          <div className="rounded-lg border border-border">
            <button onClick={() => setShowHint(!showHint)}
              className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors rounded-t-lg">
              <div className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-warning" /><span>Hint</span></div>
              {showHint ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {showHint && <div className="px-3 py-2 border-t border-border bg-secondary/30"><p className="text-sm text-muted-foreground">{hint}</p></div>}
          </div>

          <div className="rounded-lg border border-border">
            <button onClick={() => setShowOutput(!showOutput)}
              className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors rounded-t-lg">
              <div className="flex items-center gap-2"><Code className="h-4 w-4 text-primary" /><span>Expected Output</span></div>
              {showOutput ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {showOutput && <div className="px-3 py-2 border-t border-border bg-secondary/30"><code className="text-sm text-foreground font-mono">{expectedOutput}</code></div>}
          </div>
        </CardContent>
      </Card>

      {/* Answer Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-border gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={cn("text-xs", config.bg, config.color)}>{difficulty}</Badge>
                  <Badge variant="secondary" className="text-xs">{topic}</Badge>
                </div>
                <h2 className="text-lg font-semibold text-card-foreground leading-snug">{title}</h2>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>

              {/* Hint (always visible in modal) */}
              <div className="rounded-lg bg-warning/5 border border-warning/20 px-4 py-3 flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">{hint}</p>
              </div>

              {/* Answer input — only show if not yet graded */}
              {!result && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Your Answer</label>
                  <Textarea
                    placeholder="Type your answer here..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows={5}
                    className="resize-none"
                  />
                </div>
              )}

              {/* Grading Result */}
              {result && (
                <div className={cn("rounded-xl border p-5 space-y-4",
                  result.score >= 70 ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5")}>

                  {/* Score header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {result.score >= 70
                        ? <Trophy className="h-5 w-5 text-success" />
                        : <AlertCircle className="h-5 w-5 text-destructive" />}
                      <span className={cn("font-semibold text-lg", result.score >= 70 ? "text-success" : "text-destructive")}>
                        {result.score >= 70 ? "Great work!" : "Keep practicing!"}
                      </span>
                    </div>
                    <span className={cn("text-2xl font-bold", result.score >= 70 ? "text-success" : "text-destructive")}>
                      {result.score}/100
                    </span>
                  </div>

                  <Progress value={result.score} className={cn("h-2", result.score >= 70 ? "[&>div]:bg-success" : "[&>div]:bg-destructive")} />

                  {/* AI Feedback */}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Feedback</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{result.feedback}</p>
                  </div>

                  {/* Model answer */}
                  <div className="rounded-lg bg-secondary/50 border border-border p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Model Answer</p>
                    <p className="text-sm text-foreground leading-relaxed">{result.model_answer}</p>
                  </div>

                  {/* Your submitted answer */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Your Answer</p>
                    <p className="text-sm text-foreground/70 italic leading-relaxed">{answer}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-border flex gap-3">
              {!result ? (
                <>
                  <Button variant="outline" onClick={handleClose} className="flex-1">Cancel</Button>
                  <Button onClick={handleSubmit} disabled={!answer.trim() || grading} className="flex-1">
                    {grading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Grading...</>
                    ) : (
                      <><Send className="mr-2 h-4 w-4" /> Submit Answer</>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => { setResult(null); setAnswer("") }} className="flex-1">
                    Try Again
                  </Button>
                  <Button onClick={handleClose} className="flex-1">
                    {result.score >= 70 ? "Completed ✓" : "Close"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}