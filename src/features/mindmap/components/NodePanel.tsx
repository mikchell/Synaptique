import { motion, AnimatePresence } from 'framer-motion'
import { type NodeColor, useMindmapStore } from '../store/mindmapStore'

const COLORS: { key: NodeColor; label: string; hex: string; border: string }[] = [
  { key: 'purple', label: 'パープル', hex: '#f3e8ff', border: 'rgba(139,92,246,0.5)' },
  { key: 'blue',   label: 'ブルー',   hex: '#dbeafe', border: 'rgba(59,130,246,0.5)' },
  { key: 'cyan',   label: 'シアン',   hex: '#cffafe', border: 'rgba(6,182,212,0.5)' },
  { key: 'green',  label: 'グリーン', hex: '#dcfce7', border: 'rgba(34,197,94,0.5)' },
  { key: 'pink',   label: 'ピンク',   hex: '#fce7f3', border: 'rgba(236,72,153,0.5)' },
  { key: 'orange', label: 'オレンジ', hex: '#ffedd5', border: 'rgba(249,115,22,0.5)' },
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
                  border: selectedNode.data.color === c.key
                    ? `2.5px solid ${c.border.replace('0.5)', '1)')}`
                    : `1.5px solid ${c.border}`,
                  cursor: 'pointer',
                  boxShadow: selectedNode.data.color === c.key
                    ? `0 0 0 3px ${c.border}`
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
