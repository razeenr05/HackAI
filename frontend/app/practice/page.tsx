"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { PracticeProblemCard } from "@/components/cards/practice-problem-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Filter, Shuffle, Trophy, Target, Flame } from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuCheckboxItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function PracticePage() {
  const searchParams = useSearchParams()
  const topicParam = searchParams.get("topic") || ""

  const [problems, setProblems] = useState<any[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    topicParam ? [topicParam] : []
  )
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    const url = topicParam
      ? `http://localhost:8000/api/practice?topic=${encodeURIComponent(topicParam)}`
      : "http://localhost:8000/api/practice"

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setProblems(data)
        const uniqueTopics = Array.from(new Set(data.map((p: any) => p.topic))) as string[]
        setTopics(uniqueTopics)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const completedCount = problems.filter((p) => p.isCompleted).length
  const totalCount = problems.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const filtered = problems.filter((p) => {
    if (activeTab === "completed" && !p.isCompleted) return false
    if (activeTab === "pending" && p.isCompleted) return false
    if (selectedTopics.length > 0 && !selectedTopics.includes(p.topic)) return false
    return true
  })

  const toggleTopic = (topic: string) =>
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    )

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Practice Problems</h1>
            <p className="text-muted-foreground">Sharpen your skills with curated challenges</p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                  {selectedTopics.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{selectedTopics.length}</Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {topics.map((topic) => (
                  <DropdownMenuCheckboxItem
                    key={topic}
                    checked={selectedTopics.includes(topic)}
                    onCheckedChange={() => toggleTopic(topic)}
                  >
                    {topic}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const pending = problems.filter((p) => !p.isCompleted)
                if (pending.length > 0) {
                  const random = pending[Math.floor(Math.random() * pending.length)]
                  setSelectedTopics([random.topic])
                }
              }}
            >
              <Shuffle className="mr-2 h-4 w-4" />
              Random
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-xl font-bold text-foreground">{loading ? "—" : `${completedCount}/${totalCount}`}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-success/10 p-2">
                  <Trophy className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-xl font-bold text-foreground">{loading ? "—" : completedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-warning/10 p-2">
                  <Flame className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Topics</p>
                  <p className="text-xl font-bold text-foreground">{loading ? "—" : topics.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Completion</p>
                  <p className="text-sm font-medium text-foreground">{Math.round(progress)}%</p>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Problems</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                {filtered.map((p) => (
                  <PracticeProblemCard
                    key={p.id}
                    {...p}
                    onStart={() => console.log(`Starting problem ${p.id}`)}
                  />
                ))}
              </div>
              {filtered.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No problems match your filters.</p>
                    <Button variant="link" onClick={() => { setSelectedTopics([]); setActiveTab("all") }}>
                      Clear filters
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppShell>
  )
}
