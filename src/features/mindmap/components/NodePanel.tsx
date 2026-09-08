import { motion, AnimatePresence } from 'framer-motion'
import { GripVertical, Pin, PinOff } from 'lucide-react'
import { type NodeColor, useMindmapStore } from '../store/mindmapStore'
import { useRef } from 'react'

const COLORS: { key: NodeColor; label: string; hex: string; border: string }[] = [
  { key: 'purple', label: 'パープル', hex: '#f3e8ff', border: 'rgba(139,92,246,0.5)' },
  { key: 'blue',   label: 'ブルー',   hex: '#dbeafe', border: 'rgba(59,130,246,0.5)' },
  { key: 'cyan',   label: 'シアン',   hex: '#cffafe', border: 'rgba(6,182,212,0.5)' },
  { key: 'green',  label: 'グリーン', hex: '#dcfce7', border: 'rgba(34,197,94,0.5)' },
  { key: 'pink',   label: 'ピンク',   hex: '#fce7f3', border: 'rgba(236,72,153,0.5)' },
  { key: 'orange', label: 'オレンジ', hex: '#ffedd5', border: 'rgba(249,115,22,0.5)' },
]

export function NodePanel() {
  const selectedNodeId = useMindmapStore((s) => s.selectedNodeId)
  const selectedNode = useMindmapStore((s) =>
    s.selectedNodeId ? s.nodes.find((n) => n.id === s.selectedNodeId) ?? null : null
  )
  const selectedNodeColor = selectedNode?.data.color ?? null
  const selectedNodeMemo = selectedNode?.data.memo ?? ''
  const updateNodeColor = useMindmapStore((s) => s.updateNodeColor)
  const updateNodeMemo = useMindmapStore((s) => s.updateNodeMemo)
  const defaultNodeColor = useMindmapStore((s) => s.defaultNodeColor)
  const setDefaultNodeColor = useMindmapStore((s) => s.setDefaultNodeColor)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  return (
    <AnimatePresence>
      {selectedNodeId && (
        <motion.div
          key="node-panel"
          drag
          dragMomentum={false}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{
            position: 'fixed',
            right: 24,
            top: 'calc(50vh - 80px)',
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginBottom: 14,
              cursor: 'grab',
            }}
          >
            <GripVertical size={13} color="#cbd5e1" />
            <p
              style={{
                color: '#94a3b8',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: 0,
                flex: 1,
              }}
            >
              ノードカラー
            </p>
          </div>

          {/* 選択ノードのカラー変更 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {COLORS.map((c) => (
              <button
                key={c.key}
                onClick={() => updateNodeColor(selectedNodeId, c.key)}
                title={c.label}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: c.hex,
                  border: selectedNodeColor === c.key
                    ? `2.5px solid ${c.border.replace('0.5)', '1)')}`
                    : `1.5px solid ${c.border}`,
                  cursor: 'pointer',
                  boxShadow: selectedNodeColor === c.key
                    ? `0 0 0 3px ${c.border}`
                    : 'none',
                  transition: 'all 0.15s ease',
                }}
              />
            ))}
          </div>

          {/* メモ */}
          <div style={{ marginTop: 16, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 14 }}>
            <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
              メモ
            </p>
            <textarea
              value={selectedNodeMemo}
              onChange={(e) => {
                const memo = e.target.value
                if (!selectedNodeId) return
                if (debounceRef.current) clearTimeout(debounceRef.current)
                debounceRef.current = setTimeout(() => {
                  updateNodeMemo(selectedNodeId, memo)
                }, 300)
                // 即時反映のためにstoreを直接更新
                updateNodeMemo(selectedNodeId, memo)
              }}
              placeholder="メモを入力..."
              rows={4}
              style={{
                width: '100%',
                resize: 'vertical',
                borderRadius: 10,
                border: '1.5px solid rgba(0,0,0,0.08)',
                padding: '8px 10px',
                fontSize: 12,
                color: '#334155',
                background: 'rgba(248,250,252,0.8)',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(139,92,246,0.5)' }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.08)' }}
            />
          </div>

          {/* デフォルトカラー固定 */}
          <div style={{ marginTop: 16, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                固定カラー
              </p>
              {defaultNodeColor && (
                <button
                  onClick={() => setDefaultNodeColor(null)}
                  title="固定を解除"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#94a3b8', display: 'flex' }}
                >
                  <PinOff size={13} />
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {COLORS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setDefaultNodeColor(defaultNodeColor === c.key ? null : c.key)}
                  title={`新規ノードを${c.label}に固定`}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: c.hex,
                    border: defaultNodeColor === c.key
                      ? `2.5px solid ${c.border.replace('0.5)', '1)')}`
                      : `1.5px solid ${c.border}`,
                    cursor: 'pointer',
                    boxShadow: defaultNodeColor === c.key
                      ? `0 0 0 3px ${c.border}`
                      : 'none',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                  }}
                >
                  {defaultNodeColor === c.key && (
                    <Pin size={10} style={{ position: 'absolute', top: 2, right: 2, color: c.border.replace('0.5)', '1)') }} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
