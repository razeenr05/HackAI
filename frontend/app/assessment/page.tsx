"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { SkillSlider } from "@/components/skill-slider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  CheckCircle2,
  Save,
  RotateCcw,
  Sparkles,
  Brain,
  ArrowRight,
  Loader2,
  Trash2,
} from "lucide-react"

const categories = {
  fundamentals: {
    title: "Programming Fundamentals",
    description: "Core programming concepts",
    concepts: [
      { name: "Variables & Types", description: "Understanding data types and variable declarations", level: 4 },
      { name: "Operators", description: "Arithmetic, logical, and comparison operators", level: 4 },
      { name: "Control Flow", description: "If statements, switch cases, and conditional logic", level: 3 },
      { name: "Loops", description: "For, while, and do-while loops", level: 4 },
      { name: "Functions", description: "Function declarations, parameters, and return values", level: 3 },
    ],
  },
  intermediate: {
    title: "Intermediate Concepts",
    description: "Building on the basics",
    concepts: [
      { name: "Arrays", description: "Working with collections of data", level: 3 },
      { name: "Objects", description: "Object-oriented programming basics", level: 2 },
      { name: "Recursion", description: "Functions that call themselves", level: 1 },
      { name: "Error Handling", description: "Try-catch blocks and exception management", level: 2 },
      { name: "Scope & Closures", description: "Understanding variable scope and closures", level: 2 },
    ],
  },
  advanced: {
    title: "Advanced Topics",
    description: "Complex programming patterns",
    concepts: [
      { name: "Data Structures", description: "Linked lists, trees, graphs, and more", level: 2 },
      { name: "Algorithms", description: "Sorting, searching, and optimization", level: 2 },
      { name: "Design Patterns", description: "Common software design patterns", level: 1 },
      { name: "Async Programming", description: "Promises, async/await, and concurrency", level: 1 },
      { name: "Memory Management", description: "Understanding memory allocation", level: 1 },
    ],
  },
}

export default function AssessmentPage() {
  const router = useRouter()

  // ── Learning Goal State ────────────────────────────────────────────────────
  const [goal, setGoal] = useState("")
  const [savedGoal, setSavedGoal] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [generateSuccess, setGenerateSuccess] = useState(false)

  // Load any previously saved goal from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("hackai_goal")
    if (stored) setSavedGoal(stored)
  }, [])

  const handleGenerateGraph = async () => {
    if (!goal.trim()) return
    setGenerating(true)
    setGenerateError(null)
    setGenerateSuccess(false)

    const userId = localStorage.getItem("hackai_user_id") || "user-1"
    localStorage.setItem("hackai_user_id", userId)

    try {
      const res = await fetch("http://localhost:8000/api/generate-graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, goal: goal.trim() }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || "Failed to generate learning graph")
      }

      // Save goal so the page shows it after refresh
      localStorage.setItem("hackai_goal", goal.trim())
      setSavedGoal(goal.trim())
      setGenerateSuccess(true)
      setGoal("")

      // Give brief feedback then navigate to the mind map
      setTimeout(() => router.push("/mindmap"), 1200)
    } catch (e: any) {
      setGenerateError(e.message || "Something went wrong. Make sure the backend is running.")
    } finally {
      setGenerating(false)
    }
  }

  const handleClearGoal = () => {
    localStorage.removeItem("hackai_goal")
    setSavedGoal(null)
    setGenerateSuccess(false)
    setGenerateError(null)
  }

  // ── Skill Assessment State ─────────────────────────────────────────────────
  const [skills, setSkills] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    Object.values(categories).forEach((category) => {
      category.concepts.forEach((concept) => {
        initial[concept.name] = concept.level
      })
    })
    return initial
  })

  const [saved, setSaved] = useState(false)

  const handleSkillChange = (concept: string, value: number) => {
    setSkills((prev) => ({ ...prev, [concept]: value }))
    setSaved(false)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    const initial: Record<string, number> = {}
    Object.values(categories).forEach((category) => {
      category.concepts.forEach((concept) => {
        initial[concept.name] = concept.level
      })
    })
    setSkills(initial)
  }

  const totalConcepts = Object.keys(skills).length
  const assessedConcepts = Object.values(skills).filter((v) => v > 0).length
  const averageSkill = Object.values(skills).reduce((a, b) => a + b, 0) / totalConcepts

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Skill Assessment</h1>
            <p className="text-muted-foreground">
              Tell us what you want to learn, then rate your current knowledge to personalise your path
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button size="sm" onClick={handleSave}>
              {saved ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Assessment
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ── LEARNING GOAL SECTION ── */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">What do you want to learn?</CardTitle>
            </div>
            <CardDescription>
              Describe your learning goal and we&apos;ll generate a personalised knowledge map for you.
              Be as specific or as broad as you like — e.g. &quot;Learn Python for data science&quot;,
              &quot;Understand how basketball plays work&quot;, &quot;Get started with music theory&quot;.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Show existing saved goal */}
            {savedGoal && (
              <div className="flex items-start justify-between rounded-lg border border-success/30 bg-success/10 px-4 py-3">
                <div>
                  <p className="text-xs font-medium text-success mb-1">Current learning goal</p>
                  <p className="text-sm font-semibold text-foreground">{savedGoal}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your mind map has been generated.{" "}
                    <span
                      className="text-primary underline cursor-pointer"
                      onClick={() => router.push("/mindmap")}
                    >
                      View it here →
                    </span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={handleClearGoal}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Input for new goal */}
            {!savedGoal && (
              <>
                <Textarea
                  placeholder="e.g. I want to learn machine learning from scratch, starting with Python and statistics..."
                  value={goal}
                  onChange={(e) => {
                    setGoal(e.target.value)
                    setGenerateError(null)
                    setGenerateSuccess(false)
                  }}
                  className="min-h-[100px] resize-none"
                  disabled={generating}
                />

                {generateError && (
                  <p className="text-sm text-destructive">{generateError}</p>
                )}

                {generateSuccess && (
                  <div className="flex items-center gap-2 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Learning map generated! Redirecting to Mind Map...</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {goal.length} characters — be descriptive for best results
                  </p>
                  <Button
                    onClick={handleGenerateGraph}
                    disabled={!goal.trim() || generating}
                    className="gap-2"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating your map...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate Learning Map
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            {/* Allow updating the goal even if one exists */}
            {savedGoal && (
              <>
                <p className="text-xs text-muted-foreground">
                  Want to start over with a different topic? Clear the goal above then enter a new one.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Progress Overview */}
        <Card>
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Concepts Assessed</p>
                  <p className="text-2xl font-bold text-foreground">
                    {assessedConcepts}/{totalConcepts}
                  </p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div>
                  <p className="text-sm text-muted-foreground">Average Skill Level</p>
                  <p className="text-2xl font-bold text-primary">
                    {averageSkill.toFixed(1)}/5
                  </p>
                </div>
              </div>
              <div className="flex-1 max-w-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm font-medium text-foreground">
                    {Math.round((assessedConcepts / totalConcepts) * 100)}%
                  </span>
                </div>
                <Progress value={(assessedConcepts / totalConcepts) * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Tabs */}
        <Tabs defaultValue="fundamentals" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="fundamentals">Fundamentals</TabsTrigger>
            <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {Object.entries(categories).map(([key, category]) => (
            <TabsContent key={key} value={key} className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                  </div>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {category.concepts.map((concept) => (
                    <SkillSlider
                      key={concept.name}
                      concept={concept.name}
                      description={concept.description}
                      initialValue={skills[concept.name] ?? concept.level}
                      onChange={(value) => handleSkillChange(concept.name, value)}
                    />
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Summary Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Assessment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-5">
              {[
                { level: 0, label: "None",         color: "bg-muted text-muted-foreground" },
                { level: 1, label: "Basic",        color: "bg-destructive/10 text-destructive" },
                { level: 2, label: "Developing",   color: "bg-warning/10 text-warning" },
                { level: 3, label: "Intermediate", color: "bg-info/10 text-info" },
                { level: 4, label: "Proficient",   color: "bg-success/10 text-success" },
              ].map((item) => {
                const count = Object.values(skills).filter(
                  (v) => v === item.level || (item.level === 4 && v === 5)
                ).length
                return (
                  <div
                    key={item.level}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Badge className={item.color}>{item.label}</Badge>
                    </div>
                    <span className="text-lg font-semibold text-foreground">{count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}