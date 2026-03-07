"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { ResourceCard } from "@/components/cards/resource-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search, Filter, Play, FileText, GraduationCap,
  Code, Sparkles, BookOpen, Star,
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

const types = ["video", "article", "course", "tutorial", "interactive"]
const difficulties = ["Beginner", "Intermediate", "Advanced"]
const typeIcons = {
  video: Play, article: FileText, course: GraduationCap,
  tutorial: Code, interactive: Sparkles,
}

export default function ResourcesPage() {
  const searchParams = useSearchParams()
  const topicParam = searchParams.get("topic") || "All"

  const [resources, setResources] = useState<any[]>([])
  const [topics, setTopics] = useState<string[]>(["All"])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([])
  const [selectedTopic, setSelectedTopic] = useState(topicParam)

  useEffect(() => {
    const url = selectedTopic !== "All"
      ? `http://localhost:8000/api/resources?topic=${encodeURIComponent(selectedTopic)}`
      : "http://localhost:8000/api/resources"

    setLoading(true)
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setResources(data)
        // Build topic list dynamically from what came back
        const uniqueTopics = ["All", ...Array.from(new Set(data.map((r: any) => r.topic))) as string[]]
        setTopics(uniqueTopics)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [selectedTopic])

  const filtered = resources.filter((r) => {
    const matchSearch = !searchQuery ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchType = selectedTypes.length === 0 || selectedTypes.includes(r.type)
    const matchDiff = selectedDifficulties.length === 0 || selectedDifficulties.includes(r.difficulty)
    return matchSearch && matchType && matchDiff
  })

  const featured = resources.filter((r) => r.featured)
  const videoCount = resources.filter((r) => r.type === "video").length
  const articleCount = resources.filter((r) => r.type === "article").length
  const courseCount = resources.filter((r) => r.type === "course").length

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Resource Explorer</h1>
          <p className="text-muted-foreground">Curated learning resources to accelerate your skill development</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Videos", count: videoCount, icon: Play, color: "bg-destructive/10 text-destructive" },
            { label: "Articles", count: articleCount, icon: FileText, color: "bg-info/10 text-info" },
            { label: "Courses", count: courseCount, icon: GraduationCap, color: "bg-primary/10 text-primary" },
            { label: "Featured", count: featured.length, icon: Star, color: "bg-warning/10 text-warning" },
          ].map(({ label, count, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${color.split(" ")[0]}`}>
                    <Icon className={`h-5 w-5 ${color.split(" ")[1]}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-xl font-bold text-foreground">{loading ? "—" : count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search & Filter */}
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
                        onCheckedChange={() =>
                          setSelectedTypes((prev) =>
                            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
                          )
                        }
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Difficulty</DropdownMenuLabel>
                  {difficulties.map((d) => (
                    <DropdownMenuCheckboxItem
                      key={d}
                      checked={selectedDifficulties.includes(d)}
                      onCheckedChange={() =>
                        setSelectedDifficulties((prev) =>
                          prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
                        )
                      }
                    >
                      {d}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Topic tabs - built dynamically from the API response */}
        <div className="flex flex-wrap gap-2">
          {topics.map((topic) => (
            <Badge
              key={topic}
              variant={selectedTopic === topic ? "default" : "secondary"}
              className="cursor-pointer px-4 py-1.5 text-sm"
              onClick={() => setSelectedTopic(topic)}
            >
              {topic}
            </Badge>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : (
          <>
            {/* Featured */}
            {selectedTopic === "All" && featured.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 text-warning" />
                  <h2 className="text-lg font-semibold text-foreground">Featured Resources</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {featured.slice(0, 3).map((r) => (
                    <ResourceCard key={r.id} {...r} onWatch={() => {}} />
                  ))}
                </div>
              </div>
            )}

            {/* All */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">
                    {selectedTopic === "All" ? "All Resources" : `${selectedTopic} Resources`}
                  </h2>
                </div>
                <span className="text-sm text-muted-foreground">{filtered.length} resource{filtered.length !== 1 ? "s" : ""}</span>
              </div>
              {filtered.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((r) => (
                    <ResourceCard key={r.id} {...r} onWatch={() => {}} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No resources found.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
