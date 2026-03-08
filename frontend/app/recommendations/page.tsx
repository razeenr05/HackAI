"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Lightbulb, TrendingUp, Target, ArrowRight, Sparkles,
  Brain, BarChart3, CheckCircle2, Zap, BookOpen, Loader2,
} from "lucide-react"

interface Recommendation {
  id: string
  topic: string
  category: string
  reason: string
  currentLevel: number
  predictedLevel: number
  timeEstimate: string
  priority: "High" | "Medium" | "Low"
  prerequisites: string[]
  benefits: string[]
  learningPath: { step: string; completed: boolean }[]
}

interface SkillPrediction {
  skill: string
  current: number
  predicted: number
  change: string
}

interface QuickWin {
  topic: string
  time: string
  boost: string
}

interface RecommendationsData {
  recommendations: Recommendation[]
  skillPredictions: SkillPrediction[]
  quickWins: QuickWin[]
}

const priorityColors = {
  High:   "bg-destructive/10 text-destructive border-destructive/30",
  Medium: "bg-warning/10 text-warning border-warning/30",
  Low:    "bg-primary/10 text-primary border-primary/30",
}

export default function RecommendationsPage() {
  const router = useRouter()
  const [data, setData]       = useState<RecommendationsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [goal, setGoal]       = useState("")

  const loadData = async () => {
    setLoading(true)
    const userId = localStorage.getItem("hackai_user_id") || "user-1"
    setGoal(localStorage.getItem("hackai_goal") || "your topic")
    try {
      const res = await fetch(`http://localhost:8000/api/recommendations/${userId}`)
      if (!res.ok) throw new Error("Failed")
      const d = await res.json()
      setData(d)
    } catch {
      setData({ recommendations: [], skillPredictions: [], quickWins: [] })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  if (loading) return (
    <AppShell>
      <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /><span>Loading recommendations...</span>
      </div>
    </AppShell>
  )

  const { recommendations = [], skillPredictions = [], quickWins = [] } = data ?? {}
  const highPriority = recommendations.filter(r => r.priority === "High")

  const EmptyState = () => (
    <Card><CardContent className="p-10 text-center space-y-3">
      <Brain className="h-10 w-10 text-muted-foreground mx-auto" />
      <p className="font-medium text-foreground">No recommendations yet</p>
      <p className="text-sm text-muted-foreground">Generate a learning map first to get personalised recommendations.</p>
      <Button onClick={() => router.push("/assessment")}>Get Started →</Button>
    </CardContent></Card>
  )

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Recommendation Insights</h1>
            <p className="text-muted-foreground">
              AI-powered recommendations for: <span className="text-primary font-medium">{goal}</span>
            </p>
          </div>
          <Button onClick={loadData}>
            <Sparkles className="mr-2 h-4 w-4" /> Refresh Insights
          </Button>
        </div>

        {/* Skill Improvement Prediction */}
        {skillPredictions.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Skill Improvement Prediction</CardTitle>
              </div>
              <CardDescription>Projected skill levels after completing recommended paths</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                {skillPredictions.map((item) => (
                  <div key={item.skill} className="rounded-lg border border-border bg-secondary/30 p-4">
                    <p className="text-sm font-medium text-foreground truncate">{item.skill}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-foreground">{item.predicted}</span>
                      <span className="text-sm text-muted-foreground">/ 5</span>
                      <Badge className="ml-auto bg-success/10 text-success border-success/30 text-xs">{item.change}</Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-muted-foreground/30 rounded-full" style={{ width: `${(item.current / 5) * 100}%` }} />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(item.predicted / 5) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Recommendations</TabsTrigger>
            <TabsTrigger value="high">High Priority{highPriority.length > 0 && ` (${highPriority.length})`}</TabsTrigger>
            <TabsTrigger value="quick-wins">Quick Wins</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {recommendations.length === 0 ? <EmptyState /> : recommendations.map((rec, index) => (
              <Card key={rec.id} className="overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                  <div className="flex-1 p-6">
                    <div className="flex flex-wrap items-start gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <span className="text-sm font-bold text-primary">{index + 1}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-card-foreground">{rec.topic}</h3>
                          <p className="text-xs text-muted-foreground">{rec.category}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 ml-auto">
                        <Badge variant="outline" className={priorityColors[rec.priority]}>{rec.priority} Priority</Badge>
                        <Badge variant="secondary">{rec.timeEstimate}</Badge>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 mb-4 rounded-lg bg-primary/5 p-3">
                      <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm text-foreground">{rec.reason}</p>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-warning" /> Benefits
                      </p>
                      <ul className="space-y-1">
                        {rec.benefits.map((b, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-3 w-3 text-success shrink-0" />{b}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {rec.prerequisites.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Prerequisites:</span>
                        <div className="flex flex-wrap gap-1">
                          {rec.prerequisites.map((p) => (
                            <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t lg:border-t-0 lg:border-l border-border bg-secondary/20 p-6 lg:w-80">
                    <div className="mb-5">
                      <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" /> Skill Improvement
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <span className="block text-2xl font-bold text-muted-foreground">{rec.currentLevel}</span>
                          <span className="text-xs text-muted-foreground">Current</span>
                        </div>
                        <ArrowRight className="h-5 w-5 text-primary" />
                        <div className="text-center">
                          <span className="block text-2xl font-bold text-success">{rec.predictedLevel}</span>
                          <span className="text-xs text-muted-foreground">Predicted</span>
                        </div>
                        <Badge className="ml-auto bg-success/10 text-success border-success/30">
                          +{rec.predictedLevel - rec.currentLevel} levels
                        </Badge>
                      </div>
                    </div>

                    <div className="mb-5">
                      <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" /> Learning Path
                      </p>
                      <div className="space-y-2">
                        {rec.learningPath.map((step, i) => (
                          <div key={i} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                            step.completed ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                          }`}>
                            {step.completed
                              ? <CheckCircle2 className="h-4 w-4 shrink-0" />
                              : <div className="h-4 w-4 rounded-full border-2 border-current shrink-0" />}
                            <span className="line-clamp-1">{step.step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full" onClick={() => router.push(`/practice?topic=${encodeURIComponent(rec.topic)}`)}>
                      Start Learning <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="high" className="space-y-4">
            {highPriority.length === 0
              ? <Card><CardContent className="p-8 text-center text-muted-foreground">No high-priority gaps detected — great progress!</CardContent></Card>
              : highPriority.map((rec) => (
                <Card key={rec.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                      <Target className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-card-foreground">{rec.topic}</h3>
                        <Badge variant="outline" className={priorityColors[rec.priority]}>{rec.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{rec.reason}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">Improvement: <span className="font-medium text-success">+{rec.predictedLevel - rec.currentLevel} levels</span></span>
                        <Button size="sm" onClick={() => router.push(`/practice?topic=${encodeURIComponent(rec.topic)}`)}>
                          Start Now <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="quick-wins" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Brain className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-card-foreground">Quick Win Opportunities</h3>
                </div>
                <p className="text-sm text-muted-foreground">Topics where small effort yields significant skill improvements.</p>
              </CardHeader>
              <CardContent>
                {quickWins.length === 0
                  ? <p className="text-sm text-muted-foreground text-center py-4">Complete more of your learning map to unlock quick wins!</p>
                  : <div className="grid gap-3 md:grid-cols-2">
                    {quickWins.map((item) => (
                      <div key={item.topic} onClick={() => router.push(`/practice?topic=${encodeURIComponent(item.topic)}`)}
                        className="flex items-center justify-between rounded-lg border border-border p-3 hover:border-primary/30 transition-colors cursor-pointer">
                        <div>
                          <p className="font-medium text-foreground">{item.topic}</p>
                          <p className="text-xs text-muted-foreground">{item.time}</p>
                        </div>
                        <Badge className="bg-success/10 text-success border-success/30">{item.boost}</Badge>
                      </div>
                    ))}
                  </div>
                }
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}