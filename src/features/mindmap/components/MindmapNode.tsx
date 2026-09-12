import { Handle, Position, type Node, type NodeProps, NodeResizeControl } from '@xyflow/react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { Plus, Trash2, StickyNote } from 'lucide-react'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useIsMobile } from '../../../hooks/useIsMobile'
import { type MindmapNodeData, type NodeColor, type FreeDirection, useMindmapStore } from '../store/mindmapStore'

const COLOR_MAP: Record<NodeColor, { bg: string; border: string; glow: string; text: string }> = {
  purple: { bg: '#f3e8ff', border: 'rgba(139, 92, 246, 0.4)', glow: 'rgba(139, 92, 246, 0.12)', text: '#5b21b6' },
  blue:   { bg: '#dbeafe', border: 'rgba(59, 130, 246, 0.4)',  glow: 'rgba(59, 130, 246, 0.12)',  text: '#1e40af' },
  cyan:   { bg: '#cffafe', border: 'rgba(6, 182, 212, 0.4)',   glow: 'rgba(6, 182, 212, 0.12)',   text: '#0e7490' },
  green:  { bg: '#dcfce7', border: 'rgba(34, 197, 94, 0.4)',   glow: 'rgba(34, 197, 94, 0.12)',   text: '#15803d' },
  pink:   { bg: '#fce7f3', border: 'rgba(236, 72, 153, 0.4)',  glow: 'rgba(236, 72, 153, 0.12)',  text: '#be185d' },
  orange: { bg: '#ffedd5', border: 'rgba(249, 115, 22, 0.4)',  glow: 'rgba(249, 115, 22, 0.12)',  text: '#c2410c' },
}

// depth 0 = root（最大）、depth が深くなるほど小さく
const SIZE_MAP = [
  { minWidth: 200, maxWidth: 280, fontSize: 18, fontWeight: 700, paddingV: 20, paddingH: 28, borderRadius: 24, borderWidth: 2 },
  { minWidth: 150, maxWidth: 210, fontSize: 15, fontWeight: 600, paddingV: 14, paddingH: 20, borderRadius: 18, borderWidth: 1.5 },
  { minWidth: 120, maxWidth: 170, fontSize: 13, fontWeight: 500, paddingV: 10, paddingH: 14, borderRadius: 13, borderWidth: 1.5 },
  { minWidth: 100, maxWidth: 150, fontSize: 12, fontWeight: 500, paddingV: 8,  paddingH: 12, borderRadius: 10, borderWidth: 1 },
]

const ADD_BTN: React.CSSProperties = {
  position: 'absolute',
  width: 22,
  height: 22,
  borderRadius: '50%',
  background: '#ffffff',
  border: '1.5px solid rgba(124, 58, 237, 0.5)',
  color: '#7c3aed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  zIndex: 20,
  boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
  padding: 0,
}

// マウス角度（度）を8方向にスナップ
function angleToDirection(deg: number): FreeDirection {
  if (deg >= 337.5 || deg < 22.5)   return 'right'
  if (deg < 67.5)                    return 'bottom-right'
  if (deg < 112.5)                   return 'bottom'
  if (deg < 157.5)                   return 'bottom-left'
  if (deg < 202.5)                   return 'left'
  if (deg < 247.5)                   return 'top-left'
  if (deg < 292.5)                   return 'top'
  return 'top-right'
}

// 方向 → 固定角度（度）：ボタンは8方向の固定位置に置く（カーソルに完全追従させない）
const DIRECTION_ANGLE: Record<FreeDirection, number> = {
  right:        0,
  'bottom-right': 45,
  bottom:       90,
  'bottom-left': 135,
  left:         180,
  'top-left':   225,
  top:          270,
  'top-right':  315,
}

function MindmapNodeComponent({ id, data, selected, width, height }: NodeProps<Node<MindmapNodeData>>) {
  const { addChildNode, addChildNodeBelow, addChildNodeInDirection, updateNodeLabel, deleteNode, setSelectedNodeId, editingNodeId, setEditingNodeId, currentMapType } = useMindmapStore(
    useShallow((s) => ({
      addChildNode: s.addChildNode,
      addChildNodeBelow: s.addChildNodeBelow,
      addChildNodeInDirection: s.addChildNodeInDirection,
      updateNodeLabel: s.updateNodeLabel,
      deleteNode: s.deleteNode,
      setSelectedNodeId: s.setSelectedNodeId,
      editingNodeId: s.editingNodeId,
      setEditingNodeId: s.setEditingNodeId,
      currentMapType: s.sheets.find((sh) => sh.id === s.currentSheetId)?.mapType,
    }))
  )
  const isFree = currentMapType === 'free'
  const isMobile = useIsMobile()
  const canDeleteSheet = useMindmapStore((s) => s.sheets.length > 1)
  const updateNodeSize = useMindmapStore((s) => s.updateNodeSize)
  const [editing, setEditing] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [draft, setDraft] = useState(data.label)
  // フリーモード：インジケーターの表示状態と方向
  const [showIndicator, setShowIndicator] = useState(false)
  const [indicatorDir, setIndicatorDir] = useState<FreeDirection | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // モバイル：2本指ピンチでノードリサイズ
  const pinchRef = useRef<{ dist: number; w: number; h: number } | null>(null)
  // カーソル追従：useMotionValue + useSpring でリレンダリングなしにスムーズ追従
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const springX = useSpring(rawX, { stiffness: 500, damping: 38, restDelta: 0.3 })
  const springY = useSpring(rawY, { stiffness: 500, damping: 38, restDelta: 0.3 })
  const inputRef = useRef<HTMLInputElement>(null)
  const colors = COLOR_MAP[data.color]
  const showActions = (selected || hovered) && !editing
  const sz = SIZE_MAP[data.isRoot ? 0 : 1]
  const defaultRadius = isFree ? '50%' : sz.borderRadius
  const nodeBorderRadius = data.isCircle ? 9999 : (data.borderRadius !== undefined ? data.borderRadius : defaultRadius)
  // width・height両方使って面積ベースでスケール（より追従感が出る）
  const defaultH = sz.paddingV * 2 + sz.fontSize * 2.2
  const scaleW = width ? width / sz.minWidth : 1
  const scaleH = height ? height / defaultH : 1
  const fontSize = Math.round(sz.fontSize * Math.sqrt(scaleW * scaleH))

  useEffect(() => { setDraft(data.label) }, [data.label])

  useEffect(() => {
    if (editingNodeId === id) {
      setEditing(true)
      setEditingNodeId(null)
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [editingNodeId, id, setEditingNodeId])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const commitEdit = useCallback(() => {
    const trimmed = draft.trim()
    if (trimmed) updateNodeLabel(id, trimmed)
    else setDraft(data.label)
    setEditing(false)
  }, [draft, id, data.label, updateNodeLabel])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') commitEdit()
      if (e.key === 'Escape') { setDraft(data.label); setEditing(false) }
    },
    [commitEdit, data.label]
  )

  // モバイル：選択中ノード上での2本指ピンチでリサイズ
  const handlePinchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !selected || e.touches.length !== 2) return
    e.stopPropagation()
    const dist = Math.hypot(
      e.touches[1].clientX - e.touches[0].clientX,
      e.touches[1].clientY - e.touches[0].clientY,
    )
    pinchRef.current = { dist, w: width ?? sz.minWidth, h: height ?? (sz.paddingV * 2 + sz.fontSize * 2) }
  }, [isMobile, selected, width, height, sz])

  const handlePinchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !selected || e.touches.length !== 2 || !pinchRef.current) return
    e.stopPropagation()
    const newDist = Math.hypot(
      e.touches[1].clientX - e.touches[0].clientX,
      e.touches[1].clientY - e.touches[0].clientY,
    )
    const scale = newDist / pinchRef.current.dist
    const minH = sz.paddingV * 2 + sz.fontSize * 2
    const newW = Math.max(sz.minWidth, Math.round(pinchRef.current.w * scale))
    const newH = data.isCircle ? newW : Math.max(minH, Math.round(pinchRef.current.h * scale))
    updateNodeSize(id, newW, newH)
  }, [isMobile, selected, id, sz, data.isCircle, updateNodeSize])

  const handlePinchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) pinchRef.current = null
  }, [])

  // フリーモード：カーソル方向を8方向にスナップしてインジケーター位置を更新
  // ボタンは固定スナップ位置に置く（カーソル完全追従だとボタンが逃げるため）
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isFree || editing) return
    const rect = e.currentTarget.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    const cx = e.clientX - rect.left - w / 2
    const cy = e.clientY - rect.top - h / 2
    const angle = Math.atan2(cy, cx)
    const deg = ((angle * 180 / Math.PI) + 360) % 360
    const dir = angleToDirection(deg)
    // 固定スナップ角度でボタン位置を計算（カーソル方向ではなく方向名の中心角）
    const snappedRad = DIRECTION_ANGLE[dir] * Math.PI / 180
    const rx = w / 2
    const ry = h / 2
    const OUTSIDE = 32
    rawX.set(rx + (rx + OUTSIDE) * Math.cos(snappedRad) - 11)
    rawY.set(ry + (ry + OUTSIDE) * Math.sin(snappedRad) - 11)
    setIndicatorDir(dir)
    if (!showIndicator) setShowIndicator(true)
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [isFree, editing, rawX, rawY, showIndicator])

  const scheduleIndicatorHide = useCallback(() => {
    setHovered(false)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => {
      setShowIndicator(false)
      setIndicatorDir(null)
      hideTimerRef.current = null
    }, 500)
  }, [])

  const cancelIndicatorHide = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="mindmap-node"
      style={{
        width: '100%',
        height: '100%',
        minWidth: sz.minWidth,
        minHeight: data.isCircle ? sz.minWidth : sz.paddingV * 2 + sz.fontSize * 2,
        boxSizing: 'border-box',
        borderRadius: nodeBorderRadius,
        background: colors.bg,
        border: `${data.borderWidth ?? sz.borderWidth}px solid ${colors.border}`,
        boxShadow: selected
          ? `0 0 0 2px #7c3aed, 0 4px 16px ${colors.glow}`
          : `0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px ${colors.border}`,
        padding: `${sz.paddingV}px ${sz.paddingH}px`,
        cursor: 'grab',
        userSelect: 'none',
        position: 'relative',
        overflow: 'visible',
        transition: 'box-shadow 0.2s ease',
        fontSize,
        fontWeight: sz.fontWeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onDoubleClick={() => setEditing(true)}
      onClick={() => setSelectedNodeId(id)}
      onMouseEnter={() => { cancelIndicatorHide(); setHovered(true) }}
      onMouseLeave={scheduleIndicatorHide}
      onMouseMove={handleMouseMove}
      onTouchStart={isMobile && selected ? handlePinchStart : undefined}
      onTouchMove={isMobile && selected ? handlePinchMove : undefined}
      onTouchEnd={isMobile && selected ? handlePinchEnd : undefined}
    >
      {selected && (['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((pos) => (
        <NodeResizeControl
          key={pos}
          position={pos}
          keepAspectRatio={data.isCircle || undefined}
          minWidth={sz.minWidth}
          minHeight={data.isCircle ? sz.minWidth : sz.paddingV * 2 + sz.fontSize * 2}
          style={{
            width: 10, height: 10,
            borderRadius: '50%',
            background: 'white',
            border: '2px solid #7c3aed',
            boxShadow: '0 1px 4px rgba(124,58,237,0.3)',
          }}
        />
      ))}

      {/* 右展開モード用ハンドル */}
      <Handle id="left"          type="target" position={Position.Left}   style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle id="right"         type="source" position={Position.Right}  style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle id="top"           type="target" position={Position.Top}    style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle id="bottom"        type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
      {/* フリーモード用：中心ハンドル（sourceX/Y = ノード中心になりエッジが動的追従する） */}
      <Handle id="free-src" type="source" position={Position.Top} style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', opacity: 0, pointerEvents: 'none' }} />
      <Handle id="free-tgt" type="target" position={Position.Top} style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', opacity: 0, pointerEvents: 'none' }} />

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: colors.text,
            fontSize,
            fontWeight: sz.fontWeight,
            width: '100%',
            textAlign: 'center',
          }}
        />
      ) : (
        <p
          style={{
            color: colors.text,
            fontSize,
            fontWeight: sz.fontWeight,
            margin: 0,
            textAlign: 'center',
            wordBreak: 'break-word',
            lineHeight: 1.4,
          }}
        >
          {data.label}
        </p>
      )}

      {/* メモインジケーター（メモあり・非選択時） */}
      {data.memo && !selected && (
        <div style={{
          position: 'absolute',
          bottom: 4,
          right: 6,
          color: colors.border.replace('0.4)', '0.7)'),
          lineHeight: 1,
          pointerEvents: 'none',
        }}>
          <StickyNote size={10} />
        </div>
      )}

      {/* メモバブル（選択時） */}
      <AnimatePresence>
        {selected && data.memo && (
          <motion.div
            key="memo-bubble"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(255,255,255,0.97)',
              border: `1.5px solid ${colors.border}`,
              borderRadius: 12,
              padding: '10px 14px',
              minWidth: 160,
              maxWidth: 260,
              boxShadow: `0 4px 16px rgba(0,0,0,0.10), 0 0 0 1px ${colors.border}`,
              zIndex: 50,
              pointerEvents: 'none',
            }}
          >
            {/* 吹き出しの三角（上向き） */}
            <div style={{
              position: 'absolute',
              top: -6,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderBottom: `6px solid ${colors.border.replace('0.4)', '0.6)')}`,
            }} />
            <div style={{
              position: 'absolute',
              top: -4,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderBottom: '5px solid rgba(255,255,255,0.97)',
            }} />
            <p style={{
              margin: 0,
              fontSize: 12,
              color: '#334155',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {data.memo}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 削除ボタン（ルートは複数シートある場合のみ表示） */}
      <AnimatePresence>
        {showActions && (id !== 'root' || canDeleteSheet) && (
          <div style={{ position: 'absolute', top: -10, left: -10 }}>
            <motion.button
              key="delete"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.12 }}
              onClick={(e) => { e.stopPropagation(); deleteNode(id) }}
              style={{ ...ADD_BTN, border: '1.5px solid rgba(239, 68, 68, 0.6)', color: '#ef4444' }}
            >
              <Trash2 size={11} />
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* 右展開モード：右・下の + ボタン */}
      <AnimatePresence>
        {!isFree && showActions && (
          <motion.button
            key="add-right"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.12 }}
            onClick={(e) => { e.stopPropagation(); addChildNode(id) }}
            style={{ ...ADD_BTN, right: -11, top: '50%', marginTop: -11 }}
            title="右に追加"
          >
            <Plus size={13} />
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {!isFree && showActions && (
          <motion.button
            key="add-bottom"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.12 }}
            onClick={(e) => { e.stopPropagation(); addChildNodeBelow(id) }}
            style={{ ...ADD_BTN, bottom: -11, left: '50%', marginLeft: -11 }}
            title="下に追加"
          >
            <Plus size={13} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* フリー展開モード：カーソル追従インジケーター（useSpringでスムーズ追従） */}
      <AnimatePresence>
        {isFree && !editing && showIndicator && (
          <motion.button
            key="free-indicator"
            className="nodrag"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={{ opacity: { duration: 0.14 }, scale: { type: 'spring', stiffness: 450, damping: 26 } }}
            onMouseEnter={cancelIndicatorHide}
            onMouseLeave={scheduleIndicatorHide}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); if (indicatorDir) addChildNodeInDirection(id, indicatorDir) }}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              x: springX,
              y: springY,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: '#7c3aed',
              border: '2px solid white',
              boxShadow: '0 0 0 2px rgba(124,58,237,0.4), 0 2px 10px rgba(124,58,237,0.35)',
              cursor: 'pointer',
              zIndex: 9999,
              pointerEvents: 'all',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            <Plus size={11} color="white" />
          </motion.button>
        )}
      </AnimatePresence>

    </motion.div>
  )
}

export const MindmapNode = memo(MindmapNodeComponent)
