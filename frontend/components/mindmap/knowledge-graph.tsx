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
  MarkerType,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { ConceptNode, type ConceptNodeData, type ConceptStatus } from "./concept-node"
import { ConceptPanel } from "./concept-panel"

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
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ConceptNodeData>>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedConcept, setSelectedConcept] = useState<ConceptDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const userId = typeof window !== "undefined"
    ? (localStorage.getItem("hackai_user_id") || "user-1")
    : "user-1"

  const loadGraph = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`http://localhost:8000/api/mindmap/${userId}`)
      if (!res.ok) throw new Error("Failed to load mind map")
      const data = await res.json()

      const flowNodes: Node<ConceptNodeData>[] = (data.nodes || []).map((n: any) => ({
        id: n.id,
        position: n.position,
        type: "concept",
        data: {
          label: n.data.label,
          status: n.data.status as ConceptStatus,
          level: n.data.level,
          description: n.data.description,
        } as ConceptNodeData,
      }))

      const flowEdges: Edge[] = (data.edges || []).map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: e.animated ?? false,
        type: "smoothstep",
        style: {
          ...(e.style ?? {}),
          stroke: e.animated ? "hsl(var(--primary))" : "hsl(var(--border))",
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: e.animated ? "hsl(var(--primary))" : "hsl(var(--border))",
          width: 16,
          height: 16,
        },
      }))

      setNodes(flowNodes)
      setEdges(flowEdges)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { loadGraph() }, [loadGraph])

  const onNodeClick = useCallback(async (_event: React.MouseEvent, node: Node) => {
    try {
      const res = await fetch(`http://localhost:8000/api/nodes/${node.id}`)
      if (!res.ok) return
      const data: ConceptDetails = await res.json()
      setSelectedConcept(data)
    } catch { /* silently ignore */ }
  }, [])

  // Called by ConceptPanel when user marks a node complete or uncomplete
  const handleMarkComplete = useCallback(async (nodeId: string) => {
    try {
      await fetch("http://localhost:8000/api/progress/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, node_id: nodeId }),
      })
      // Refresh graph to update statuses and unlock next nodes
      await loadGraph()
      // Re-fetch concept detail so the panel reflects the new "completed" status
      const res = await fetch(`http://localhost:8000/api/nodes/${nodeId}`)
      if (res.ok) {
        const updated = await res.json()
        // Force status to "completed" since the progress endpoint doesn't mutate the node row
        setSelectedConcept({ ...updated, status: "completed" })
      }
    } catch { /* ignore */ }
  }, [userId, loadGraph])

  const handleMarkUncomplete = useCallback(async (nodeId: string) => {
    try {
      await fetch("http://localhost:8000/api/progress/uncomplete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, node_id: nodeId }),
      })
      await loadGraph()
      // Re-fetch concept detail so panel reflects the updated status
      const res = await fetch(`http://localhost:8000/api/nodes/${nodeId}`)
      if (res.ok) {
        const updated = await res.json()
        setSelectedConcept({ ...updated, status: "recommended" })
      }
    } catch { /* ignore */ }
  }, [userId, loadGraph])

  const handleClosePanel = useCallback(() => setSelectedConcept(null), [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span>Loading your knowledge graph...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-destructive gap-2">
        <span>⚠ {error} — make sure the backend is running.</span>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground p-8 text-center">
        <span className="text-4xl">🗺️</span>
        <p className="font-medium text-foreground">No mind map yet</p>
        <p className="text-sm">Go to <strong>Skill Assessment</strong> and enter a learning goal to generate your personalised knowledge graph.</p>
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
              case "completed":    return "hsl(var(--success))"
              case "in-progress":  return "hsl(var(--warning))"
              case "weak":         return "hsl(var(--destructive))"
              case "recommended":  return "hsl(var(--primary))"
              default:             return "hsl(var(--muted))"
            }
          }}
        />
      </ReactFlow>
      <ConceptPanel
        concept={selectedConcept}
        onClose={handleClosePanel}
        onMarkComplete={handleMarkComplete}
        onMarkUncomplete={handleMarkUncomplete}
      />
    </div>
  )
}