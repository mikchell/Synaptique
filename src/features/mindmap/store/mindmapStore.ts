import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from '@xyflow/react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NodeColor = 'purple' | 'blue' | 'cyan' | 'green' | 'pink' | 'orange'

export interface MindmapNodeData extends Record<string, unknown> {
  label: string
  color: NodeColor
  isRoot?: boolean
}

interface MindmapStore {
  nodes: Node<MindmapNodeData>[]
  edges: Edge[]
  selectedNodeId: string | null

  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void

  addChildNode: (parentId: string, direction: 'right' | 'bottom') => void
  updateNodeLabel: (id: string, label: string) => void
  updateNodeColor: (id: string, color: NodeColor) => void
  deleteNode: (id: string) => void
  setSelectedNodeId: (id: string | null) => void
  resetMindmap: () => void
}

const initialNodes: Node<MindmapNodeData>[] = [
  {
    id: 'root',
    type: 'mindmapNode',
    position: { x: 0, y: 0 },
    data: { label: '中心テーマ', color: 'purple', isRoot: true },
  },
]

let nodeIdCounter = 1
const generateId = () => `node-${Date.now()}-${nodeIdCounter++}`

const NODE_OFFSETS = [
  { x: 280, y: -120 },
  { x: 280, y: 0 },
  { x: 280, y: 120 },
  { x: -280, y: -120 },
  { x: -280, y: 0 },
  { x: -280, y: 120 },
]

const COLORS: NodeColor[] = ['purple', 'blue', 'cyan', 'green', 'pink', 'orange']

export const useMindmapStore = create<MindmapStore>()(
  persist(
    (set, get) => ({
      nodes: initialNodes,
      edges: [],
      selectedNodeId: null,

      onNodesChange: (changes) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) as Node<MindmapNodeData>[] })
      },

      onEdgesChange: (changes) => {
        set({ edges: applyEdgeChanges(changes, get().edges) })
      },

      onConnect: (connection) => {
        const edge: Edge = {
          ...connection,
          id: `edge-${connection.source}-${connection.target}`,
          type: 'default',
          animated: false,
          style: { stroke: '#7c3aed', strokeWidth: 2, opacity: 0.7 },
        }
        set({ edges: addEdge(edge, get().edges) })
      },

      addChildNode: (parentId, direction) => {
        const { nodes, edges } = get()
        const parent = nodes.find((n) => n.id === parentId)
        if (!parent) return

        const sameDir = edges.filter(
          (e) => e.source === parentId && e.data?.direction === direction
        ).length
        const spread = (sameDir + 1) % 2 === 0 ? sameDir / 2 : -(Math.ceil(sameDir / 2))
        const GAP = 160

        const offset =
          direction === 'right'
            ? { x: 280, y: spread * GAP }
            : { x: spread * GAP, y: 200 }

        const colorIndex = nodes.length % COLORS.length
        const newId = generateId()

        const newNode: Node<MindmapNodeData> = {
          id: newId,
          type: 'mindmapNode',
          position: {
            x: parent.position.x + offset.x,
            y: parent.position.y + offset.y,
          },
          data: { label: 'アイデア', color: COLORS[colorIndex] },
        }

        const newEdge: Edge = {
          id: `edge-${parentId}-${newId}`,
          source: parentId,
          target: newId,
          sourceHandle: direction === 'right' ? 'right' : 'bottom',
          type: 'default',
          style: { stroke: '#7c3aed', strokeWidth: 2, opacity: 0.7 },
          data: { direction },
        }

        set({
          nodes: [...nodes, newNode],
          edges: [...edges, newEdge],
          selectedNodeId: newId,
        })
      },

      updateNodeLabel: (id, label) => {
        set({
          nodes: get().nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, label } } : n
          ),
        })
      },

      updateNodeColor: (id, color) => {
        set({
          nodes: get().nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, color } } : n
          ),
        })
      },

      deleteNode: (id) => {
        if (id === 'root') return
        set({
          nodes: get().nodes.filter((n) => n.id !== id),
          edges: get().edges.filter((e) => e.source !== id && e.target !== id),
          selectedNodeId: null,
        })
      },

      setSelectedNodeId: (id) => set({ selectedNodeId: id }),

      resetMindmap: () => {
        set({ nodes: initialNodes, edges: [], selectedNodeId: null })
      },
    }),
    {
      name: 'ore-no-mindmap-storage',
      // selectedNodeId は永続化しない
      partialize: (state) => ({ nodes: state.nodes, edges: state.edges }),
    }
  )
)
