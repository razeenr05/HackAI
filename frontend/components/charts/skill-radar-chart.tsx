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
          stroke="var(--border)" 
          strokeOpacity={0.8}
        />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "var(--foreground)", fontSize: 12 }}
          tickLine={{ stroke: "var(--border)" }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 5]}
          tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
          axisLine={{ stroke: "var(--border)" }}
          tickCount={6}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--popover-foreground)",
          }}
          formatter={(value: number) => [`Level ${value}`, "Skill"]}
        />
        <Radar
          name="Skill Level"
          dataKey="value"
          stroke="var(--chart-1)"
          fill="var(--chart-1)"
          fillOpacity={0.5}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}