import {
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
} from '@xyflow/react'
import { useMindmapStore } from '../store/mindmapStore'
import { Header } from './Header'
import { MindmapNode } from './MindmapNode'
import { NodePanel } from './NodePanel'
import { Toolbar } from './Toolbar'
import { HelpHint } from './HelpHint'
import { SheetTabs } from './SheetTabs'

const nodeTypes = { mindmapNode: MindmapNode }

function MindmapFlow() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setSelectedNodeId } =
    useMindmapStore()

  return (
    <div style={{ width: '100vw', height: '100vh', paddingTop: 56, paddingBottom: 40 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={() => setSelectedNodeId(null)}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={2}
        selectionOnDrag
        selectionMode={SelectionMode.Partial}
        panOnDrag={[1, 2]}
        defaultEdgeOptions={{
          type: 'default',
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
