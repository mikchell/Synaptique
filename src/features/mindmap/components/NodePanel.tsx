import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { AlignJustify, GripVertical, Pin, PinOff } from 'lucide-react'
import { useRef, useState } from 'react'
import { useIsMobile } from '../../../hooks/useIsMobile'
import { type NodeColor, useMindmapStore } from '../store/mindmapStore'

// sizeScale (0.5〜3.0) ↔ スライダー内部値 (0〜2) の変換
// 内部値1がsizeScale=1.0（100%）の中央になる非線形マッピング
const scaleToSlider = (scale: number) =>
  scale <= 1 ? (scale - 0.5) * 2 : 1 + (scale - 1) / 2

const sliderToScale = (v: number) =>
  v <= 1 ? 0.5 + v * 0.5 : 1 + (v - 1) * 2

// スライダートラック上の位置(%)を返す
const markerPos = (scale: number) => scaleToSlider(scale) / 2 * 100

const SIZE_MARKERS = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0]

const COLORS: { key: NodeColor; label: string; hex: string; border: string }[] = [
  { key: 'purple', label: 'パープル', hex: '#f3e8ff', border: 'rgba(139,92,246,0.5)' },
  { key: 'blue',   label: 'ブルー',   hex: '#dbeafe', border: 'rgba(59,130,246,0.5)' },
  { key: 'cyan',   label: 'シアン',   hex: '#cffafe', border: 'rgba(6,182,212,0.5)' },
  { key: 'green',  label: 'グリーン', hex: '#dcfce7', border: 'rgba(34,197,94,0.5)' },
  { key: 'pink',   label: 'ピンク',   hex: '#fce7f3', border: 'rgba(236,72,153,0.5)' },
  { key: 'orange', label: 'オレンジ', hex: '#ffedd5', border: 'rgba(249,115,22,0.5)' },
]

export function NodePanel() {
  const isMobile = useIsMobile()
  const selectedNodeId = useMindmapStore((s) => s.selectedNodeId)
  const selectedNode = useMindmapStore((s) =>
    s.selectedNodeId ? s.nodes.find((n) => n.id === s.selectedNodeId) ?? null : null
  )
  const selectedNodeColor = selectedNode?.data.color ?? null
  const selectedNodeMemo = selectedNode?.data.memo ?? ''
  const selectedNodeBorderWidth = selectedNode?.data.borderWidth ?? null
  const selectedNodeSizeScale = selectedNode?.data.sizeScale ?? 1
  const updateNodeColor = useMindmapStore((s) => s.updateNodeColor)
  const updateNodeMemo = useMindmapStore((s) => s.updateNodeMemo)
  const updateNodeBorderWidth = useMindmapStore((s) => s.updateNodeBorderWidth)
  const updateNodeSizeScale = useMindmapStore((s) => s.updateNodeSizeScale)
  const defaultNodeColor = useMindmapStore((s) => s.defaultNodeColor)
  const setDefaultNodeColor = useMindmapStore((s) => s.setDefaultNodeColor)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [colorExpanded, setColorExpanded] = useState(true)

  // デスクトップ用 framer-motion ドラッグ
  const dragControls = useDragControls()

  // モバイル用タッチドラッグ（framer-motion の drag を使わず、ノードドラッグと干渉しない）
  const panelRef = useRef<HTMLDivElement>(null)
  const [mobilePos, setMobilePos] = useState<{ x: number; y: number } | null>(null)
  const touchOrigin = useRef<{ touchX: number; touchY: number; panelX: number; panelY: number } | null>(null)

  const onGripTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    const touch = e.touches[0]
    const rect = panelRef.current?.getBoundingClientRect()
    if (!rect) return
    touchOrigin.current = { touchX: touch.clientX, touchY: touch.clientY, panelX: rect.left, panelY: rect.top }
  }

  const onGripTouchMove = (e: React.TouchEvent) => {
    if (!touchOrigin.current || e.touches.length !== 1) return
    const touch = e.touches[0]
    setMobilePos({
      x: touchOrigin.current.panelX + (touch.clientX - touchOrigin.current.touchX),
      y: touchOrigin.current.panelY + (touch.clientY - touchOrigin.current.touchY),
    })
  }

  const onGripTouchEnd = () => { touchOrigin.current = null }

  const mobileStyle = mobilePos
    ? { left: mobilePos.x, top: mobilePos.y, right: 'auto' }
    : { right: 24, top: 'calc(50vh - 80px)' }

  return (
    <AnimatePresence>
      {selectedNodeId && (
        <motion.div
          ref={panelRef}
          key="node-panel"
          // モバイルでは framer-motion の drag を無効化してノードドラッグと干渉させない
          drag={!isMobile}
          dragControls={isMobile ? undefined : dragControls}
          dragListener={false}
          dragMomentum={false}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{
            position: 'fixed',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: 18,
            padding: '20px 16px',
            width: 160,
            backdropFilter: 'blur(20px)',
            zIndex: 100,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            ...(isMobile ? mobileStyle : { right: 24, top: 'calc(50vh - 80px)' }),
          }}
        >
          {/* ヘッダー（展開時のみ表示） */}
          {colorExpanded && (
            <div
              onPointerDown={!isMobile ? (e) => dragControls.start(e) : undefined}
              onTouchStart={isMobile ? onGripTouchStart : undefined}
              onTouchMove={isMobile ? onGripTouchMove : undefined}
              onTouchEnd={isMobile ? onGripTouchEnd : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, marginBottom: 14,
                cursor: 'grab', touchAction: 'none',
              }}
            >
              <GripVertical size={13} color="#cbd5e1" />
              <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, flex: 1 }}>
                ノードカラー
              </p>
              <button
                onClick={() => setColorExpanded(false)}
                title="カラー選択を隠す"
                style={{
                  background: 'rgba(124,58,237,0.1)', border: 'none', borderRadius: 6,
                  cursor: 'pointer', padding: '4px 6px', display: 'flex',
                  color: '#7c3aed', transition: 'all 0.15s ease',
                }}
              >
                <AlignJustify size={15} />
              </button>
            </div>
          )}

          {/* カラー選択（折りたたみ可能） */}
          <AnimatePresence initial={false}>
            {colorExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                {/* 選択ノードのカラー変更 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {COLORS.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => updateNodeColor(selectedNodeId, c.key)}
                      title={c.label}
                      style={{
                        width: 36, height: 36, borderRadius: 10, background: c.hex,
                        border: selectedNodeColor === c.key
                          ? `2.5px solid ${c.border.replace('0.5)', '1)')}`
                          : `1.5px solid ${c.border}`,
                        cursor: 'pointer',
                        boxShadow: selectedNodeColor === c.key ? `0 0 0 3px ${c.border}` : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    />
                  ))}
                </div>

                {/* ノードの大きさ */}
                <div style={{ marginTop: 16, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                      大きさ
                    </p>
                    <span style={{ fontSize: 11, color: SIZE_MARKERS.includes(selectedNodeSizeScale) ? '#7c3aed' : '#94a3b8', fontWeight: SIZE_MARKERS.includes(selectedNodeSizeScale) ? 700 : 400 }}>
                      {Math.round(selectedNodeSizeScale * 100)}%
                    </span>
                  </div>
                  {/* スライダー：内部値0〜2、中央(1)が100%デフォルト */}
                  <div style={{ position: 'relative' }}>
                    <input
                      type="range"
                      min={0}
                      max={2}
                      step={0.01}
                      value={scaleToSlider(selectedNodeSizeScale)}
                      onChange={(e) => {
                        if (!selectedNodeId) return
                        const scale = sliderToScale(parseFloat(e.target.value))
                        updateNodeSizeScale(selectedNodeId, Math.round(scale * 100) / 100)
                      }}
                      style={{ width: '100%', accentColor: '#7c3aed', cursor: 'pointer' }}
                    />
                    {/* 50刻みのタップ可能な目印 */}
                    <div style={{ position: 'relative', height: 26, marginTop: 2 }}>
                      {SIZE_MARKERS.map((markerScale) => {
                        const isActive = Math.abs(selectedNodeSizeScale - markerScale) < 0.03
                        const isDefault = markerScale === 1.0
                        return (
                          <button
                            key={markerScale}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => selectedNodeId && updateNodeSizeScale(selectedNodeId, markerScale)}
                            style={{
                              position: 'absolute',
                              left: `${markerPos(markerScale)}%`,
                              transform: 'translateX(-50%)',
                              top: 0,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 2,
                              background: 'none',
                              border: 'none',
                              padding: '0 3px',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{
                              width: isDefault ? 2 : 1,
                              height: isActive ? 7 : 4,
                              background: isActive ? '#7c3aed' : isDefault ? '#a78bfa' : '#cbd5e1',
                              borderRadius: 1,
                              transition: 'all 0.15s ease',
                            }} />
                            <span style={{
                              fontSize: 8,
                              color: isActive ? '#7c3aed' : isDefault ? '#a78bfa' : '#cbd5e1',
                              fontWeight: isActive || isDefault ? 700 : 400,
                              whiteSpace: 'nowrap',
                              transition: 'color 0.15s ease',
                            }}>
                              {Math.round(markerScale * 100)}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* 枠線の太さ */}
                <div style={{ marginTop: 16, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 14 }}>
                  <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px 0' }}>
                    枠線
                  </p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1, 2, 3, 4].map((w) => (
                      <button
                        key={w}
                        onClick={() => selectedNodeId && updateNodeBorderWidth(selectedNodeId, w)}
                        title={`${w}px`}
                        style={{
                          flex: 1, height: 28, borderRadius: 8,
                          background: selectedNodeBorderWidth === w ? 'rgba(124,58,237,0.12)' : 'rgba(0,0,0,0.04)',
                          border: selectedNodeBorderWidth === w ? '1.5px solid rgba(124,58,237,0.5)' : '1.5px solid transparent',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{
                          width: '70%', height: w,
                          background: selectedNodeBorderWidth === w ? '#7c3aed' : '#94a3b8',
                          borderRadius: w,
                        }} />
                      </button>
                    ))}
                  </div>
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
                          width: 36, height: 36, borderRadius: 10, background: c.hex,
                          border: defaultNodeColor === c.key
                            ? `2.5px solid ${c.border.replace('0.5)', '1)')}`
                            : `1.5px solid ${c.border}`,
                          cursor: 'pointer',
                          boxShadow: defaultNodeColor === c.key ? `0 0 0 3px ${c.border}` : 'none',
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

          {/* メモ（常に表示） */}
          <div style={{ marginTop: colorExpanded ? 16 : 0, borderTop: colorExpanded ? '1px solid rgba(0,0,0,0.06)' : 'none', paddingTop: colorExpanded ? 14 : 0 }}>
            <div
              onPointerDown={!colorExpanded && !isMobile ? (e) => dragControls.start(e) : undefined}
              onTouchStart={!colorExpanded && isMobile ? onGripTouchStart : undefined}
              onTouchMove={!colorExpanded && isMobile ? onGripTouchMove : undefined}
              onTouchEnd={!colorExpanded && isMobile ? onGripTouchEnd : undefined}
              style={{
                display: 'flex', alignItems: 'center', marginBottom: 8,
                ...(!colorExpanded ? { cursor: 'grab', touchAction: 'none' } : {}),
              }}
            >
              {!colorExpanded && <GripVertical size={13} color="#cbd5e1" style={{ marginRight: 2 }} />}
              <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, flex: 1 }}>
                メモ
              </p>
              {!colorExpanded && (
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => setColorExpanded(true)}
                  title="カラー選択を表示"
                  style={{
                    background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 6,
                    cursor: 'pointer', padding: '4px 6px', display: 'flex',
                    color: '#94a3b8', transition: 'all 0.15s ease',
                  }}
                >
                  <AlignJustify size={15} />
                </button>
              )}
            </div>
            <textarea
              value={selectedNodeMemo}
              onChange={(e) => {
                const memo = e.target.value
                if (!selectedNodeId) return
                if (debounceRef.current) clearTimeout(debounceRef.current)
                debounceRef.current = setTimeout(() => updateNodeMemo(selectedNodeId, memo), 300)
                updateNodeMemo(selectedNodeId, memo)
              }}
              placeholder="メモを入力..."
              rows={4}
              style={{
                width: '100%', resize: 'vertical', borderRadius: 10,
                border: '1.5px solid rgba(0,0,0,0.08)', padding: '8px 10px',
                fontSize: 12, color: '#334155', background: 'rgba(248,250,252,0.8)',
                outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(139,92,246,0.5)' }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.08)' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
