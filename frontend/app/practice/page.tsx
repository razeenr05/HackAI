"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { PracticeProblemCard } from "@/components/cards/practice-problem-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Search, Trophy, Target, Flame, Loader2 } from "lucide-react"

interface Problem {
  id: string
  title: string
  description: string
  difficulty: "Easy" | "Medium" | "Hard"
  topic: string
  hint: string
  expectedOutput: string
  isCompleted: boolean
}

function PracticeContent() {
  const searchParams  = useSearchParams()
  const topicFilter   = searchParams.get("topic") || ""

  const [problems, setProblems]   = useState<Problem[]>([])
  const [loading, setLoading]     = useState(true)
  const [searchQuery, setSearch]  = useState(topicFilter)
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  useEffect(() => {
    const url = topicFilter
      ? `http://localhost:8000/api/practice?topic=${encodeURIComponent(topicFilter)}`
      : "http://localhost:8000/api/practice"
    fetch(url)
      .then((r) => r.json())
      .then((data: Problem[]) => { setProblems(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [topicFilter])

  const filtered = problems.filter((p) =>
    !searchQuery ||
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.topic.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const completedCount = completed.size
  const total          = problems.length
  const progress       = total > 0 ? Math.round((completedCount / total) * 100) : 0

  const handleComplete = (id: string) =>
    setCompleted((prev) => { const s = new Set(prev); s.add(id); return s })

  if (loading) return (
    <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" /><span>Loading practice problems...</span>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Practice Problems</h1>
        <p className="text-muted-foreground">
          {topicFilter ? `Showing problems for: ${topicFilter}` : "Sharpen your skills with these exercises"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-success/10 p-2"><Trophy className="h-5 w-5 text-success" /></div>
          <div><p className="text-sm text-muted-foreground">Completed</p>
               <p className="text-xl font-bold">{completedCount}/{total}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2"><Target className="h-5 w-5 text-primary" /></div>
          <div><p className="text-sm text-muted-foreground">Progress</p>
               <p className="text-xl font-bold">{progress}%</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-warning/10 p-2"><Flame className="h-5 w-5 text-warning" /></div>
          <div><p className="text-sm text-muted-foreground">Topics</p>
               <p className="text-xl font-bold">{new Set(problems.map((p) => p.topic)).size}</p></div>
        </CardContent></Card>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Session progress</span>
            <span className="text-sm font-medium">{completedCount}/{total} problems</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent></Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search problems..." value={searchQuery}
          onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Problems */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((p) => (
            <PracticeProblemCard
              key={p.id}
              {...p}
              isCompleted={completed.has(p.id) || p.isCompleted}
              onStart={() => handleComplete(p.id)}
            />
          ))}
        </div>
      ) : (
        <Card><CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            {problems.length === 0
              ? "No practice problems yet. Generate a learning map first!"
              : "No problems match your search."}
          </p>
          {problems.length === 0 && (
            <Button className="mt-3" asChild>
              <a href="/assessment">Go to Skill Assessment →</a>
            </Button>
          )}
        </CardContent></Card>
      )}
    </div>
  )
}

export default function PracticePage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /><span>Loading...</span>
        </div>
      }>
        <PracticeContent />
      </Suspense>
    </AppShell>
  )
}