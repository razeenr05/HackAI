"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AppShell } from "@/components/app-shell"

const suggestions = [
  "basketball fundamentals",
  "how to cook Italian food",
  "machine learning",
  "music theory",
  "photography",
  "investing and finance",
  "web development",
  "speak Spanish",
  "chess strategy",
  "video editing",
]

// Hardcoded for now — swap for real auth later
const USER_ID = "user-1"

export default function LearnPage() {
  const router = useRouter()
  const [goal, setGoal] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch("http://localhost:8000/api/generate-graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: USER_ID, goal: trimmed, force: true }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || "Failed to generate graph")
      }

      // Store the goal so the mindmap page can show it
      localStorage.setItem("hackai_goal", trimmed)
      localStorage.setItem("hackai_user_id", USER_ID)

      router.push("/mindmap")
    } catch (err: any) {
      setError(err.message || "Something went wrong. Try again.")
      setLoading(false)
    }
  }

  return (
    <AppShell>
    <div className="min-h-screen bg-background bg-page-gradient flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8 stagger-reveal">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="text-3xl font-bold text-foreground tracking-tight">HackAI</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground leading-tight tracking-tight">
            What do you want to learn?
          </h1>
          <p className="text-muted-foreground text-lg">
            Type anything — AI will build you a personalized learning path.
          </p>
        </div>

        {/* Input */}
        <Card className="border-border/80 shadow-lg shadow-primary/5">
          <CardContent className="p-6 space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="e.g. basketball, machine learning, cooking..."
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit(goal)}
                className="text-base h-12"
                disabled={loading}
                autoFocus
              />
              <Button
                onClick={() => handleSubmit(goal)}
                disabled={!goal.trim() || loading}
                className="h-12 px-6 shrink-0"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Start
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            {loading && (
              <p className="text-sm text-muted-foreground text-center animate-pulse">
                AI is building your learning path...
              </p>
            )}

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </CardContent>
        </Card>

        {/* Suggestions */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">Or try one of these</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((s) => (
              <Badge
                key={s}
                variant="secondary"
                className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors px-3 py-1 text-sm"
                onClick={() => !loading && handleSubmit(s)}
              >
                {s}
              </Badge>
            ))}
          </div>
        </div>

      </div>
    </div>
    </AppShell>
  )
}