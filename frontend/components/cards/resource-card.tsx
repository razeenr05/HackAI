"use client"

import { Play, ExternalLink, Clock, Tag } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ResourceCardProps {
  title: string
  description: string
  type: "video" | "article" | "course" | "tutorial" | "interactive"
  thumbnail?: string
  timestamp?: string
  duration?: string
  topic: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  source?: string
  onWatch?: () => void
}

const typeConfig = {
  video: { icon: Play, color: "bg-destructive/10 text-destructive border-destructive/30" },
  article: { icon: ExternalLink, color: "bg-info/10 text-info border-info/30" },
  course: { icon: Tag, color: "bg-primary/10 text-primary border-primary/30" },
  tutorial: { icon: ExternalLink, color: "bg-success/10 text-success border-success/30" },
  interactive: { icon: Play, color: "bg-warning/10 text-warning border-warning/30" },
}

const difficultyColors = {
  Beginner: "bg-success/10 text-success border-success/30",
  Intermediate: "bg-warning/10 text-warning border-warning/30",
  Advanced: "bg-destructive/10 text-destructive border-destructive/30",
}

export function ResourceCard({
  title,
  description,
  type,
  thumbnail,
  timestamp,
  duration,
  topic,
  difficulty,
  source,
  onWatch,
}: ResourceCardProps) {
  const TypeIcon = typeConfig[type].icon

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg hover:border-primary/30">
      {/* Thumbnail Section for Videos */}
      {type === "video" && (
        <div className="relative aspect-video bg-gradient-to-br from-primary/20 via-accent/20 to-secondary overflow-hidden">
          {thumbnail && (
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${thumbnail})` }}
            />
          )}
          <div className="absolute inset-0 bg-background/10 group-hover:bg-background/5 transition-colors" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-background/90 p-4 shadow-lg transition-transform group-hover:scale-110">
              <Play className="h-6 w-6 text-primary fill-primary" />
            </div>
          </div>
          {duration && (
            <div className="absolute bottom-2 right-2 rounded bg-background/90 px-2 py-1">
              <span className="text-xs font-medium text-foreground">{duration}</span>
            </div>
          )}
        </div>
      )}

      <CardContent className={type === "video" ? "p-4" : "p-5"}>
        <div className="space-y-3">
          {/* Header with badges */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={typeConfig[type].color}>
                <TypeIcon className="mr-1 h-3 w-3" />
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Badge>
              <Badge variant="outline" className={difficultyColors[difficulty]}>
                {difficulty}
              </Badge>
            </div>
          </div>

          {/* Title and description */}
          <div>
            <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors line-clamp-2">
              {title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {description}
            </p>
          </div>

          {/* Timestamp for videos */}
          {timestamp && (
            <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">
                Watch <span className="font-medium text-primary">{timestamp}</span>
              </span>
            </div>
          )}

          {/* Topic and source */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{topic}</Badge>
              {source && (
                <span className="text-xs text-muted-foreground">{source}</span>
              )}
            </div>
          </div>

          {/* Action Button */}
          <Button className="w-full" onClick={onWatch}>
            {type === "video" ? (
              <>
                <Play className="mr-2 h-4 w-4" />
                Watch Now
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Resource
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
