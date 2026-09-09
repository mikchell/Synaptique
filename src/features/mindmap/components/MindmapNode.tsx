import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, StickyNote } from 'lucide-react'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { type MindmapNodeData, type NodeColor, useMindmapStore } from '../store/mindmapStore'

const MIN_SCALE = 0.4
const MAX_SCALE = 3.0

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
  { minWidth: 200, maxWidth: 280, fontSize: 18, fontWeight: 700, paddingY: 20, paddingX: 28, borderRadius: 24, borderWidth: 2 },
  { minWidth: 150, maxWidth: 210, fontSize: 15, fontWeight: 600, paddingY: 14, paddingX: 20, borderRadius: 18, borderWidth: 1.5 },
  { minWidth: 120, maxWidth: 170, fontSize: 13, fontWeight: 500, paddingY: 10, paddingX: 14, borderRadius: 13, borderWidth: 1.5 },
  { minWidth: 100, maxWidth: 150, fontSize: 12, fontWeight: 500, paddingY:  8, paddingX: 12, borderRadius: 10, borderWidth: 1 },
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

function MindmapNodeComponent({ id, data, selected }: NodeProps<Node<MindmapNodeData>>) {
  const { addChildNode, addChildNodeBelow, updateNodeLabel, deleteNode, setSelectedNodeId, editingNodeId, setEditingNodeId, updateNodeScale } = useMindmapStore(
    useShallow((s) => ({
      addChildNode: s.addChildNode,
      addChildNodeBelow: s.addChildNodeBelow,
      updateNodeLabel: s.updateNodeLabel,
      deleteNode: s.deleteNode,
      setSelectedNodeId: s.setSelectedNodeId,
      editingNodeId: s.editingNodeId,
      setEditingNodeId: s.setEditingNodeId,
      updateNodeScale: s.updateNodeScale,
    }))
  )
  const [editing, setEditing] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [draft, setDraft] = useState(data.label)
  const inputRef = useRef<HTMLInputElement>(null)
  const resizingRef = useRef<{ startX: number; startY: number; startScale: number; corner: string } | null>(null)
  const colors = COLOR_MAP[data.color]
  const showActions = (selected || hovered) && !editing
  const depth = data.depth ?? 0
  const sz = SIZE_MAP[Math.min(depth, SIZE_MAP.length - 1)]
  const scale = data.scale ?? 1

  const onResizeMouseDown = useCallback((e: React.MouseEvent, corner: string) => {
    e.stopPropagation()
    e.preventDefault()
    resizingRef.current = { startX: e.clientX, startY: e.clientY, startScale: scale, corner }

    const onMouseMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return
      const { startX, startY, startScale, corner: c } = resizingRef.current
      const dx = c.includes('right') ? ev.clientX - startX : startX - ev.clientX
      const dy = c.includes('bottom') ? ev.clientY - startY : startY - ev.clientY
      const delta = (dx + dy) / 200
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, startScale + delta))
      updateNodeScale(id, newScale)
    }

    const onMouseUp = () => {
      resizingRef.current = null
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [id, scale, updateNodeScale])

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

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="mindmap-node"
      style={{
        minWidth: sz.minWidth * scale,
        maxWidth: sz.maxWidth * scale,
        borderRadius: sz.borderRadius * scale,
        background: colors.bg,
        border: `${data.borderWidth ?? sz.borderWidth}px solid ${colors.border}`,
        padding: `${sz.paddingY * scale}px ${sz.paddingX * scale}px`,
        boxShadow: selected
          ? `0 0 0 2px #7c3aed, 0 4px 16px ${colors.glow}`
          : `0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px ${colors.border}`,
        padding: sz.padding,
        cursor: 'grab',
        userSelect: 'none',
        position: 'relative',
        transition: 'box-shadow 0.2s ease',
      }}
      onDoubleClick={() => setEditing(true)}
      onClick={() => setSelectedNodeId(id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Handle id="left"   type="target" position={Position.Left}   style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle id="right"  type="source" position={Position.Right}  style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle id="top"    type="target" position={Position.Top}    style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />

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
            fontSize: sz.fontSize * scale,
            fontWeight: sz.fontWeight,
            width: '100%',
            textAlign: 'center',
          }}
        />
      ) : (
        <p
          style={{
            color: colors.text,
            fontSize: sz.fontSize * scale,
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

      {/* リサイズハンドル（選択・ホバー時） */}
      {(selected || hovered) && !editing && (
        <>
          {[
            { corner: 'top-left',     style: { top: -5, left: -5 },     cursor: 'nw-resize' },
            { corner: 'top-right',    style: { top: -5, right: -5 },    cursor: 'ne-resize' },
            { corner: 'bottom-left',  style: { bottom: -5, left: -5 },  cursor: 'sw-resize' },
            { corner: 'bottom-right', style: { bottom: -5, right: -5 }, cursor: 'se-resize' },
          ].map(({ corner, style, cursor }) => (
            <div
              key={corner}
              className="nodrag"
              onMouseDown={(e) => onResizeMouseDown(e, corner)}
              style={{
                position: 'absolute', ...style,
                width: 10, height: 10, borderRadius: '50%',
                background: '#ffffff', border: '1.5px solid rgba(124,58,237,0.6)',
                cursor, zIndex: 30, boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }}
            />
          ))}
        </>
      )}

      {/* 削除ボタン */}
      <AnimatePresence>
        {showActions && id !== 'root' && (
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

      {/* 右の + ボタン → 子ノード追加（次の世代） */}
      <AnimatePresence>
        {showActions && (
          <motion.button
            key="add-right"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.12 }}
            onClick={(e) => { e.stopPropagation(); addChildNode(id) }}
            style={{ ...ADD_BTN, right: -11, top: '50%', marginTop: -11 }}
            title="子ノードを追加"
          >
            <Plus size={13} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 下の + ボタン → 子ノード追加（下方向） */}
      <AnimatePresence>
        {showActions && (
          <motion.button
            key="add-bottom"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.12 }}
            onClick={(e) => { e.stopPropagation(); addChildNodeBelow(id) }}
            style={{ ...ADD_BTN, bottom: -11, left: '50%', marginLeft: -11 }}
            title="下に子ノードを追加"
          >
            <Plus size={13} />
          </motion.button>
        )}
      </AnimatePresence>

    </motion.div>
  )
}

export const MindmapNode = memo(MindmapNodeComponent)
