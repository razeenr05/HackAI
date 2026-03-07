"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ResourceCard } from "@/components/cards/resource-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Search,
  Filter,
  Play,
  FileText,
  GraduationCap,
  Code,
  Sparkles,
  BookOpen,
  Star,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

const resources = [
  {
    id: "1",
    title: "Recursion Explained - The Ultimate Guide",
    description: "Master recursion with visual examples and step-by-step explanations. Perfect for beginners struggling with recursive thinking.",
    type: "video" as const,
    timestamp: "2:14 - 5:30",
    duration: "12:45",
    topic: "Recursion",
    difficulty: "Intermediate" as const,
    source: "YouTube",
    featured: true,
  },
  {
    id: "2",
    title: "Understanding Linked Lists",
    description: "Comprehensive tutorial covering singly and doubly linked lists, with implementation examples in multiple languages.",
    type: "video" as const,
    timestamp: "0:45 - 8:20",
    duration: "18:30",
    topic: "Data Structures",
    difficulty: "Beginner" as const,
    source: "YouTube",
    featured: true,
  },
  {
    id: "3",
    title: "Big O Notation Demystified",
    description: "Learn time and space complexity analysis with practical examples. Essential for coding interviews.",
    type: "article" as const,
    topic: "Algorithms",
    difficulty: "Intermediate" as const,
    source: "Medium",
    featured: false,
  },
  {
    id: "4",
    title: "Binary Search Trees - Interactive Course",
    description: "Hands-on course with interactive visualizations to understand BST operations, balancing, and traversal methods.",
    type: "course" as const,
    duration: "2.5 hours",
    topic: "Data Structures",
    difficulty: "Intermediate" as const,
    source: "Coursera",
    featured: true,
  },
  {
    id: "5",
    title: "Sorting Algorithms Visualized",
    description: "Interactive tool to visualize how different sorting algorithms work. Compare bubble sort, merge sort, quick sort, and more.",
    type: "interactive" as const,
    topic: "Algorithms",
    difficulty: "Beginner" as const,
    source: "VisuAlgo",
    featured: false,
  },
  {
    id: "6",
    title: "Dynamic Programming Patterns",
    description: "Master the art of dynamic programming with common patterns and techniques used in competitive programming.",
    type: "tutorial" as const,
    topic: "Algorithms",
    difficulty: "Advanced" as const,
    source: "GeeksforGeeks",
    featured: false,
  },
  {
    id: "7",
    title: "JavaScript Array Methods Deep Dive",
    description: "Comprehensive guide to all array methods - map, filter, reduce, and more. With practical examples.",
    type: "video" as const,
    timestamp: "1:00 - 15:45",
    duration: "28:15",
    topic: "Arrays",
    difficulty: "Beginner" as const,
    source: "YouTube",
    featured: false,
  },
  {
    id: "8",
    title: "Graph Algorithms Masterclass",
    description: "BFS, DFS, Dijkstra's algorithm, and more. Complete guide to graph traversal and shortest path algorithms.",
    type: "course" as const,
    duration: "4 hours",
    topic: "Algorithms",
    difficulty: "Advanced" as const,
    source: "Udemy",
    featured: true,
  },
  {
    id: "9",
    title: "Hash Tables Explained",
    description: "Understanding hash functions, collision resolution, and implementing your own hash table from scratch.",
    type: "article" as const,
    topic: "Data Structures",
    difficulty: "Intermediate" as const,
    source: "Dev.to",
    featured: false,
  },
  {
    id: "10",
    title: "Function Composition and Currying",
    description: "Functional programming concepts made simple. Learn about pure functions, composition, and currying patterns.",
    type: "video" as const,
    timestamp: "3:20 - 12:00",
    duration: "22:10",
    topic: "Functions",
    difficulty: "Intermediate" as const,
    source: "YouTube",
    featured: false,
  },
]

const topics = ["All", "Recursion", "Data Structures", "Algorithms", "Arrays", "Functions"]
const types = ["video", "article", "course", "tutorial", "interactive"]
const difficulties = ["Beginner", "Intermediate", "Advanced"]

const typeIcons = {
  video: Play,
  article: FileText,
  course: GraduationCap,
  tutorial: Code,
  interactive: Sparkles,
}

export default function ResourcesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([])
  const [selectedTopic, setSelectedTopic] = useState("All")

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      searchQuery === "" ||
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType =
      selectedTypes.length === 0 || selectedTypes.includes(resource.type)

    const matchesDifficulty =
      selectedDifficulties.length === 0 ||
      selectedDifficulties.includes(resource.difficulty)

    const matchesTopic =
      selectedTopic === "All" || resource.topic === selectedTopic

    return matchesSearch && matchesType && matchesDifficulty && matchesTopic
  })

  const featuredResources = resources.filter((r) => r.featured)
  const videoCount = resources.filter((r) => r.type === "video").length
  const articleCount = resources.filter((r) => r.type === "article").length
  const courseCount = resources.filter((r) => r.type === "course").length

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const toggleDifficulty = (difficulty: string) => {
    setSelectedDifficulties((prev) =>
      prev.includes(difficulty)
        ? prev.filter((d) => d !== difficulty)
        : [...prev, difficulty]
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Resource Explorer</h1>
            <p className="text-muted-foreground">
              Curated learning resources to accelerate your skill development
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-destructive/10 p-2">
                  <Play className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Videos</p>
                  <p className="text-xl font-bold text-foreground">{videoCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-info/10 p-2">
                  <FileText className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Articles</p>
                  <p className="text-xl font-bold text-foreground">{articleCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Courses</p>
                  <p className="text-xl font-bold text-foreground">{courseCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-warning/10 p-2">
                  <Star className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Featured</p>
                  <p className="text-xl font-bold text-foreground">{featuredResources.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      Filters
                      {(selectedTypes.length > 0 || selectedDifficulties.length > 0) && (
                        <Badge variant="secondary" className="ml-2">
                          {selectedTypes.length + selectedDifficulties.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Resource Type</DropdownMenuLabel>
                    {types.map((type) => {
                      const Icon = typeIcons[type as keyof typeof typeIcons]
                      return (
                        <DropdownMenuCheckboxItem
                          key={type}
                          checked={selectedTypes.includes(type)}
                          onCheckedChange={() => toggleType(type)}
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Difficulty</DropdownMenuLabel>
                    {difficulties.map((difficulty) => (
                      <DropdownMenuCheckboxItem
                        key={difficulty}
                        checked={selectedDifficulties.includes(difficulty)}
                        onCheckedChange={() => toggleDifficulty(difficulty)}
                      >
                        {difficulty}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {(selectedTypes.length > 0 || selectedDifficulties.length > 0 || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTypes([])
                      setSelectedDifficulties([])
                      setSearchQuery("")
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Topic Tabs */}
        <Tabs value={selectedTopic} onValueChange={setSelectedTopic}>
          <TabsList className="flex-wrap h-auto gap-1 p-1">
            {topics.map((topic) => (
              <TabsTrigger key={topic} value={topic} className="px-4">
                {topic}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedTopic} className="mt-6">
            {/* Featured Section */}
            {selectedTopic === "All" && featuredResources.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 text-warning" />
                  <h2 className="text-lg font-semibold text-foreground">Featured Resources</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {featuredResources.slice(0, 3).map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      {...resource}
                      onWatch={() => console.log(`Opening resource: ${resource.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Resources Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">
                    {selectedTopic === "All" ? "All Resources" : `${selectedTopic} Resources`}
                  </h2>
                </div>
                <span className="text-sm text-muted-foreground">
                  {filteredResources.length} resource{filteredResources.length !== 1 ? "s" : ""}
                </span>
              </div>
              
              {filteredResources.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredResources.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      {...resource}
                      onWatch={() => console.log(`Opening resource: ${resource.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground mb-2">No resources found matching your criteria.</p>
                    <Button
                      variant="link"
                      onClick={() => {
                        setSelectedTypes([])
                        setSelectedDifficulties([])
                        setSearchQuery("")
                        setSelectedTopic("All")
                      }}
                    >
                      Clear all filters
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
