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
export type MapType = 'linear' | 'free'

export interface MindmapNodeData extends Record<string, unknown> {
  label: string
  color: NodeColor
  isRoot?: boolean
  depth?: number
  memo?: string
  borderWidth?: number
  sizeScale?: number
}

export interface Sheet {
  id: string
  name: string
  mapType?: MapType
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
  defaultNodeColor: NodeColor | null
  isSaving: boolean
  layoutSnapshot: Node<MindmapNodeData>[] | null
  templateModalOpen: boolean
  templateModalMode: 'init' | 'new'

  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void

  addChildNode: (parentId: string) => void
  addChildNodeBelow: (parentId: string) => void
  addChildNodeInDirection: (parentId: string, direction: 'left' | 'right' | 'top' | 'bottom') => void
  addSiblingNode: (nodeId: string) => void
  insertNodeBetween: (sourceId: string, targetId: string, edgeId: string, sourceHandle: string, targetHandle: string) => void
  tidyLayout: () => void
  tidySelectedLayout: () => void
  toggleLayout: () => void
  updateNodeLabel: (id: string, label: string) => void
  updateNodeColor: (id: string, color: NodeColor) => void
  updateNodeMemo: (id: string, memo: string) => void
  updateNodeBorderWidth: (id: string, borderWidth: number) => void
  updateNodeSizeScale: (id: string, sizeScale: number) => void
  deleteNode: (id: string) => void
  setSelectedNodeId: (id: string | null) => void
  setEditingNodeId: (id: string | null) => void
  setDefaultNodeColor: (color: NodeColor | null) => void
  setIsSaving: (v: boolean) => void
  resetMindmap: () => void

  openTemplateModal: (mode: 'init' | 'new') => void
  closeTemplateModal: () => void
  setCurrentSheetMapType: (mapType: MapType) => void
  addSheet: (mapType: MapType) => void
  deleteSheet: (id: string) => void
  renameSheet: (id: string, name: string) => void
  switchSheet: (id: string) => void
  loadSheets: (sheets: Sheet[]) => void
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
const generateSheetId = () => crypto.randomUUID()

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
  id: crypto.randomUUID(),
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
      defaultNodeColor: null,
      isSaving: false,
      layoutSnapshot: null,
      templateModalOpen: false,
      templateModalMode: 'init' as const,

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
          type: 'interactive',
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
        const nodeColor = get().defaultNodeColor ?? COLORS[colorIndex]
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
          data: { label: 'アイデア', color: nodeColor, depth: parentDepth + 1 },
        }

        const newEdge: Edge = {
          id: `edge-${parentId}-${newId}`,
          source: parentId,
          target: newId,
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'interactive',
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
        const nodeColor = get().defaultNodeColor ?? COLORS[colorIndex]
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
          data: { label: 'アイデア', color: nodeColor, depth: parentDepth + 1 },
        }

        const newEdge: Edge = {
          id: `edge-${parentId}-${newId}`,
          source: parentId,
          target: newId,
          sourceHandle: 'bottom',
          targetHandle: 'top',
          type: 'interactive',
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
        const nodeColor = get().defaultNodeColor ?? COLORS[colorIndex]
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
          data: { label: 'アイデア', color: nodeColor, depth: parentDepth + 1 },
        }

        const newEdge: Edge = {
          id: `edge-${parentId}-${newId}`,
          source: parentId,
          target: newId,
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'interactive',
          style: { stroke: '#7c3aed', strokeWidth: 2, opacity: 0.7 },
        }

        set({
          nodes: [...nodes, newNode],
          edges: [...edges, newEdge],
          selectedNodeId: newId,
        })
      },

      insertNodeBetween: (sourceId, targetId, edgeId, sourceHandle, targetHandle) => {
        const { nodes, edges } = get()
        const source = nodes.find((n) => n.id === sourceId)
        const target = nodes.find((n) => n.id === targetId)
        if (!source || !target) return

        const newId = generateId()
        const colorIndex = nodes.length % COLORS.length
        const nodeColor = get().defaultNodeColor ?? COLORS[colorIndex]

        // ターゲットとその子孫をH_STEP分右にシフトしてスペースを確保
        const getDescendants = (nodeId: string): string[] => {
          const children = edges.filter((e) => e.source === nodeId).map((e) => e.target)
          return [nodeId, ...children.flatMap(getDescendants)]
        }
        const toShift = new Set(getDescendants(targetId))

        const newNode: Node<MindmapNodeData> = {
          id: newId,
          type: 'mindmapNode',
          position: {
            x: target.position.x,
            y: target.position.y,
          },
          data: {
            label: 'アイデア',
            color: nodeColor,
            depth: (source.data.depth ?? 0) + 1,
          },
        }

        const shiftedNodes = nodes.map((n) =>
          toShift.has(n.id)
            ? { ...n, position: { ...n.position, x: n.position.x + NODE_W + PADDING } }
            : n
        )

        const edgeStyle = { stroke: '#7c3aed', strokeWidth: 2, opacity: 0.7 }
        const newEdges: Edge[] = [
          {
            id: `edge-${sourceId}-${newId}`,
            source: sourceId,
            target: newId,
            sourceHandle,
            targetHandle: 'left',
            type: 'interactive',
            style: edgeStyle,
          },
          {
            id: `edge-${newId}-${targetId}`,
            source: newId,
            target: targetId,
            sourceHandle: 'right',
            targetHandle,
            type: 'interactive',
            style: edgeStyle,
          },
        ]

        set({
          nodes: [...shiftedNodes, newNode],
          edges: [...edges.filter((e) => e.id !== edgeId), ...newEdges],
          selectedNodeId: newId,
          editingNodeId: newId,
        })
      },

      tidyLayout: () => {
        const { nodes, edges } = get()
        const isMobile = window.innerWidth < 768

        const DEFAULT_W = isMobile ? 130 : 180
        const DEFAULT_H = isMobile ? 44 : 60
        const V_GAP = isMobile ? 20 : 30   // ノード間の縦の隙間
        const H_GAP = isMobile ? 24 : 48   // 親右端〜子左端の横の隙間

        // 実際のサイズを取得（リサイズ済みならそのサイズ、未設定はデフォルト）
        const nodeSize = (id: string) => {
          const n = nodes.find((nd) => nd.id === id)
          return {
            w: n?.width ?? n?.measured?.width ?? DEFAULT_W,
            h: n?.height ?? n?.measured?.height ?? DEFAULT_H,
          }
        }

        const childrenOf = (id: string) =>
          edges.filter((e) => e.source === id).map((e) => e.target as string)

        // サブツリーが占める縦幅（ノード自身 or 子の合計、大きい方）
        const subtreeHeight = (id: string): number => {
          const children = childrenOf(id)
          const { h } = nodeSize(id)
          if (children.length === 0) return h
          const childTotal = children.reduce((s, c) => s + subtreeHeight(c), 0) + (children.length - 1) * V_GAP
          return Math.max(h, childTotal)
        }

        const positions: Record<string, { x: number; y: number }> = {}

        // centerY: このサブツリーの中心Y、x: このノードの左端X
        const layout = (id: string, centerY: number, x: number) => {
          const { w, h } = nodeSize(id)
          positions[id] = { x, y: centerY - h / 2 }   // top-left基準
          const children = childrenOf(id)
          const totalH = children.reduce((s, c) => s + subtreeHeight(c), 0) + (children.length - 1) * V_GAP
          let curY = centerY - totalH / 2
          for (const c of children) {
            const ch = subtreeHeight(c)
            layout(c, curY + ch / 2, x + w + H_GAP)
            curY += ch + V_GAP
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

        set({ nodes: repositioned, edges: normalizedEdges, layoutSnapshot: nodes })
      },

      toggleLayout: () => {
        const { nodes, layoutSnapshot } = get()
        if (!layoutSnapshot) return
        const restored = nodes.map((n) => {
          const saved = layoutSnapshot.find((s) => s.id === n.id)
          return saved ? { ...n, position: saved.position } : n
        })
        set({ nodes: restored, layoutSnapshot: nodes })
      },

      tidySelectedLayout: () => {
        const { nodes, edges } = get()
        const selectedNodes = nodes.filter((n) => n.selected)
        if (selectedNodes.length <= 1) return

        const selectedIds = new Set(selectedNodes.map((n) => n.id))
        const selectedEdges = edges.filter(
          (e) => selectedIds.has(e.source) && selectedIds.has(e.target)
        )

        // 選択内に親を持たないノードをサブルートとする
        const hasParentInSelection = new Set(selectedEdges.map((e) => e.target))
        const subRoots = selectedNodes.filter((n) => !hasParentInSelection.has(n.id))

        const isMobile = window.innerWidth < 768
        const DEFAULT_W_S = isMobile ? 130 : 180
        const DEFAULT_H_S = isMobile ? 44 : 60
        const V_GAP_S = isMobile ? 20 : 30
        const H_GAP_S = isMobile ? 24 : 48

        const nodeSize = (id: string) => {
          const n = nodes.find((nd) => nd.id === id)
          return {
            w: n?.width ?? n?.measured?.width ?? DEFAULT_W_S,
            h: n?.height ?? n?.measured?.height ?? DEFAULT_H_S,
          }
        }

        const childrenOf = (id: string) =>
          selectedEdges.filter((e) => e.source === id).map((e) => e.target)

        const subtreeHeight = (id: string): number => {
          const children = childrenOf(id)
          const { h } = nodeSize(id)
          if (children.length === 0) return h
          const childTotal = children.reduce((s, c) => s + subtreeHeight(c), 0) + (children.length - 1) * V_GAP_S
          return Math.max(h, childTotal)
        }

        const positions: Record<string, { x: number; y: number }> = {}

        const layout = (id: string, centerY: number, x: number) => {
          const { w, h } = nodeSize(id)
          positions[id] = { x, y: centerY - h / 2 }
          const children = childrenOf(id)
          const totalH = children.reduce((s, c) => s + subtreeHeight(c), 0) + (children.length - 1) * V_GAP_S
          let curY = centerY - totalH / 2
          for (const c of children) {
            const ch = subtreeHeight(c)
            layout(c, curY + ch / 2, x + w + H_GAP_S)
            curY += ch + V_GAP_S
          }
        }

        for (const subRoot of subRoots) {
          const { h } = nodeSize(subRoot.id)
          layout(subRoot.id, subRoot.position.y + h / 2, subRoot.position.x)
        }

        set({
          nodes: nodes.map((n) => (positions[n.id] ? { ...n, position: positions[n.id] } : n)),
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

      updateNodeMemo: (id, memo) => {
        set({
          nodes: get().nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, memo } } : n
          ),
        })
      },

      updateNodeBorderWidth: (id, borderWidth) => {
        set({
          nodes: get().nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, borderWidth } } : n
          ),
        })
      },

      updateNodeSizeScale: (id, sizeScale) => {
        set({
          nodes: get().nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, sizeScale } } : n
          ),
        })
      },

      deleteNode: (id) => {
        if (id === 'root') return
        const { nodes, edges } = get()

        const parentEdge = edges.find((e) => e.target === id)
        const childEdges = edges.filter((e) => e.source === id)

        // 親と子の両方がある場合：再接続して子を左にシフト
        if (parentEdge && childEdges.length > 0) {
          const getDescendants = (nodeId: string): string[] => {
            const children = edges.filter((e) => e.source === nodeId).map((e) => e.target)
            return [nodeId, ...children.flatMap(getDescendants)]
          }
          const toShift = new Set(childEdges.flatMap((e) => getDescendants(e.target)))

          const reconnected = childEdges.map((childEdge) => ({
            ...childEdge,
            id: `edge-${parentEdge.source}-${childEdge.target}`,
            source: parentEdge.source,
            sourceHandle: parentEdge.sourceHandle ?? 'right',
          }))

          set({
            nodes: nodes
              .filter((n) => n.id !== id)
              .map((n) =>
                toShift.has(n.id)
                  ? { ...n, position: { ...n.position, x: n.position.x - (NODE_W + PADDING) } }
                  : n
              ),
            edges: [
              ...edges.filter((e) => e.source !== id && e.target !== id),
              ...reconnected,
            ],
            selectedNodeId: null,
          })
          return
        }

        set({
          nodes: nodes.filter((n) => n.id !== id),
          edges: edges.filter((e) => e.source !== id && e.target !== id),
          selectedNodeId: null,
        })
      },

      setSelectedNodeId: (id) => set({ selectedNodeId: id }),

      setEditingNodeId: (id) => set({ editingNodeId: id }),

      setDefaultNodeColor: (color) => set({ defaultNodeColor: color }),
      setIsSaving: (v) => set({ isSaving: v }),

      resetMindmap: () => {
        const fresh = makeInitialNodes()
        set({ nodes: fresh, edges: [], selectedNodeId: null })
      },

      openTemplateModal: (mode) => set({ templateModalOpen: true, templateModalMode: mode }),
      closeTemplateModal: () => set({ templateModalOpen: false }),

      setCurrentSheetMapType: (mapType) => {
        const { sheets, currentSheetId, nodes } = get()
        set({
          sheets: sheets.map((s) => s.id === currentSheetId ? { ...s, mapType } : s),
          templateModalOpen: false,
          selectedNodeId: nodes[0]?.id ?? null,
        })
      },

      addSheet: (mapType) => {
        const { sheets, currentSheetId, nodes, edges } = get()
        const updatedSheets = sheets.map((s) =>
          s.id === currentSheetId ? { ...s, nodes, edges } : s
        )
        const initialNodes = makeInitialNodes()
        const newSheet: Sheet = {
          id: generateSheetId(),
          name: `シート${updatedSheets.length + 1}`,
          mapType,
          nodes: initialNodes,
          edges: [],
        }
        set({
          sheets: [...updatedSheets, newSheet],
          currentSheetId: newSheet.id,
          nodes: newSheet.nodes,
          edges: newSheet.edges,
          selectedNodeId: initialNodes[0]?.id ?? null,
          templateModalOpen: false,
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
          ...(!target.mapType ? { templateModalOpen: true, templateModalMode: 'init' as const } : {}),
        })
      },

      loadSheets: (sheets) => {
        if (sheets.length === 0) return
        const first = sheets[0]
        // すでにユーザーがテンプレートを選択済み（モーダルが閉じられている）場合は再表示しない
        const alreadyClosed = !get().templateModalOpen
        set({
          sheets,
          currentSheetId: first.id,
          nodes: first.nodes,
          edges: first.edges,
          selectedNodeId: null,
          ...(!first.mapType && !alreadyClosed
            ? { templateModalOpen: true, templateModalMode: 'init' as const }
            : first.mapType
              ? { templateModalOpen: false }
              : {}),
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
        defaultNodeColor: state.defaultNodeColor,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const current = state.sheets.find((s) => s.id === state.currentSheetId)
        if (current) {
          state.nodes = current.nodes
          state.edges = current.edges
          if (!current.mapType) {
            state.templateModalOpen = true
            state.templateModalMode = 'init'
          }
        }
      },
    }
  )
)
