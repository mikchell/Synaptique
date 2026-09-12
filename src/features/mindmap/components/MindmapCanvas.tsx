import {
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  useReactFlow,
} from '@xyflow/react'
import { useCallback, useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useMindmapStore } from '../store/mindmapStore'
import { useAuth } from '../../auth/useAuth'
import { useSheetsSync } from '../hooks/useSheetsSync'
import { useIsMobile } from '../../../hooks/useIsMobile'
import { Header } from './Header'
import { MindmapNode } from './MindmapNode'
import { InteractiveEdge } from './InteractiveEdge'
import { NodePanel } from './NodePanel'
import { Toolbar } from './Toolbar'
import { HelpHint } from './HelpHint'
import { SheetTabs } from './SheetTabs'
import { TemplateSelectModal } from './TemplateSelectModal'

const nodeTypes = { mindmapNode: MindmapNode }
const edgeTypes = { interactive: InteractiveEdge, default: InteractiveEdge }

const MINIMAP_COLOR_MAP: Record<string, string> = {
  purple: '#7c3aed',
  blue: '#2563eb',
  cyan: '#0891b2',
  green: '#16a34a',
  pink: '#db2777',
  orange: '#ea580c',
}
const getMinimapNodeColor = (node: { data: unknown }) =>
  MINIMAP_COLOR_MAP[(node.data as { color: string }).color] ?? '#7c3aed'

function MindmapFlow() {
  const { user } = useAuth()
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setSelectedNodeId, editingNodeId } =
    useMindmapStore(
      useShallow((s) => ({
        nodes: s.nodes,
        edges: s.edges,
        onNodesChange: s.onNodesChange,
        onEdgesChange: s.onEdgesChange,
        onConnect: s.onConnect,
        setSelectedNodeId: s.setSelectedNodeId,
        editingNodeId: s.editingNodeId,
      }))
    )
  const { setCenter, getZoom, setViewport, getViewport } = useReactFlow()
  const isMobile = useIsMobile()
  const containerRef = useRef<HTMLDivElement>(null)
  const twoFingerRef = useRef<{ midX: number; midY: number; vx: number; vy: number } | null>(null)

  useSheetsSync(user ?? null)

  const handlePaneClick = useCallback(() => setSelectedNodeId(null), [setSelectedNodeId])

  useEffect(() => {
    if (!editingNodeId) return
    const node = nodes.find((n) => n.id === editingNodeId)
    if (!node) return
    setCenter(node.position.x, node.position.y, { zoom: getZoom(), duration: 300 })
  }, [editingNodeId, nodes, setCenter, getZoom])

  // モバイル：2本指ドラッグでパン
  useEffect(() => {
    if (!isMobile) return
    const el = containerRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) { twoFingerRef.current = null; return }
      // 選択中ノード上でのタッチはリサイズ操作なのでパン不可
      const target = e.target as Element
      if (target.closest('.react-flow__node.selected')) { twoFingerRef.current = null; return }
      const { x, y } = getViewport()
      twoFingerRef.current = {
        midX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        midY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        vx: x, vy: y,
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !twoFingerRef.current) return
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2
      const dx = midX - twoFingerRef.current.midX
      const dy = midY - twoFingerRef.current.midY
      setViewport({ x: twoFingerRef.current.vx + dx, y: twoFingerRef.current.vy + dy, zoom: getViewport().zoom })
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) twoFingerRef.current = null
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [isMobile, getViewport, setViewport])

  return (
    <div ref={containerRef} style={{ width: '100vw', height: '100vh', paddingTop: 56, paddingBottom: 40 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={2}
        selectionOnDrag={!isMobile}
        selectionMode={SelectionMode.Partial}
        panOnDrag={isMobile ? true : [1, 2]}
        panOnScroll={!isMobile}
        panOnScrollSpeed={0.5}
        defaultEdgeOptions={{
          type: 'interactive',
          style: { stroke: '#7c3aed', strokeWidth: 2, opacity: 0.6 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="rgba(148, 163, 184, 0.6)"
        />
        {!isMobile && (
          <MiniMap
            nodeColor={getMinimapNodeColor}
            maskColor="rgba(124,58,237,0.06)"
            style={{ bottom: 32, right: 32 }}
          />
        )}
      </ReactFlow>
      <Header />
      <Toolbar />
      <NodePanel />
      <HelpHint />
      <SheetTabs />
      <TemplateSelectModal />
    </div>
  )
}

export function MindmapCanvas() {
  return (
    <ReactFlowProvider>
      <MindmapFlow />
    </ReactFlowProvider>
  )
}
