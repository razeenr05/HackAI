"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X, BookOpen, Code, Link2, ArrowRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ConceptStatus } from "./concept-node"

interface ConceptPanelProps {
  concept: {
    id: string
    label: string
    status: ConceptStatus
    level: number
    description: string
    explanation: string
    practiceProblems: string[]
    resources: { title: string; type: string }[]
    relatedTopics: string[]
  } | null
  onClose: () => void
}

const statusLabels: Record<ConceptStatus, { label: string; color: string }> = {
  completed: { label: "Completed", color: "bg-success/10 text-success border-success/30" },
  "in-progress": { label: "In Progress", color: "bg-warning/10 text-warning border-warning/30" },
  weak: { label: "Needs Work", color: "bg-destructive/10 text-destructive border-destructive/30" },
  recommended: { label: "Recommended", color: "bg-primary/10 text-primary border-primary/30" },
  locked: { label: "Locked", color: "bg-muted text-muted-foreground border-border" },
}

// ---------------------------------------------------------------------------
// VideoSnippetPlayer — fetches and embeds the best YouTube clip for a topic
// ---------------------------------------------------------------------------

function VideoSnippetPlayer({ nodeId, label }: { nodeId: string; label: string }) {
  const [snippet, setSnippet] = useState<{
    url: string
    start_time: number
    end_time: number
    reasoning: string
    video_title: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSnippet = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`http://localhost:8000/api/snippet/${nodeId}`)
      if (!res.ok) throw new Error("Failed to fetch snippet")
      const data = await res.json()
      setSnippet(data)
    } catch (e) {
      setError("Could not load snippet. Try again.")
    } finally {
      setLoading(false)
    }
  }

  const getEmbedUrl = () => {
    if (!snippet) return null
    const match = snippet.url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
    if (!match) return null
    return `https://www.youtube.com/embed/${match[1]}?start=${snippet.start_time}&end=${snippet.end_time}&autoplay=1`
  }

  const embedUrl = getEmbedUrl()

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Play className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium text-foreground">Video Snippet</p>
      </div>

      {!snippet && !loading && (
        <button
          onClick={fetchSnippet}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors text-left"
        >
          Find best video clip for &quot;{label}&quot;
        </button>
      )}

      {loading && (
        <div className="rounded-lg bg-secondary/50 px-3 py-4 text-center text-sm text-muted-foreground animate-pulse">
          Searching YouTube...
        </div>
      )}

      {error && (
        <div className="space-y-2">
          <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
          <button
            onClick={fetchSnippet}
            className="text-xs text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {snippet && embedUrl && (
        <div className="space-y-2">
          <div className="rounded-lg overflow-hidden border border-border aspect-video">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
              allowFullScreen
            />
          </div>
          {snippet.reasoning && (
            <p className="text-xs text-muted-foreground italic">{snippet.reasoning}</p>
          )}
          {snippet.video_title && (
            <p className="text-xs text-muted-foreground truncate">📺 {snippet.video_title}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ConceptPanel
// ---------------------------------------------------------------------------

export function ConceptPanel({ concept, onClose }: ConceptPanelProps) {
  const router = useRouter()

  if (!concept) return null

  const statusInfo = statusLabels[concept.status]

  const handleStartLearning = () => {
    router.push(`/practice?topic=${encodeURIComponent(concept.label)}`)
  }

  const handlePracticeClick = () => {
    router.push(`/practice?topic=${encodeURIComponent(concept.label)}`)
  }

  const handleResourceClick = () => {
    router.push(`/resources?topic=${encodeURIComponent(concept.label)}`)
  }

  return (
    <div className="absolute right-4 top-4 z-50 w-96 rounded-xl border border-border bg-card shadow-xl">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-card-foreground">{concept.label}</h3>
          <Badge variant="outline" className={statusInfo.color}>
            {statusInfo.label}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)] max-h-[500px]">
        <div className="p-4 space-y-5">
          {/* Skill Level */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Skill Level</p>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full ${
                    i < concept.level ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
              <span className="text-sm font-medium text-foreground ml-2">
                {concept.level}/5
              </span>
            </div>
          </div>

          <Separator />

          {/* Explanation */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Explanation</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {concept.explanation}
            </p>
          </div>

          <Separator />

          {/* Video Snippet */}
          <VideoSnippetPlayer nodeId={concept.id} label={concept.label} />

          <Separator />

          {/* Practice Problems */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Code className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Practice Problems</p>
            </div>
            <div className="space-y-2">
              {concept.practiceProblems.map((problem, i) => (
                <div
                  key={i}
                  onClick={handlePracticeClick}
                  className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 cursor-pointer hover:bg-secondary transition-colors"
                >
                  <span className="text-sm text-foreground">{problem}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Resources */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Learning Resources</p>
            </div>
            <div className="space-y-2">
              {concept.resources.map((resource, i) => (
                <div
                  key={i}
                  onClick={handleResourceClick}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 cursor-pointer hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {resource.type}
                    </Badge>
                    <span className="text-sm text-foreground">{resource.title}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Related Topics */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Related Topics</p>
            <div className="flex flex-wrap gap-2">
              {concept.relatedTopics.map((topic) => (
                <Badge key={topic} variant="secondary" className="cursor-pointer hover:bg-primary/10">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <Button className="w-full" onClick={handleStartLearning}>
          Start Learning
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}