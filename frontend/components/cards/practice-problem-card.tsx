"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Lightbulb, CheckCircle2, XCircle, Loader2, Trophy, AlertCircle } from "lucide-react"
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

interface ChoicesResult {
  choices: string[]
  correct_index: number
  explanation: string
}

const difficultyConfig: Record<Difficulty, { color: string; bg: string }> = {
  Easy:   { color: "text-success",     bg: "bg-success/10 border-success/30"     },
  Medium: { color: "text-warning",     bg: "bg-warning/10 border-warning/30"     },
  Hard:   { color: "text-destructive", bg: "bg-destructive/10 border-destructive/30" },
}

const letters = ["A", "B", "C", "D"]

export function PracticeProblemCard({
  id, title, description, difficulty, topic, hint, isCompleted = false, onStart,
}: PracticeProblemCardProps) {
  const [showHint,    setShowHint]    = useState(false)
  const [modalOpen,   setModalOpen]   = useState(false)
  const [loadingMC,   setLoadingMC]   = useState(false)
  const [choices,     setChoices]     = useState<ChoicesResult | null>(null)
  const [selected,    setSelected]    = useState<number | null>(null)
  const [submitted,   setSubmitted]   = useState(false)
  const [completed,   setCompleted]   = useState(isCompleted)

  const config = difficultyConfig[difficulty]

  const handleStart = async () => {
    setSelected(null)
    setSubmitted(false)
    setChoices(null)
    setModalOpen(true)
    setLoadingMC(true)
    try {
      const res = await fetch("http://localhost:8000/api/generate-choices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: title, topic }),
      })
      const data: ChoicesResult = await res.json()
      setChoices(data)
    } catch {
      // Fallback placeholder choices
      setChoices({
        choices: ["Could not load choices — check backend", "Try Again", "Reload the page", "Check your connection"],
        correct_index: 0,
        explanation: "Backend not reachable."
      })
    } finally {
      setLoadingMC(false)
    }
  }

  const handleSubmit = () => {
    if (selected === null || !choices) return
    setSubmitted(true)
    if (selected === choices.correct_index) {
      setCompleted(true)
      onStart?.()
    }
  }

  const handleClose = () => {
    setModalOpen(false)
    setSelected(null)
    setSubmitted(false)
  }

  const isCorrect = submitted && selected === choices?.correct_index
  const isWrong   = submitted && selected !== choices?.correct_index

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
              {completed ? "Completed ✓" : "Start"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>

          {/* Hint toggle */}
          <div className="rounded-lg border border-border">
            <button onClick={() => setShowHint(!showHint)}
              className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors rounded-lg">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-warning" />
                <span>Hint</span>
              </div>
              {showHint ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {showHint && (
              <div className="px-3 pb-3 pt-1 text-sm text-muted-foreground border-t border-border">{hint}</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={cn("text-xs", config.bg, config.color)}>{difficulty}</Badge>
                <Badge variant="secondary" className="text-xs">{topic}</Badge>
              </div>
              <h2 className="text-lg font-semibold text-card-foreground mt-2">{title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">

              {loadingMC ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-sm">Generating choices...</span>
                </div>
              ) : choices ? (
                <>
                  <p className="text-sm font-medium text-foreground">Choose the best answer:</p>

                  <div className="space-y-2">
                    {choices.choices.map((choice, i) => {
                      const isSelected  = selected === i
                      const isThisRight = submitted && i === choices.correct_index
                      const isThisWrong = submitted && isSelected && i !== choices.correct_index

                      return (
                        <button
                          key={i}
                          disabled={submitted}
                          onClick={() => !submitted && setSelected(i)}
                          className={cn(
                            "w-full text-left rounded-xl border-2 px-4 py-3 text-sm transition-all flex items-center gap-3",
                            // Default unselected
                            !isSelected && !isThisRight && "border-border hover:border-primary/40 hover:bg-primary/5",
                            // Selected but not submitted
                            isSelected && !submitted && "border-primary bg-primary/10 text-primary",
                            // Correct after submit
                            isThisRight && "border-success bg-success/10 text-success",
                            // Wrong after submit
                            isThisWrong && "border-destructive bg-destructive/10 text-destructive",
                            submitted && !isSelected && !isThisRight && "opacity-50",
                          )}
                        >
                          <span className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2",
                            !isSelected && !isThisRight && !submitted && "border-border text-muted-foreground",
                            isSelected && !submitted && "border-primary bg-primary text-primary-foreground",
                            isThisRight && "border-success bg-success text-white",
                            isThisWrong && "border-destructive bg-destructive text-white",
                            submitted && !isSelected && !isThisRight && "border-border/50 text-muted-foreground/50",
                          )}>
                            {submitted && isThisRight ? <CheckCircle2 className="h-4 w-4" /> :
                             submitted && isThisWrong ? <XCircle className="h-4 w-4" /> :
                             letters[i]}
                          </span>
                          <span className="flex-1">{choice}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Result */}
                  {submitted && (
                    <div className={cn(
                      "rounded-xl border p-4 space-y-2",
                      isCorrect ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"
                    )}>
                      <div className="flex items-center gap-2">
                        {isCorrect
                          ? <><Trophy className="h-5 w-5 text-success" /><span className="font-semibold text-success">Correct!</span></>
                          : <><AlertCircle className="h-5 w-5 text-destructive" /><span className="font-semibold text-destructive">Not quite!</span></>
                        }
                      </div>
                      <p className="text-sm text-muted-foreground">{choices.explanation}</p>
                      {!isCorrect && (
                        <p className="text-sm text-foreground">
                          Correct answer: <span className="font-medium text-success">{choices.choices[choices.correct_index]}</span>
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border flex gap-3">
              {!submitted ? (
                <>
                  <Button variant="outline" onClick={handleClose} className="flex-1">Cancel</Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={selected === null || loadingMC}
                    className="flex-1"
                  >
                    Submit Answer
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => { setSubmitted(false); setSelected(null) }} className="flex-1">
                    Try Again
                  </Button>
                  <Button onClick={handleClose} className="flex-1">
                    {isCorrect ? "Done ✓" : "Close"}
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