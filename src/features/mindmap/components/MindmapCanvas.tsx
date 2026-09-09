import {
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  useReactFlow,
} from '@xyflow/react'
import { useCallback, useEffect } from 'react'
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
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setSelectedNodeId, editingNodeId, currentSheetId, openTemplateModal } =
    useMindmapStore(
      useShallow((s) => ({
        nodes: s.nodes,
        edges: s.edges,
        onNodesChange: s.onNodesChange,
        onEdgesChange: s.onEdgesChange,
        onConnect: s.onConnect,
        setSelectedNodeId: s.setSelectedNodeId,
        editingNodeId: s.editingNodeId,
        currentSheetId: s.currentSheetId,
        openTemplateModal: s.openTemplateModal,
      }))
    )
  const { setCenter, getZoom } = useReactFlow()
  const isMobile = useIsMobile()

  useSheetsSync(user ?? null)

  // 現在のシートにmapTypeが未設定なら初回テンプレート選択を促す
  // sheets を依存配列に含めると openTemplateModal のストア更新で無限ループになるため
  // currentSheetId が変わったタイミングでストアから直接読む
  useEffect(() => {
    const { sheets: s } = useMindmapStore.getState()
    const currentSheet = s.find((sh) => sh.id === currentSheetId)
    if (currentSheet && !currentSheet.mapType) {
      openTemplateModal('init')
    }
  }, [currentSheetId, openTemplateModal])

  const handlePaneClick = useCallback(() => setSelectedNodeId(null), [setSelectedNodeId])

  useEffect(() => {
    if (!editingNodeId) return
    const node = nodes.find((n) => n.id === editingNodeId)
    if (!node) return
    setCenter(node.position.x, node.position.y, { zoom: getZoom(), duration: 300 })
  }, [editingNodeId, nodes, setCenter, getZoom])

  return (
    <div style={{ width: '100vw', height: '100vh', paddingTop: 56, paddingBottom: 40 }}>
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
