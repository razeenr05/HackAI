"use client"

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

interface SkillRadarChartProps {
  data: {
    subject: string
    value: number
    fullMark: number
  }[]
}

export function SkillRadarChart({ data }: SkillRadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
        <PolarGrid 
          stroke="hsl(var(--border))" 
          strokeOpacity={0.8}
        />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
          tickLine={{ stroke: "hsl(var(--border))" }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 5]}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
          axisLine={{ stroke: "hsl(var(--border))" }}
          tickCount={6}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            color: "hsl(var(--popover-foreground))",
          }}
          formatter={(value: number) => [`Level ${value}`, "Skill"]}
        />
        <Radar
          name="Skill Level"
          dataKey="value"
          stroke="hsl(var(--chart-1))"
          fill="hsl(var(--chart-1))"
          fillOpacity={0.5}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}