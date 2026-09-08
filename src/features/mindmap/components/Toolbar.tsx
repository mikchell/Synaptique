import { motion } from 'framer-motion'
import { Maximize2, RotateCcw, ZoomIn, ZoomOut, LayoutDashboard, LayoutGrid } from 'lucide-react'
import { useReactFlow } from '@xyflow/react'
import { useState } from 'react'
import { useMindmapStore } from '../store/mindmapStore'
import { ConfirmDialog } from './ConfirmDialog'

export function Toolbar() {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const { nodes, resetMindmap, tidyLayout, tidySelectedLayout } = useMindmapStore()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [tidyConfirmOpen, setTidyConfirmOpen] = useState(false)
  const [tidySelConfirmOpen, setTidySelConfirmOpen] = useState(false)

  const selectedCount = nodes.filter((n) => n.selected).length

  const handleTidyConfirm = () => {
    tidyLayout()
    setTidyConfirmOpen(false)
    setTimeout(() => fitView({ padding: 0.3, duration: 500 }), 50)
  }

  const handleTidySelConfirm = () => {
    tidySelectedLayout()
    setTidySelConfirmOpen(false)
  }

  const handleReset = () => {
    resetMindmap()
    setConfirmOpen(false)
  }

  const buttonStyle = {
    background: 'rgba(255,255,255,0.9)',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: 10,
    color: '#64748b',
    cursor: 'pointer',
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  }

  return (
    <>
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      style={{
        position: 'fixed',
        bottom: 32,
        left: 32,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 100,
      }}
    >
      {/* ズームコントロール */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.92)',
          border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: 14,
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          backdropFilter: 'blur(16px)',
        }}
      >
        <button
          style={buttonStyle}
          onClick={() => zoomIn()}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'rgba(124, 58, 237, 0.2)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#a78bfa'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor =
              'rgba(124, 58, 237, 0.4)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'rgba(255,255,255,0.9)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#64748b'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor =
              'rgba(0,0,0,0.1)'
          }}
          title="ズームイン"
        >
          <ZoomIn size={16} />
        </button>
        <button
          style={buttonStyle}
          onClick={() => zoomOut()}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'rgba(124, 58, 237, 0.2)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#a78bfa'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor =
              'rgba(124, 58, 237, 0.4)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'rgba(255,255,255,0.9)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#64748b'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor =
              'rgba(0,0,0,0.1)'
          }}
          title="ズームアウト"
        >
          <ZoomOut size={16} />
        </button>
        <button
          style={buttonStyle}
          onClick={() => fitView({ padding: 0.2, duration: 500 })}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'rgba(124, 58, 237, 0.2)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#a78bfa'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor =
              'rgba(124, 58, 237, 0.4)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'rgba(255,255,255,0.9)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#64748b'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor =
              'rgba(0,0,0,0.1)'
          }}
          title="全体表示"
        >
          <Maximize2 size={16} />
        </button>
        <button
          style={buttonStyle}
          onClick={() => setTidyConfirmOpen(true)}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'rgba(124, 58, 237, 0.2)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#a78bfa'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor =
              'rgba(124, 58, 237, 0.4)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'rgba(255,255,255,0.9)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#64748b'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor =
              'rgba(0,0,0,0.1)'
          }}
          title="整頓"
        >
          <LayoutDashboard size={16} />
        </button>
        {selectedCount >= 2 && (
          <button
            style={buttonStyle}
            onClick={() => setTidySelConfirmOpen(true)}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background =
                'rgba(124, 58, 237, 0.2)'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#a78bfa'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                'rgba(124, 58, 237, 0.4)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background =
                'rgba(255,255,255,0.9)'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#64748b'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                'rgba(0,0,0,0.1)'
            }}
            title={`選択範囲を整頓 (${selectedCount}個)`}
          >
            <LayoutGrid size={16} />
          </button>
        )}
      </div>

      {/* リセット */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.92)',
          border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: 14,
          padding: 8,
          backdropFilter: 'blur(16px)',
        }}
      >
        <button
          style={buttonStyle}
          onClick={() => setConfirmOpen(true)}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'rgba(239, 68, 68, 0.15)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#f87171'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor =
              'rgba(239, 68, 68, 0.4)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'rgba(255,255,255,0.9)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#64748b'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor =
              'rgba(0,0,0,0.1)'
          }}
          title="リセット"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </motion.div>

    <ConfirmDialog
      open={tidySelConfirmOpen}
      title="選択範囲を整頓"
      description={`選択中の${selectedCount}個のノードのみ整列されます。`}
      confirmLabel="整頓する"
      onConfirm={handleTidySelConfirm}
      onCancel={() => setTidySelConfirmOpen(false)}
    />
    <ConfirmDialog
      open={tidyConfirmOpen}
      title="レイアウトを整頓"
      description="ノードの位置が自動で整列されます。手動で調整した配置はリセットされます。"
      confirmLabel="整頓する"
      onConfirm={handleTidyConfirm}
      onCancel={() => setTidyConfirmOpen(false)}
    />
    <ConfirmDialog
      open={confirmOpen}
      title="マインドマップをリセット"
      description="すべてのノードが削除され、最初の状態に戻ります。この操作は取り消せません。"
      confirmLabel="リセット"
      onConfirm={handleReset}
      onCancel={() => setConfirmOpen(false)}
    />
    </>
  )
}
