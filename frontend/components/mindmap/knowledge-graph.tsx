"use client"

import { useCallback, useState, useMemo } from "react"
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

const conceptDetails: Record<string, ConceptDetails> = {
  "variables": {
    id: "variables",
    label: "Variables",
    status: "completed",
    level: 4,
    description: "Understanding data types and storage",
    explanation: "Variables are containers for storing data values. In programming, we use variables to hold information that can change during program execution. Variables have types (like numbers, strings, booleans) that determine what kind of data they can store.",
    practiceProblems: ["Declare different variable types", "Variable scope challenge", "Type conversion exercise"],
    resources: [
      { title: "Variables Deep Dive", type: "Video" },
      { title: "Interactive Tutorial", type: "Tutorial" },
    ],
    relatedTopics: ["Types", "Constants", "Scope"],
  },
  "loops": {
    id: "loops",
    label: "Loops",
    status: "completed",
    level: 4,
    description: "Iteration and repetition",
    explanation: "Loops allow you to repeat a block of code multiple times. The main types are for loops (when you know how many iterations), while loops (when you have a condition), and do-while loops (when you need at least one iteration).",
    practiceProblems: ["Sum of array elements", "Pattern printing", "Nested loop challenge"],
    resources: [
      { title: "Loop Mastery Course", type: "Course" },
      { title: "Common Loop Patterns", type: "Article" },
    ],
    relatedTopics: ["Arrays", "Control Flow", "Iteration"],
  },
  "functions": {
    id: "functions",
    label: "Functions",
    status: "in-progress",
    level: 3,
    description: "Modular code blocks",
    explanation: "Functions are reusable blocks of code that perform specific tasks. They can accept parameters (inputs), process data, and return results. Functions help organize code, reduce repetition, and improve maintainability.",
    practiceProblems: ["Create utility functions", "Higher-order functions", "Callback patterns"],
    resources: [
      { title: "Functions Fundamentals", type: "Video" },
      { title: "Clean Function Design", type: "Article" },
    ],
    relatedTopics: ["Parameters", "Return Values", "Closures"],
  },
  "recursion": {
    id: "recursion",
    label: "Recursion",
    status: "weak",
    level: 1,
    description: "Self-referencing functions",
    explanation: "Recursion is a technique where a function calls itself to solve smaller instances of the same problem. It requires a base case to stop the recursion and a recursive case that moves toward the base case.",
    practiceProblems: ["Factorial calculation", "Fibonacci sequence", "Tree traversal"],
    resources: [
      { title: "Recursion Explained", type: "Video" },
      { title: "Visualizing Recursion", type: "Interactive" },
    ],
    relatedTopics: ["Functions", "Call Stack", "Base Case"],
  },
  "arrays": {
    id: "arrays",
    label: "Arrays",
    status: "in-progress",
    level: 3,
    description: "Ordered data collections",
    explanation: "Arrays are ordered collections of elements that can be accessed by index. They are fundamental data structures used to store multiple values of the same type in a single variable.",
    practiceProblems: ["Array manipulation", "Two pointer technique", "Sliding window"],
    resources: [
      { title: "Array Methods Guide", type: "Tutorial" },
      { title: "Array Algorithms", type: "Course" },
    ],
    relatedTopics: ["Loops", "Indexing", "Sorting"],
  },
  "linked-lists": {
    id: "linked-lists",
    label: "Linked Lists",
    status: "recommended",
    level: 2,
    description: "Dynamic linear structures",
    explanation: "Linked lists are linear data structures where elements are stored in nodes, each pointing to the next node. Unlike arrays, linked lists allow efficient insertion and deletion without reorganizing the entire structure.",
    practiceProblems: ["Reverse linked list", "Detect cycle", "Merge sorted lists"],
    resources: [
      { title: "Linked List Basics", type: "Video" },
      { title: "Implementation Guide", type: "Tutorial" },
    ],
    relatedTopics: ["Pointers", "Memory", "Nodes"],
  },
  "trees": {
    id: "trees",
    label: "Trees",
    status: "locked",
    level: 1,
    description: "Hierarchical structures",
    explanation: "Trees are hierarchical data structures with a root node and child nodes. Binary trees, binary search trees, and balanced trees are common variants used for efficient searching, sorting, and organizing data.",
    practiceProblems: ["Tree traversal", "BST operations", "Tree height"],
    resources: [
      { title: "Tree Data Structures", type: "Course" },
      { title: "Binary Trees Explained", type: "Video" },
    ],
    relatedTopics: ["Recursion", "Graphs", "Traversal"],
  },
  "sorting": {
    id: "sorting",
    label: "Sorting",
    status: "weak",
    level: 2,
    description: "Ordering algorithms",
    explanation: "Sorting algorithms arrange elements in a specific order. Common algorithms include bubble sort, merge sort, quick sort, and heap sort. Understanding their time and space complexity helps choose the right one for each situation.",
    practiceProblems: ["Implement merge sort", "Quick sort variations", "Sort analysis"],
    resources: [
      { title: "Sorting Visualized", type: "Interactive" },
      { title: "Algorithm Analysis", type: "Article" },
    ],
    relatedTopics: ["Arrays", "Complexity", "Comparison"],
  },
}

const initialNodes: Node<ConceptNodeData>[] = [
  { id: "variables", position: { x: 400, y: 50 }, data: { label: "Variables", status: "completed", level: 4 }, type: "concept" },
  { id: "loops", position: { x: 200, y: 150 }, data: { label: "Loops", status: "completed", level: 4 }, type: "concept" },
  { id: "functions", position: { x: 600, y: 150 }, data: { label: "Functions", status: "in-progress", level: 3 }, type: "concept" },
  { id: "arrays", position: { x: 100, y: 280 }, data: { label: "Arrays", status: "in-progress", level: 3 }, type: "concept" },
  { id: "recursion", position: { x: 500, y: 280 }, data: { label: "Recursion", status: "weak", level: 1 }, type: "concept" },
  { id: "linked-lists", position: { x: 300, y: 380 }, data: { label: "Linked Lists", status: "recommended", level: 2 }, type: "concept" },
  { id: "trees", position: { x: 500, y: 450 }, data: { label: "Trees", status: "locked", level: 1 }, type: "concept" },
  { id: "sorting", position: { x: 100, y: 420 }, data: { label: "Sorting", status: "weak", level: 2 }, type: "concept" },
]

const initialEdges: Edge[] = [
  { id: "e1", source: "variables", target: "loops", animated: false, style: { stroke: "hsl(var(--border))" } },
  { id: "e2", source: "variables", target: "functions", animated: false, style: { stroke: "hsl(var(--border))" } },
  { id: "e3", source: "loops", target: "arrays", animated: false, style: { stroke: "hsl(var(--border))" } },
  { id: "e4", source: "functions", target: "recursion", animated: true, style: { stroke: "hsl(var(--destructive))" } },
  { id: "e5", source: "arrays", target: "linked-lists", animated: true, style: { stroke: "hsl(var(--primary))" } },
  { id: "e6", source: "arrays", target: "sorting", animated: false, style: { stroke: "hsl(var(--border))" } },
  { id: "e7", source: "recursion", target: "trees", animated: false, style: { stroke: "hsl(var(--border))", opacity: 0.4 } },
  { id: "e8", source: "linked-lists", target: "trees", animated: false, style: { stroke: "hsl(var(--border))", opacity: 0.4 } },
]

export function KnowledgeGraph() {
  const nodeTypes: NodeTypes = useMemo(() => ({ concept: ConceptNode }), [])
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedConcept, setSelectedConcept] = useState<ConceptDetails | null>(null)

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const details = conceptDetails[node.id]
    if (details) {
      setSelectedConcept(details)
    }
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedConcept(null)
  }, [])

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
              case "completed": return "hsl(var(--success))"
              case "in-progress": return "hsl(var(--warning))"
              case "weak": return "hsl(var(--destructive))"
              case "recommended": return "hsl(var(--primary))"
              default: return "hsl(var(--muted))"
            }
          }}
        />
      </ReactFlow>
      <ConceptPanel concept={selectedConcept} onClose={handleClosePanel} />
    </div>
  )
}
