import {
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  useReactFlow,
} from '@xyflow/react'
import { useEffect } from 'react'
import { useMindmapStore } from '../store/mindmapStore'
import { Header } from './Header'
import { MindmapNode } from './MindmapNode'
import { InteractiveEdge } from './InteractiveEdge'
import { NodePanel } from './NodePanel'
import { Toolbar } from './Toolbar'
import { HelpHint } from './HelpHint'
import { SheetTabs } from './SheetTabs'

const nodeTypes = { mindmapNode: MindmapNode }
const edgeTypes = { interactive: InteractiveEdge, default: InteractiveEdge }

function MindmapFlow() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setSelectedNodeId, editingNodeId } =
    useMindmapStore()
  const { setCenter, getZoom } = useReactFlow()

  useEffect(() => {
    if (!editingNodeId) return
    const node = nodes.find((n) => n.id === editingNodeId)
    if (!node) return
    setCenter(node.position.x, node.position.y, { zoom: getZoom(), duration: 300 })
  }, [editingNodeId])

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
        onPaneClick={() => setSelectedNodeId(null)}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={2}
        selectionOnDrag
        selectionMode={SelectionMode.Partial}
        panOnDrag={[1, 2]}
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
        <MiniMap
          nodeColor={(node) => {
            const colorMap: Record<string, string> = {
              purple: '#7c3aed',
              blue: '#2563eb',
              cyan: '#0891b2',
              green: '#16a34a',
              pink: '#db2777',
              orange: '#ea580c',
            }
            return colorMap[(node.data as { color: string }).color] ?? '#7c3aed'
          }}
          maskColor="rgba(124,58,237,0.06)"
          style={{ bottom: 32, right: 32 }}
        />
      </ReactFlow>
      <Header />
      <Toolbar />
      <NodePanel />
      <HelpHint />
      <SheetTabs />
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
