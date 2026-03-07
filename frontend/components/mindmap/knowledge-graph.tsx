"use client"

import { useCallback, useState, useMemo, useEffect } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  BackgroundVariant,
  ConnectionMode,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { ConceptNode, type ConceptNodeData, type ConceptStatus } from "./concept-node"
import { ConceptPanel } from "./concept-panel"
import { Loader2, AlertCircle } from "lucide-react"

interface ConceptDetails {
  id: string
  label: string
  status: ConceptStatus
  level: number
  description: string
  explanation: string
  practiceProblems: string[]
  resources: { title: string; type: string }[]
  relatedTopics: string[]
}

export function KnowledgeGraph() {
  const nodeTypes: NodeTypes = useMemo(() => ({ concept: ConceptNode }), [])
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedConcept, setSelectedConcept] = useState<ConceptDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Fetch the mind map from the API on mount
  useEffect(() => {
    const userId = localStorage.getItem("hackai_user_id") || "user-1"

    fetch(`http://localhost:8000/api/mindmap/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load mind map")
        return res.json()
      })
      .then((data) => {
        setNodes(data.nodes)
        setEdges(data.edges)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || "Could not load your learning map.")
        setLoading(false)
      })
  }, [])

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const userId = localStorage.getItem("hackai_user_id") || "user-1"

    fetch(`http://localhost:8000/api/nodes/${node.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Node not found")
        return res.json()
      })
      .then((data) => setSelectedConcept(data))
      .catch(() => {
        // If detail fetch fails, show what we have from the node data
        const d = node.data as unknown as ConceptNodeData
        setSelectedConcept({
          id: node.id,
          label: d.label,
          status: d.status as ConceptStatus,
          level: d.level,
          description: d.description || "",
          explanation: "",
          practiceProblems: [],
          resources: [],
          relatedTopics: [],
        })
      })
  }, [])

  const handleClosePanel = useCallback(() => setSelectedConcept(null), [])

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading your learning map...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center gap-3 text-destructive">
        <AlertCircle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        className="bg-background"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--border))" />
        <Controls className="!bg-card !border-border !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-secondary" />
        <MiniMap
          className="!bg-card !border-border"
          nodeColor={(node) => {
            const data = node.data as ConceptNodeData
            switch (data.status) {
              case "completed":   return "hsl(var(--success))"
              case "in-progress": return "hsl(var(--warning))"
              case "weak":        return "hsl(var(--destructive))"
              case "recommended": return "hsl(var(--primary))"
              default:            return "hsl(var(--muted))"
            }
          }}
        />
      </ReactFlow>
      <ConceptPanel concept={selectedConcept} onClose={handleClosePanel} />
    </div>
  )
}
