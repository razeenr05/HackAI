"use client"

import { useEffect, useState } from "react"
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  BookOpen, Target, TrendingUp, Clock,
  AlertTriangle, CheckCircle2, ArrowRight,
} from "lucide-react"

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userId = localStorage.getItem("hackai_user_id") || "user-1"
    fetch(`http://localhost:8000/api/dashboard/${userId}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </AppShell>
    )
  }

  if (!data) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Could not load dashboard. Make sure the backend is running.
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Track your learning progress and discover what to learn next
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Concepts Learned"
            value={data.conceptsLearned}
            description={`${data.conceptsThisWeek} this week`}
            icon={BookOpen}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Average Skill Level"
            value={data.averageSkillLevel}
            description="Intermediate"
            icon={Target}
          />
          <StatCard
            title="Learning Streak"
            value={`${data.learningStreak} Days`}
            description="Keep it up!"
            icon={TrendingUp}
            trend={{ value: 50, isPositive: true }}
          />
          <StatCard
            title="Time Spent"
            value={`${data.timeSpentHours}h`}
            description="This month"
            icon={Clock}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Skill Assessment</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/assessment">Edit <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <SkillRadarChart data={data.skillData} />
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
              <ProgressChart data={data.progressData} />
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
              {data.knowledgeGaps.map((gap: any) => (
                <Link
                  key={gap.name}
                  href={`/practice?topic=${encodeURIComponent(gap.name)}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3 transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${gap.status === "weak" ? "bg-destructive" : "bg-warning"}`} />
                    <span className="text-sm font-medium text-foreground">{gap.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={gap.status === "weak" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-warning/30 bg-warning/10 text-warning"}>
                      Level {gap.level}/5
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
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
                  <Link href="/recommendations">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recommendedTopics.map((topic: any) => (
                <RecommendationCard key={topic.title} {...topic} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
