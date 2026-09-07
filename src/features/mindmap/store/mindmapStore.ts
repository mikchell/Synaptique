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
  depth?: number
}

export interface Sheet {
  id: string
  name: string
  nodes: Node<MindmapNodeData>[]
  edges: Edge[]
}

interface MindmapStore {
  sheets: Sheet[]
  currentSheetId: string
  nodes: Node<MindmapNodeData>[]
  edges: Edge[]
  selectedNodeId: string | null

  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void

  addChildNode: (parentId: string, direction: 'right' | 'bottom') => void
  tidyLayout: () => void
  updateNodeLabel: (id: string, label: string) => void
  updateNodeColor: (id: string, color: NodeColor) => void
  deleteNode: (id: string) => void
  setSelectedNodeId: (id: string | null) => void
  resetMindmap: () => void

  addSheet: () => void
  deleteSheet: (id: string) => void
  renameSheet: (id: string, name: string) => void
  switchSheet: (id: string) => void
}

const makeInitialNodes = (): Node<MindmapNodeData>[] => [
  {
    id: 'root',
    type: 'mindmapNode',
    position: { x: 0, y: 0 },
    data: { label: '中心テーマ', color: 'purple', isRoot: true, depth: 0 },
  },
]

let nodeIdCounter = 1
const generateId = () => `node-${Date.now()}-${nodeIdCounter++}`
const generateSheetId = () => `sheet-${Date.now()}`

const COLORS: NodeColor[] = ['purple', 'blue', 'cyan', 'green', 'pink', 'orange']

const initialSheet: Sheet = {
  id: 'sheet-1',
  name: 'シート1',
  nodes: makeInitialNodes(),
  edges: [],
}

export const useMindmapStore = create<MindmapStore>()(
  persist(
    (set, get) => ({
      sheets: [initialSheet],
      currentSheetId: initialSheet.id,
      nodes: initialSheet.nodes,
      edges: initialSheet.edges,
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

      addChildNode: (parentId) => {
        const { nodes, edges } = get()
        const parent = nodes.find((n) => n.id === parentId)
        if (!parent) return

        const siblingCount = edges.filter((e) => e.source === parentId).length
        const spread = siblingCount % 2 === 0 ? siblingCount / 2 : -(Math.ceil(siblingCount / 2))
        const GAP = 180

        const colorIndex = nodes.length % COLORS.length
        const newId = generateId()
        const parentDepth = parent.data.depth ?? 0

        const newNode: Node<MindmapNodeData> = {
          id: newId,
          type: 'mindmapNode',
          position: {
            x: parent.position.x + spread * GAP,
            y: parent.position.y + 200,
          },
          data: { label: 'アイデア', color: COLORS[colorIndex], depth: parentDepth + 1 },
        }

        const newEdge: Edge = {
          id: `edge-${parentId}-${newId}`,
          source: parentId,
          target: newId,
          sourceHandle: 'bottom',
          targetHandle: 'top',
          type: 'default',
          style: { stroke: '#7c3aed', strokeWidth: 2, opacity: 0.7 },
          data: { direction: 'bottom' },
        }

        set({
          nodes: [...nodes, newNode],
          edges: [...edges, newEdge],
          selectedNodeId: newId,
        })
      },

      tidyLayout: () => {
        const { nodes, edges } = get()

        const NODE_W = 160
        const H_GAP = 40
        const V_STEP = 140

        const childrenOf = (id: string) =>
          edges.filter((e) => e.source === id).map((e) => e.target as string)

        const subtreeWidth = (id: string): number => {
          const children = childrenOf(id)
          if (children.length === 0) return NODE_W
          const total = children.reduce((sum, c) => sum + subtreeWidth(c), 0)
          return total + (children.length - 1) * H_GAP
        }

        const positions: Record<string, { x: number; y: number }> = {}

        const layout = (id: string, x: number, depth: number) => {
          positions[id] = { x, y: depth * V_STEP }
          const children = childrenOf(id)
          const totalW =
            children.reduce((s, c) => s + subtreeWidth(c), 0) +
            (children.length - 1) * H_GAP
          let curX = x - totalW / 2
          for (const c of children) {
            const w = subtreeWidth(c)
            layout(c, curX + w / 2, depth + 1)
            curX += w + H_GAP
          }
        }

        layout('root', 0, 0)

        const repositioned = nodes.map((n) =>
          positions[n.id] ? { ...n, position: positions[n.id] } : n
        )
        repositioned.sort((a, b) => (a.data.depth ?? 0) - (b.data.depth ?? 0))

        set({ nodes: repositioned })
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
        const fresh = makeInitialNodes()
        set({ nodes: fresh, edges: [], selectedNodeId: null })
      },

      addSheet: () => {
        const { sheets, currentSheetId, nodes, edges } = get()
        const updatedSheets = sheets.map((s) =>
          s.id === currentSheetId ? { ...s, nodes, edges } : s
        )
        const newSheet: Sheet = {
          id: generateSheetId(),
          name: `シート${updatedSheets.length + 1}`,
          nodes: makeInitialNodes(),
          edges: [],
        }
        set({
          sheets: [...updatedSheets, newSheet],
          currentSheetId: newSheet.id,
          nodes: newSheet.nodes,
          edges: newSheet.edges,
          selectedNodeId: null,
        })
      },

      deleteSheet: (id) => {
        const { sheets, currentSheetId, nodes, edges } = get()
        if (sheets.length <= 1) return
        const updatedSheets = sheets
          .map((s) => (s.id === currentSheetId ? { ...s, nodes, edges } : s))
          .filter((s) => s.id !== id)
        const nextSheet =
          id === currentSheetId
            ? updatedSheets[0]
            : updatedSheets.find((s) => s.id === currentSheetId)!
        set({
          sheets: updatedSheets,
          currentSheetId: nextSheet.id,
          nodes: nextSheet.nodes,
          edges: nextSheet.edges,
          selectedNodeId: null,
        })
      },

      renameSheet: (id, name) => {
        set({
          sheets: get().sheets.map((s) => (s.id === id ? { ...s, name } : s)),
        })
      },

      switchSheet: (id) => {
        const { sheets, currentSheetId, nodes, edges } = get()
        if (id === currentSheetId) return
        const updatedSheets = sheets.map((s) =>
          s.id === currentSheetId ? { ...s, nodes, edges } : s
        )
        const target = updatedSheets.find((s) => s.id === id)
        if (!target) return
        set({
          sheets: updatedSheets,
          currentSheetId: id,
          nodes: target.nodes,
          edges: target.edges,
          selectedNodeId: null,
        })
      },
    }),
    {
      name: 'ore-no-mindmap-storage',
      partialize: (state) => ({
        sheets: state.sheets.map((s) =>
          s.id === state.currentSheetId
            ? { ...s, nodes: state.nodes, edges: state.edges }
            : s
        ),
        currentSheetId: state.currentSheetId,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const current = state.sheets.find((s) => s.id === state.currentSheetId)
        if (current) {
          state.nodes = current.nodes
          state.edges = current.edges
        }
      },
    }
  )
)
