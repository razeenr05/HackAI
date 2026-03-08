"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AppShell } from "@/components/app-shell"
import { StatCard } from "@/components/cards/stat-card"
import { RecommendationCard } from "@/components/cards/recommendation-card"
import { SkillRadarChart } from "@/components/charts/skill-radar-chart"
import { ProgressChart } from "@/components/charts/progress-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen, Target, TrendingUp, Clock,
  AlertTriangle, CheckCircle2, ArrowRight, Loader2,
} from "lucide-react"

interface DashboardData {
  conceptsLearned: number
  conceptsThisWeek: number
  averageSkillLevel: string
  learningStreak: number
  timeSpentHours: number
  overallProgress: number
  skillData: { subject: string; value: number; fullMark: number }[]
  progressData: { date: string; progress: number }[]
  knowledgeGaps: { name: string; level: number; status: string }[]
  recommendedTopics: {
    title: string; description: string; reason: string
    improvement: string; difficulty: "Beginner" | "Intermediate" | "Advanced"; href: string
  }[]
}

export default function DashboardPage() {
  const [data, setData]       = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    const userId = localStorage.getItem("hackai_user_id") || "user-1"
    fetch(`http://localhost:8000/api/dashboard/${userId}`)
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json() })
      .then((d) => { setData(d); setLoading(false) })
      .catch((e) => { setError(e.message); setLoading(false) })
  }, [])

  if (loading) return (
    <AppShell>
      <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /><span>Loading dashboard...</span>
      </div>
    </AppShell>
  )

  if (error || !data) return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Track your learning progress</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <p className="text-muted-foreground">No learning data yet.</p>
            <p className="text-sm text-muted-foreground">Go to <strong>Skill Assessment</strong> and enter a topic to get started.</p>
            <Button asChild><Link href="/assessment">Get Started →</Link></Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Track your learning progress and discover what to learn next</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Concepts Learned" value={data.conceptsLearned}
            description={`${data.conceptsThisWeek} this week`} icon={BookOpen}
            trend={{ value: data.conceptsThisWeek > 0 ? 12 : 0, isPositive: true }} />
          <StatCard title="Average Skill Level" value={data.averageSkillLevel}
            description="Based on your graph" icon={Target} />
          <StatCard title="Learning Streak" value={`${data.learningStreak} Days`}
            description="Keep it up!" icon={TrendingUp}
            trend={{ value: data.learningStreak > 0 ? 50 : 0, isPositive: true }} />
          <StatCard title="Overall Progress" value={`${data.overallProgress}%`}
            description="Concepts completed" icon={Clock} />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Skill Overview</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/mindmap">View Map <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {data.skillData.length > 0
                ? <SkillRadarChart data={data.skillData} />
                : <p className="text-sm text-muted-foreground py-8 text-center">Complete nodes to see skill data</p>
              }
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Learning Progress</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">{data.overallProgress}%</span>
                  <span className="text-sm text-muted-foreground">complete</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={data.overallProgress} className="mb-4 h-2" />
              <ProgressChart data={data.progressData.length > 1 ? data.progressData : [
                { date: "Start", progress: 0 },
                { date: "Now",   progress: data.overallProgress },
              ]} />
            </CardContent>
          </Card>
        </div>

        {/* Gaps & Recommendations */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <CardTitle className="text-base font-semibold">Knowledge Gaps</CardTitle>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/mindmap">View Map <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.knowledgeGaps.length > 0 ? data.knowledgeGaps.map((gap) => (
                <Link key={gap.name} href={`/practice?topic=${encodeURIComponent(gap.name)}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3 transition-all hover:border-primary/30 hover:shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${gap.status === "weak" ? "bg-destructive" : "bg-warning"}`} />
                    <span className="text-sm font-medium text-foreground">{gap.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={gap.status === "weak"
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-warning/30 bg-warning/10 text-warning"}>
                      Level {gap.level}/5
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              )) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No knowledge gaps detected. Keep learning! 🎉
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <CardTitle className="text-base font-semibold">Recommended Next</CardTitle>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/mindmap">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recommendedTopics.length > 0 ? data.recommendedTopics.map((topic) => (
                <RecommendationCard key={topic.title} {...topic} />
              )) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Complete some concepts to get recommendations!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}