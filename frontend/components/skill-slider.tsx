"use client"

import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

interface SkillSliderProps {
  concept: string
  description?: string
  initialValue: number
  onChange?: (value: number) => void
}

const levelLabels = ["None", "Basic", "Intermediate", "Proficient", "Expert"]

export function SkillSlider({
  concept,
  description,
  initialValue,
  onChange,
}: SkillSliderProps) {
  const [value, setValue] = useState(initialValue)

  const handleChange = (newValue: number[]) => {
    setValue(newValue[0])
    onChange?.(newValue[0])
  }

  const getLevelColor = (level: number) => {
    if (level <= 1) return "text-destructive"
    if (level <= 2) return "text-warning"
    if (level <= 3) return "text-info"
    return "text-success"
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-card-foreground">{concept}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        <div className="text-right">
          <span className={cn("text-2xl font-bold", getLevelColor(value))}>
            {value}
          </span>
          <span className="text-muted-foreground">/5</span>
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={handleChange}
        max={5}
        min={0}
        step={1}
        className="py-2"
      />
      <div className="flex justify-between mt-2">
        {levelLabels.map((label, index) => (
          <span
            key={label}
            className={cn(
              "text-xs transition-colors",
              value === index
                ? "text-primary font-medium"
                : "text-muted-foreground"
            )}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}