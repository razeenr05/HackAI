"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Search,
  Play,
  FileText,
  GraduationCap,
  Code,
  Sparkles,
  BookOpen,
  Globe,
  Loader2,
  AlertCircle,
  ExternalLink,
  Clock,
  ChevronUp,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Resource {
  id: string
  title: string
  description: string
  type: string
  topic: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  source: string
  featured: boolean
}

interface Snippet {
  url: string
  start_time: number
  end_time: number
  reasoning: string
  video_title: string
  channel_name: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getVideoId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

function buildEmbedUrl(url: string, start: number, end: number): string {
  const id = getVideoId(url)
  if (!id) return ""
  return `https://www.youtube.com/embed/${id}?start=${start}&autoplay=1&rel=0&modestbranding=1`
}

function buildWatchUrl(url: string, start: number): string {
  const id = getVideoId(url)
  if (!id) return url
  return `https://www.youtube.com/watch?v=${id}&t=${start}s`
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

const typeIcons: Record<string, React.ElementType> = {
  video:       Play,
  article:     FileText,
  course:      GraduationCap,
  tutorial:    Code,
  interactive: Sparkles,
  book:        BookOpen,
  website:     Globe,
}

const difficultyColors: Record<string, string> = {
  Beginner:     "bg-success/10 text-success border-success/30",
  Intermediate: "bg-warning/10 text-warning border-warning/30",
  Advanced:     "bg-destructive/10 text-destructive border-destructive/30",
}

const typeColors: Record<string, string> = {
  video:       "bg-destructive/10 text-destructive border-destructive/30",
  article:     "bg-info/10 text-info border-info/30",
  course:      "bg-primary/10 text-primary border-primary/30",
  tutorial:    "bg-success/10 text-success border-success/30",
  interactive: "bg-warning/10 text-warning border-warning/30",
  book:        "bg-secondary/80 text-foreground border-border",
  website:     "bg-secondary/80 text-foreground border-border",
}

// ---------------------------------------------------------------------------
// ResourceCard — each card has its own snippet fetch + embed
// ---------------------------------------------------------------------------

function ResourceCard({ resource }: { resource: Resource }) {
  const [snippet, setSnippet]   = useState<Snippet | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const normType  = resource.type.toLowerCase()
  const isVideo   = normType === "video"
  const TypeIcon  = typeIcons[normType] ?? FileText
  const typeColor = typeColors[normType] ?? typeColors.article

  // Only called for video cards
  const fetchSnippet = async () => {
    if (snippet) { setExpanded((e) => !e); return }
    setLoading(true)
    setError(null)
    try {
      // Use just the resource title — shorter = better yt-dlp results
      const res = await fetch(
        `http://localhost:8000/api/snippet/search?topic=${encodeURIComponent(resource.title)}`
      )
      if (!res.ok) throw new Error("Search failed")
      const data: Snippet = await res.json()
      setSnippet(data)
      setExpanded(true)
    } catch {
      setError("Could not find a snippet. Try again.")
    } finally {
      setLoading(false)
    }
  }

  const openExternal = () => {
    // For non-video resources: open YouTube search for tutorials/courses, Google for articles/books
    const titleAndTopic = `${resource.title} ${resource.topic}`
    let url: string
    if (normType === "tutorial" || normType === "course" || normType === "interactive") {
      // YouTube is best for tutorials and courses
      url = `https://www.youtube.com/results?search_query=${encodeURIComponent(titleAndTopic)}`
    } else if (normType === "article" || normType === "website") {
      // Google search — user can pick the actual article from results
      url = `https://www.google.com/search?q=${encodeURIComponent(titleAndTopic)}`
    } else if (normType === "book") {
      url = `https://www.google.com/search?q=${encodeURIComponent(resource.title + " free read online")}`
    } else {
      url = `https://www.google.com/search?q=${encodeURIComponent(titleAndTopic)}`
    }
    window.open(url, "_blank", "noopener,noreferrer")
  }

  // Has Gemini returned real timestamps (not the 0–120 fallback)?
  const hasRealTimestamps = snippet
    ? (snippet.start_time > 0 || snippet.end_time > 120)
    : false

  const embedUrl = snippet
    ? buildEmbedUrl(snippet.url, snippet.start_time, snippet.end_time)
    : ""

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg hover:border-primary/30">
      <CardContent className="p-5 space-y-3">

        {/* Type + difficulty badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={typeColor}>
            <TypeIcon className="mr-1 h-3 w-3" />
            {normType.charAt(0).toUpperCase() + normType.slice(1)}
          </Badge>
          <Badge variant="outline" className={difficultyColors[resource.difficulty] ?? difficultyColors.Beginner}>
            {resource.difficulty}
          </Badge>
        </div>

        {/* Title + description */}
        <div>
          <h3 className="font-semibold text-card-foreground line-clamp-2">{resource.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {resource.description}
          </p>
        </div>

        {/* Topic pill */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{resource.topic}</Badge>
          <span className="text-xs text-muted-foreground">{resource.source}</span>
        </div>

        {/* ── VIDEO: embedded snippet player ── */}
        {isVideo && expanded && snippet && embedUrl && (
          <div className="space-y-2 pt-1">
            <div className="rounded-lg overflow-hidden border border-border aspect-video">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Timestamps — only if Gemini returned real values */}
            {hasRealTimestamps && (
              <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-foreground">
                  Best clip:{" "}
                  <span className="font-medium text-primary">
                    {formatTime(snippet.start_time)} – {formatTime(snippet.end_time)}
                  </span>
                </span>
              </div>
            )}

            {/* Gemini reasoning — skip fallback messages */}
            {snippet.reasoning && !snippet.reasoning.startsWith("Could not") && (
              <p className="text-xs text-muted-foreground italic">💡 {snippet.reasoning}</p>
            )}

            {snippet.video_title && (
              <p className="text-xs text-muted-foreground truncate">
                📺 {snippet.video_title}
                {snippet.channel_name && ` · ${snippet.channel_name}`}
              </p>
            )}

            <a
              href={buildWatchUrl(snippet.url, snippet.start_time)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Watch on YouTube from {formatTime(snippet.start_time)} ↗
            </a>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* ── VIDEO action button ── */}
        {isVideo && (
          <Button
            className="w-full"
            variant={expanded ? "outline" : "default"}
            onClick={fetchSnippet}
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Searching YouTube + AI analysis...</>
            ) : expanded ? (
              <><ChevronUp className="mr-2 h-4 w-4" />Hide Snippet</>
            ) : (
              <><Play className="mr-2 h-4 w-4" />Find Best Video Snippet</>
            )}
          </Button>
        )}

        {/* NON-VIDEO: open resource externally */}
        {!isVideo && (
          <Button className="w-full" variant="outline" onClick={openExternal}>
            <ExternalLink className="mr-2 h-4 w-4" />
            {normType === "tutorial" || normType === "course"
              ? "Find on YouTube ↗"
              : normType === "book"
              ? "Find Book Online ↗"
              : "Search Google ↗"}
          </Button>
        )}

      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ResourcesPage() {
  const [resources, setResources]         = useState<Resource[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [searchQuery, setSearchQuery]     = useState("")
  const [selectedTopic, setSelectedTopic] = useState("All")

  useEffect(() => {
    fetch("http://localhost:8000/api/resources")
      .then((res) => { if (!res.ok) throw new Error("Failed to load resources"); return res.json() })
      .then((data) => { setResources(data); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [])

  const topics   = ["All", ...Array.from(new Set(resources.map((r) => r.topic))).sort()]
  const filtered = resources.filter((r) => {
    const matchSearch = !searchQuery ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchTopic = selectedTopic === "All" || r.topic === selectedTopic
    return matchSearch && matchTopic
  })

  const videoCount   = resources.filter((r) => r.type.toLowerCase() === "video").length
  const articleCount = resources.filter((r) => r.type.toLowerCase() === "article").length
  const courseCount  = resources.filter((r) => ["course", "tutorial"].includes(r.type.toLowerCase())).length

  if (loading) return (
    <AppShell>
      <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /><span>Loading your resources...</span>
      </div>
    </AppShell>
  )

  if (error) return (
    <AppShell>
      <div className="flex h-64 items-center justify-center gap-3 text-destructive">
        <AlertCircle className="h-5 w-5" /><span>{error} — make sure the backend is running.</span>
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      <div className="space-y-6 stagger-reveal">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Resource Explorer</h1>
          <p className="text-muted-foreground">
            Click{" "}
            <span className="font-medium text-primary">"Find Best Video Snippet"</span>
            {" "}on any card — AI searches YouTube, reads the transcript, and shows you the exact best clip.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-destructive/10 p-2"><Play className="h-5 w-5 text-destructive" /></div>
            <div><p className="text-sm text-muted-foreground">Videos</p><p className="text-xl font-bold">{videoCount}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-info/10 p-2"><FileText className="h-5 w-5 text-info" /></div>
            <div><p className="text-sm text-muted-foreground">Articles</p><p className="text-xl font-bold">{articleCount}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><GraduationCap className="h-5 w-5 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Courses</p><p className="text-xl font-bold">{courseCount}</p></div>
          </CardContent></Card>
        </div>

        {/* Search */}
        <Card><CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent></Card>

        {/* Topic pills */}
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedTopic === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">
                {selectedTopic === "All" ? "All Resources" : `${selectedTopic} Resources`}
              </h2>
            </div>
            <span className="text-sm text-muted-foreground">{filtered.length} resources</span>
          </div>

          {filtered.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((r) => <ResourceCard key={r.id} resource={r} />)}
            </div>
          ) : (
            <Card><CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-2">No resources found.</p>
              <Button variant="link" onClick={() => { setSearchQuery(""); setSelectedTopic("All") }}>
                Clear filters
              </Button>
            </CardContent></Card>
          )}
        </div>

      </div>
    </AppShell>
  )
}