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
          stroke: e.animated ? "var(--primary)" : "var(--muted-foreground)",
          strokeWidth: e.animated ? 2.5 : 1.8,
          opacity: 0.8,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: e.animated ? "var(--primary)" : "var(--muted-foreground)",
          width: 18,
          height: 18,
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
      // Use live status from the node in state (may differ from DB row status)
      const liveNode = nodes.find(n => n.id === node.id)
      setSelectedConcept({ ...data, status: liveNode?.data.status ?? data.status })
    } catch { /* silently ignore */ }
  }, [nodes])

  const handleMarkStart = useCallback(async (nodeId: string) => {
    try {
      await fetch("http://localhost:8000/api/progress/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, node_id: nodeId }),
      })
      await loadGraph()
      const res = await fetch(`http://localhost:8000/api/nodes/${nodeId}`)
      if (res.ok) {
        const updated = await res.json()
        setSelectedConcept({ ...updated, status: "in-progress" })
      }
    } catch { /* ignore */ }
  }, [userId, loadGraph])

  const handleMarkComplete = useCallback(async (nodeId: string) => {
    try {
      await fetch("http://localhost:8000/api/progress/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, node_id: nodeId }),
      })
      await loadGraph()
      const res = await fetch(`http://localhost:8000/api/nodes/${nodeId}`)
      if (res.ok) {
        const updated = await res.json()
        setSelectedConcept({ ...updated, status: "completed" })
      }
    } catch { /* ignore */ }
  }, [userId, loadGraph])

  const handleMarkWeak = useCallback(async (nodeId: string) => {
    try {
      await fetch("http://localhost:8000/api/progress/weak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, node_id: nodeId }),
      })
      await loadGraph()
      const res = await fetch(`http://localhost:8000/api/nodes/${nodeId}`)
      if (res.ok) {
        const updated = await res.json()
        setSelectedConcept({ ...updated, status: "weak" })
      }
    } catch {
      /* ignore */
    }
  }, [userId, loadGraph])

  const handleMarkUncomplete = useCallback(async (nodeId: string) => {
    try {
      await fetch("http://localhost:8000/api/progress/uncomplete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, node_id: nodeId }),
      })
      await loadGraph()
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
        <p className="text-sm">Go to <strong>Learn</strong> and enter a learning goal to generate your personalised knowledge graph.</p>
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
        fitViewOptions={{ padding: 0.25 }}
        className="bg-background"
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { strokeWidth: 2 },
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border)" />
        <Controls className="!bg-card !border-border !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-secondary" />
        <MiniMap
          className="!bg-card !border-border"
          nodeColor={(node) => {
            const data = node.data as ConceptNodeData
            switch (data.status) {
              case "completed":    return "var(--success)"
              case "in-progress":  return "var(--warning)"
              case "weak":         return "var(--destructive)"
              case "recommended":  return "var(--primary)"
              default:             return "var(--muted)"
            }
          }}
        />
      </ReactFlow>
      <ConceptPanel
        concept={selectedConcept}
        onClose={handleClosePanel}
        onMarkStart={handleMarkStart}
        onMarkComplete={handleMarkComplete}
        onMarkWeak={handleMarkWeak}
        onMarkUncomplete={handleMarkUncomplete}
      />
    </div>
  )
}