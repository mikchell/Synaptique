import { motion, AnimatePresence } from 'framer-motion'
import { type NodeColor, useMindmapStore } from '../store/mindmapStore'

const COLORS: { key: NodeColor; label: string; hex: string }[] = [
  { key: 'purple', label: 'パープル', hex: '#7c3aed' },
  { key: 'blue', label: 'ブルー', hex: '#2563eb' },
  { key: 'cyan', label: 'シアン', hex: '#0891b2' },
  { key: 'green', label: 'グリーン', hex: '#16a34a' },
  { key: 'pink', label: 'ピンク', hex: '#db2777' },
  { key: 'orange', label: 'オレンジ', hex: '#ea580c' },
]

export function NodePanel() {
  const { nodes, selectedNodeId, updateNodeColor } = useMindmapStore()
  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  return (
    <AnimatePresence>
      {selectedNode && (
        <motion.div
          key="node-panel"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{
            position: 'fixed',
            right: 24,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: 18,
            padding: '20px 16px',
            width: 160,
            backdropFilter: 'blur(20px)',
            zIndex: 100,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}
        >
          <p
            style={{
              color: '#94a3b8',
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: '0 0 14px',
            }}
          >
            ノードカラー
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 8,
            }}
          >
            {COLORS.map((c) => (
              <button
                key={c.key}
                onClick={() => updateNodeColor(selectedNode.id, c.key)}
                title={c.label}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: c.hex,
                  border:
                    selectedNode.data.color === c.key
                      ? '2.5px solid white'
                      : '2px solid transparent',
                  cursor: 'pointer',
                  boxShadow:
                    selectedNode.data.color === c.key
                      ? `0 0 12px ${c.hex}`
                      : 'none',
                  transition: 'all 0.15s ease',
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
