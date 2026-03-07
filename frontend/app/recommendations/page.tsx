"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Lightbulb,
  TrendingUp,
  Target,
  ArrowRight,
  Sparkles,
  Brain,
  BarChart3,
  CheckCircle2,
  Zap,
  BookOpen,
} from "lucide-react"

const recommendations = [
  {
    id: "recursion",
    topic: "Recursion Fundamentals",
    category: "Programming Concepts",
    reason: "Critical skill gap identified - currently at level 1/5",
    currentLevel: 1,
    predictedLevel: 3,
    timeEstimate: "2-3 hours",
    priority: "High" as const,
    prerequisites: ["Functions", "Variables"],
    benefits: [
      "Essential for tree traversal algorithms",
      "Foundation for divide-and-conquer strategies",
      "Required for advanced data structures",
    ],
    learningPath: [
      { step: "Understanding base cases", completed: false },
      { step: "Simple recursive functions", completed: false },
      { step: "Recursive problem decomposition", completed: false },
      { step: "Memoization techniques", completed: false },
    ],
  },
  {
    id: "linked-lists",
    topic: "Linked Lists",
    category: "Data Structures",
    reason: "Recommended next step based on your Arrays proficiency",
    currentLevel: 2,
    predictedLevel: 4,
    timeEstimate: "3-4 hours",
    priority: "Medium" as const,
    prerequisites: ["Arrays", "Pointers/References"],
    benefits: [
      "Dynamic memory allocation understanding",
      "Foundation for more complex data structures",
      "Common interview topic",
    ],
    learningPath: [
      { step: "Node structure basics", completed: true },
      { step: "Singly linked list operations", completed: false },
      { step: "Doubly linked lists", completed: false },
      { step: "Common linked list algorithms", completed: false },
    ],
  },
  {
    id: "sorting",
    topic: "Sorting Algorithms",
    category: "Algorithms",
    reason: "Builds on your loop mastery - good foundation detected",
    currentLevel: 2,
    predictedLevel: 4,
    timeEstimate: "4-5 hours",
    priority: "Medium" as const,
    prerequisites: ["Loops", "Arrays", "Recursion"],
    benefits: [
      "Core algorithm knowledge",
      "Understanding time complexity",
      "Problem-solving patterns",
    ],
    learningPath: [
      { step: "Basic sorting (Bubble, Selection)", completed: true },
      { step: "Efficient sorting (Merge, Quick)", completed: false },
      { step: "Time complexity analysis", completed: false },
      { step: "Specialized sorting algorithms", completed: false },
    ],
  },
  {
    id: "design-patterns",
    topic: "Design Patterns",
    category: "Software Design",
    reason: "Next logical step after mastering functions and OOP basics",
    currentLevel: 1,
    predictedLevel: 3,
    timeEstimate: "5-6 hours",
    priority: "Low" as const,
    prerequisites: ["Functions", "Objects", "Classes"],
    benefits: [
      "Write maintainable code",
      "Industry-standard practices",
      "Better code architecture",
    ],
    learningPath: [
      { step: "Creational patterns", completed: false },
      { step: "Structural patterns", completed: false },
      { step: "Behavioral patterns", completed: false },
      { step: "Pattern application", completed: false },
    ],
  },
]

const skillPredictions = [
  { skill: "Recursion", current: 1, predicted: 3, change: "+2" },
  { skill: "Data Structures", current: 2, predicted: 4, change: "+2" },
  { skill: "Algorithms", current: 2, predicted: 3, change: "+1" },
  { skill: "Overall", current: 2.7, predicted: 3.5, change: "+0.8" },
]

const priorityColors = {
  High: "bg-destructive/10 text-destructive border-destructive/30",
  Medium: "bg-warning/10 text-warning border-warning/30",
  Low: "bg-info/10 text-info border-info/30",
}

export default function RecommendationsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Recommendation Insights</h1>
            <p className="text-muted-foreground">
              AI-powered learning recommendations based on your skill profile
            </p>
          </div>
          <Button>
            <Sparkles className="mr-2 h-4 w-4" />
            Regenerate Insights
          </Button>
        </div>

        {/* Skill Improvement Prediction */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Skill Improvement Prediction</CardTitle>
            </div>
            <CardDescription>
              Projected skill levels after completing recommended learning paths
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {skillPredictions.map((item) => (
                <div
                  key={item.skill}
                  className="rounded-lg border border-border bg-secondary/30 p-4"
                >
                  <p className="text-sm font-medium text-foreground">{item.skill}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-foreground">
                      {item.predicted}
                    </span>
                    <span className="text-sm text-muted-foreground">/ 5</span>
                    <Badge className="ml-auto bg-success/10 text-success border-success/30">
                      {item.change}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full bg-muted-foreground/30 rounded-full"
                        style={{ width: `${(item.current / 5) * 100}%` }}
                      />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(item.predicted / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Recommendations</TabsTrigger>
            <TabsTrigger value="high">High Priority</TabsTrigger>
            <TabsTrigger value="quick-wins">Quick Wins</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {recommendations.map((rec, index) => (
              <Card key={rec.id} className="overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                  {/* Main Content */}
                  <div className="flex-1 p-6">
                    <div className="flex flex-wrap items-start gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <span className="text-sm font-bold text-primary">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-card-foreground">
                            {rec.topic}
                          </h3>
                          <p className="text-xs text-muted-foreground">{rec.category}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 ml-auto">
                        <Badge variant="outline" className={priorityColors[rec.priority]}>
                          {rec.priority} Priority
                        </Badge>
                        <Badge variant="secondary">{rec.timeEstimate}</Badge>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="flex items-start gap-2 mb-4 rounded-lg bg-primary/5 p-3">
                      <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm text-foreground">{rec.reason}</p>
                    </div>

                    {/* Benefits */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-warning" />
                        Benefits
                      </p>
                      <ul className="space-y-1">
                        {rec.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-3 w-3 text-success" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Prerequisites */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Prerequisites:</span>
                      <div className="flex flex-wrap gap-1">
                        {rec.prerequisites.map((prereq) => (
                          <Badge key={prereq} variant="secondary" className="text-xs">
                            {prereq}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Panel - Learning Path & Prediction */}
                  <div className="border-t lg:border-t-0 lg:border-l border-border bg-secondary/20 p-6 lg:w-80">
                    {/* Skill Prediction */}
                    <div className="mb-5">
                      <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        Skill Improvement
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <span className="block text-2xl font-bold text-muted-foreground">
                            {rec.currentLevel}
                          </span>
                          <span className="text-xs text-muted-foreground">Current</span>
                        </div>
                        <ArrowRight className="h-5 w-5 text-primary" />
                        <div className="text-center">
                          <span className="block text-2xl font-bold text-success">
                            {rec.predictedLevel}
                          </span>
                          <span className="text-xs text-muted-foreground">Predicted</span>
                        </div>
                        <Badge className="ml-auto bg-success/10 text-success border-success/30">
                          +{rec.predictedLevel - rec.currentLevel} levels
                        </Badge>
                      </div>
                    </div>

                    {/* Learning Path Progress */}
                    <div className="mb-5">
                      <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        Learning Path
                      </p>
                      <div className="space-y-2">
                        {rec.learningPath.map((step, i) => (
                          <div
                            key={i}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                              step.completed
                                ? "bg-success/10 text-success"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {step.completed ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border-2 border-current shrink-0" />
                            )}
                            <span className="line-clamp-1">{step.step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full">
                      Start Learning
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="high" className="space-y-4">
            {recommendations
              .filter((rec) => rec.priority === "High")
              .map((rec, index) => (
                <Card key={rec.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                      <Target className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-card-foreground">{rec.topic}</h3>
                        <Badge variant="outline" className={priorityColors[rec.priority]}>
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{rec.reason}</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-sm">
                          <span className="text-muted-foreground">Improvement:</span>
                          <span className="font-medium text-success">
                            +{rec.predictedLevel - rec.currentLevel} levels
                          </span>
                        </div>
                        <Button size="sm">
                          Start Now
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="quick-wins" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-card-foreground">Quick Win Opportunities</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Topics where small effort can yield significant skill improvements based on your current knowledge.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { topic: "Array Methods", time: "30 min", boost: "+15%" },
                  { topic: "String Manipulation", time: "45 min", boost: "+12%" },
                  { topic: "Error Handling Basics", time: "25 min", boost: "+10%" },
                  { topic: "Debugging Techniques", time: "40 min", boost: "+18%" },
                ].map((item) => (
                  <div
                    key={item.topic}
                    className="flex items-center justify-between rounded-lg border border-border p-3 hover:border-primary/30 transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-foreground">{item.topic}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                    <Badge className="bg-success/10 text-success border-success/30">
                      {item.boost}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
