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
  editingNodeId: string | null

  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void

  addChildNode: (parentId: string) => void
  addChildNodeBelow: (parentId: string) => void
  addSiblingNode: (nodeId: string) => void
  tidyLayout: () => void
  updateNodeLabel: (id: string, label: string) => void
  updateNodeColor: (id: string, color: NodeColor) => void
  deleteNode: (id: string) => void
  setSelectedNodeId: (id: string | null) => void
  setEditingNodeId: (id: string | null) => void
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

const NODE_W = 240
const NODE_H = 80
const PADDING = 16

function overlaps(
  pos: { x: number; y: number },
  node: Node<MindmapNodeData>
): boolean {
  return (
    Math.abs(pos.x - node.position.x) < NODE_W + PADDING &&
    Math.abs(pos.y - node.position.y) < NODE_H + PADDING
  )
}

function avoidCollision(
  proposed: { x: number; y: number },
  nodes: Node<MindmapNodeData>[],
  shift: 'y' | 'x'
): { x: number; y: number } {
  let pos = { ...proposed }
  for (let i = 0; i < 50; i++) {
    const hit = nodes.find((n) => overlaps(pos, n))
    if (!hit) return pos
    if (shift === 'y') pos = { ...pos, y: hit.position.y + NODE_H + PADDING }
    else pos = { ...pos, x: hit.position.x + NODE_W + PADDING }
  }
  return pos
}


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
      editingNodeId: null,

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

        const existingChildren = edges
          .filter((e) => e.source === parentId && e.sourceHandle === 'right')
          .map((e) => nodes.find((n) => n.id === e.target))
          .filter((n): n is Node<MindmapNodeData> => !!n)
          .sort((a, b) => a.position.y - b.position.y)

        const baseY =
          existingChildren.length === 0
            ? parent.position.y
            : existingChildren[existingChildren.length - 1].position.y + NODE_H + PADDING

        const colorIndex = nodes.length % COLORS.length
        const newId = generateId()
        const parentDepth = parent.data.depth ?? 0

        // x は親の右側固定、y方向のみ衝突回避
        const position = avoidCollision(
          { x: parent.position.x + NODE_W + PADDING, y: baseY },
          nodes,
          'y'
        )

        const newNode: Node<MindmapNodeData> = {
          id: newId,
          type: 'mindmapNode',
          position,
          data: { label: 'アイデア', color: COLORS[colorIndex], depth: parentDepth + 1 },
        }

        const newEdge: Edge = {
          id: `edge-${parentId}-${newId}`,
          source: parentId,
          target: newId,
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'default',
          style: { stroke: '#7c3aed', strokeWidth: 2, opacity: 0.7 },
        }

        set({
          nodes: [...nodes, newNode],
          edges: [...edges, newEdge],
          selectedNodeId: newId,
          editingNodeId: newId,
        })
      },

      addChildNodeBelow: (parentId) => {
        const { nodes, edges } = get()
        const parent = nodes.find((n) => n.id === parentId)
        if (!parent) return

        const existingBelow = edges
          .filter((e) => e.source === parentId && e.sourceHandle === 'bottom')
          .map((e) => nodes.find((n) => n.id === e.target))
          .filter((n): n is Node<MindmapNodeData> => !!n)
          .sort((a, b) => a.position.y - b.position.y)

        const baseY =
          existingBelow.length === 0
            ? parent.position.y + NODE_H + PADDING
            : existingBelow[existingBelow.length - 1].position.y + NODE_H + PADDING

        const colorIndex = nodes.length % COLORS.length
        const newId = generateId()
        const parentDepth = parent.data.depth ?? 0

        // x は親と同じ位置固定、y方向のみ衝突回避
        const position = avoidCollision(
          { x: parent.position.x, y: baseY },
          nodes,
          'y'
        )

        const newNode: Node<MindmapNodeData> = {
          id: newId,
          type: 'mindmapNode',
          position,
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
        }

        set({
          nodes: [...nodes, newNode],
          edges: [...edges, newEdge],
          selectedNodeId: newId,
          editingNodeId: newId,
        })
      },

      addSiblingNode: (nodeId) => {
        const { nodes, edges } = get()
        // ルートノードは兄弟を持てない
        const parentEdge = edges.find((e) => e.target === nodeId)
        if (!parentEdge) return

        const parentId = parentEdge.source
        const parent = nodes.find((n) => n.id === parentId)
        const currentNode = nodes.find((n) => n.id === nodeId)
        if (!parent || !currentNode) return

        const colorIndex = nodes.length % COLORS.length
        const newId = generateId()
        const parentDepth = parent.data.depth ?? 0

        // x は現在ノードと同じ（同世代）、y方向のみ衝突回避
        const position = avoidCollision(
          { x: currentNode.position.x, y: currentNode.position.y + NODE_H + PADDING },
          nodes,
          'y'
        )

        const newNode: Node<MindmapNodeData> = {
          id: newId,
          type: 'mindmapNode',
          position,
          data: { label: 'アイデア', color: COLORS[colorIndex], depth: parentDepth + 1 },
        }

        const newEdge: Edge = {
          id: `edge-${parentId}-${newId}`,
          source: parentId,
          target: newId,
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'default',
          style: { stroke: '#7c3aed', strokeWidth: 2, opacity: 0.7 },
        }

        set({
          nodes: [...nodes, newNode],
          edges: [...edges, newEdge],
          selectedNodeId: newId,
        })
      },

      tidyLayout: () => {
        const { nodes, edges } = get()

        const NODE_H = 60
        const V_GAP = 80
        const H_STEP = 240

        const childrenOf = (id: string) =>
          edges.filter((e) => e.source === id).map((e) => e.target as string)

        const subtreeHeight = (id: string): number => {
          const children = childrenOf(id)
          if (children.length === 0) return NODE_H
          const total = children.reduce((sum, c) => sum + subtreeHeight(c), 0)
          return total + (children.length - 1) * V_GAP
        }

        const positions: Record<string, { x: number; y: number }> = {}

        const layout = (id: string, y: number, depth: number) => {
          positions[id] = { x: depth * H_STEP, y }
          const children = childrenOf(id)
          const totalH =
            children.reduce((s, c) => s + subtreeHeight(c), 0) +
            (children.length - 1) * V_GAP
          let curY = y - totalH / 2
          for (const c of children) {
            const h = subtreeHeight(c)
            layout(c, curY + h / 2, depth + 1)
            curY += h + V_GAP
          }
        }

        layout('root', 0, 0)

        const repositioned = nodes.map((n) =>
          positions[n.id] ? { ...n, position: positions[n.id] } : n
        )
        repositioned.sort((a, b) => (a.data.depth ?? 0) - (b.data.depth ?? 0))

        const normalizedEdges = edges.map((e) =>
          e.sourceHandle === 'bottom'
            ? { ...e, sourceHandle: 'right', targetHandle: 'left' }
            : e
        )

        set({ nodes: repositioned, edges: normalizedEdges })
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

      setEditingNodeId: (id) => set({ editingNodeId: id }),

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
      name: 'synaptique-storage',
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
