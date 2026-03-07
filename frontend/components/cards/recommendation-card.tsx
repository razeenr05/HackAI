"use client"

import { useRouter } from "next/navigation"
import { ArrowRight, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface RecommendationCardProps {
  title: string
  description: string
  reason: string
  improvement: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  href?: string
  onClick?: () => void
}

export function RecommendationCard({
  title,
  description,
  reason,
  improvement,
  difficulty,
  href,
  onClick,
}: RecommendationCardProps) {
  const router = useRouter()
  
  const difficultyColors = {
    Beginner: "bg-success/10 text-success border-success/20",
    Intermediate: "bg-warning/10 text-warning border-warning/20",
    Advanced: "bg-destructive/10 text-destructive border-destructive/20",
  }

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (href) {
      router.push(href)
    }
  }

  return (
    <Card 
      className="group cursor-pointer transition-all hover:shadow-lg hover:border-primary/30"
      onClick={handleClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-card-foreground">{title}</h3>
              <Badge
                variant="outline"
                className={difficultyColors[difficulty]}
              >
                {difficulty}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Why:</span>
                {reason}
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-2">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">
                {improvement}
              </span>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              handleClick()
            }}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
