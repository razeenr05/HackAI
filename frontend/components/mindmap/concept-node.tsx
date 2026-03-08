"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { cn } from "@/lib/utils"

export type ConceptStatus = "completed" | "in-progress" | "weak" | "recommended" | "locked"

export interface ConceptNodeData extends Record<string, unknown> {
  label: string
  status: ConceptStatus
  level: number
  description?: string
}

const statusConfig: Record<ConceptStatus, { bg: string; border: string; text: string; ring: string }> = {
  completed: {
    bg: "bg-success/10",
    border: "border-success/50",
    text: "text-success",
    ring: "ring-success/30",
  },
  "in-progress": {
    bg: "bg-warning/10",
    border: "border-warning/50",
    text: "text-warning",
    ring: "ring-warning/30",
  },
  weak: {
    bg: "bg-destructive/10",
    border: "border-destructive/50",
    text: "text-destructive",
    ring: "ring-destructive/30",
  },
  recommended: {
    bg: "bg-primary/10",
    border: "border-primary/50",
    text: "text-primary",
    ring: "ring-primary/30",
  },
  locked: {
    bg: "bg-muted",
    border: "border-border",
    text: "text-muted-foreground",
    ring: "ring-border",
  },
}

function ConceptNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as unknown as ConceptNodeData
  const config = statusConfig[nodeData.status]

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-xl border-2 min-w-[140px] max-w-[180px] transition-all cursor-pointer",
        config.bg,
        config.border,
        selected && `ring-2 ${config.ring} shadow-lg`
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-border !w-2 !h-2"
      />
      <div className="text-center">
        <p className={cn("text-sm font-semibold", config.text)}>{nodeData.label}</p>
        <div className="flex items-center justify-center gap-1 mt-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                i < nodeData.level 
                  ? nodeData.status === "completed" ? "bg-success"
                    : nodeData.status === "in-progress" ? "bg-warning"
                    : nodeData.status === "weak" ? "bg-destructive"
                    : nodeData.status === "recommended" ? "bg-primary"
                    : "bg-muted-foreground"
                  : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-border !w-2 !h-2"
      />
    </div>
  )
}

export const ConceptNode = memo(ConceptNodeComponent)