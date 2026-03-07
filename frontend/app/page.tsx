"use client"

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
  BookOpen,
  Target,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react"

const skillData = [
  { subject: "Variables", value: 4, fullMark: 5 },
  { subject: "Loops", value: 4, fullMark: 5 },
  { subject: "Functions", value: 3, fullMark: 5 },
  { subject: "Recursion", value: 1, fullMark: 5 },
  { subject: "Data Structures", value: 2, fullMark: 5 },
  { subject: "Algorithms", value: 2, fullMark: 5 },
]

const progressData = [
  { date: "Week 1", progress: 15 },
  { date: "Week 2", progress: 28 },
  { date: "Week 3", progress: 42 },
  { date: "Week 4", progress: 55 },
  { date: "Week 5", progress: 62 },
  { date: "Week 6", progress: 68 },
]

const knowledgeGaps = [
  { name: "Recursion", level: 1, status: "weak" },
  { name: "Data Structures", level: 2, status: "developing" },
  { name: "Algorithms", level: 2, status: "developing" },
]

const recommendedTopics = [
  {
    title: "Recursion Fundamentals",
    description: "Master the art of recursive thinking with step-by-step examples",
    reason: "Your weakest skill area",
    improvement: "+35% predicted skill improvement",
    difficulty: "Intermediate" as const,
    href: "/practice?topic=Recursion",
  },
  {
    title: "Linked Lists",
    description: "Understanding linear data structures and pointer manipulation",
    reason: "Foundation for advanced DS",
    improvement: "+20% predicted skill improvement",
    difficulty: "Beginner" as const,
    href: "/resources?topic=Data+Structures",
  },
]

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Track your learning progress and discover what to learn next
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Concepts Learned"
            value={24}
            description="8 this week"
            icon={BookOpen}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Average Skill Level"
            value="2.7/5"
            description="Intermediate"
            icon={Target}
          />
          <StatCard
            title="Learning Streak"
            value="12 Days"
            description="Personal best!"
            icon={TrendingUp}
            trend={{ value: 50, isPositive: true }}
          />
          <StatCard
            title="Time Spent"
            value="42h"
            description="This month"
            icon={Clock}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Skill Radar Chart */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  Skill Assessment
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/assessment">
                    Edit <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <SkillRadarChart data={skillData} />
            </CardContent>
          </Card>

          {/* Progress Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  Learning Progress
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">68%</span>
                  <span className="text-sm text-muted-foreground">complete</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={68} className="mb-4 h-2" />
              <ProgressChart data={progressData} />
            </CardContent>
          </Card>
        </div>

        {/* Knowledge Gaps & Recommendations */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Knowledge Gaps */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <CardTitle className="text-base font-semibold">
                    Knowledge Gaps
                  </CardTitle>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/mindmap">
                    View Map <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {knowledgeGaps.map((gap) => (
                <Link
                  key={gap.name}
                  href={`/practice?topic=${encodeURIComponent(gap.name)}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3 transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        gap.status === "weak" ? "bg-destructive" : "bg-warning"
                      }`}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {gap.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        gap.status === "weak"
                          ? "border-destructive/30 bg-destructive/10 text-destructive"
                          : "border-warning/30 bg-warning/10 text-warning"
                      }
                    >
                      Level {gap.level}/5
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Recommended Next */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <CardTitle className="text-base font-semibold">
                    Recommended Next
                  </CardTitle>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/recommendations">
                    View All <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendedTopics.map((topic) => (
                <RecommendationCard key={topic.title} {...topic} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
