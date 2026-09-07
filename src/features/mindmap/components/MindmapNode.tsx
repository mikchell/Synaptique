import { Handle, Position, type NodeProps } from '@xyflow/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { type MindmapNodeData, type NodeColor, useMindmapStore } from '../store/mindmapStore'

const COLOR_MAP: Record<NodeColor, { bg: string; border: string; glow: string; text: string }> = {
  purple: {
    bg: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)',
    border: 'rgba(124, 58, 237, 0.6)',
    glow: 'rgba(124, 58, 237, 0.3)',
    text: '#e9d5ff',
  },
  blue: {
    bg: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
    border: 'rgba(37, 99, 235, 0.6)',
    glow: 'rgba(37, 99, 235, 0.3)',
    text: '#bfdbfe',
  },
  cyan: {
    bg: 'linear-gradient(135deg, #164e63 0%, #0891b2 100%)',
    border: 'rgba(8, 145, 178, 0.6)',
    glow: 'rgba(8, 145, 178, 0.3)',
    text: '#a5f3fc',
  },
  green: {
    bg: 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)',
    border: 'rgba(22, 163, 74, 0.6)',
    glow: 'rgba(22, 163, 74, 0.3)',
    text: '#bbf7d0',
  },
  pink: {
    bg: 'linear-gradient(135deg, #831843 0%, #db2777 100%)',
    border: 'rgba(219, 39, 119, 0.6)',
    glow: 'rgba(219, 39, 119, 0.3)',
    text: '#fbcfe8',
  },
  orange: {
    bg: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)',
    border: 'rgba(234, 88, 12, 0.6)',
    glow: 'rgba(234, 88, 12, 0.3)',
    text: '#fed7aa',
  },
}

const ADD_BTN: React.CSSProperties = {
  position: 'absolute',
  width: 22,
  height: 22,
  borderRadius: '50%',
  background: 'rgba(20, 20, 30, 0.95)',
  border: '1.5px solid rgba(124, 58, 237, 0.7)',
  color: '#a78bfa',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  zIndex: 20,
  backdropFilter: 'blur(8px)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
  padding: 0,
}

export function MindmapNode({ id, data, selected }: NodeProps<MindmapNodeData>) {
  const { addChildNode, updateNodeLabel, deleteNode, setSelectedNodeId } = useMindmapStore()
  const [editing, setEditing] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [draft, setDraft] = useState(data.label)
  const inputRef = useRef<HTMLInputElement>(null)
  const colors = COLOR_MAP[data.color]
  const showActions = (selected || hovered) && !editing

  useEffect(() => { setDraft(data.label) }, [data.label])

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
        minWidth: data.isRoot ? 160 : 130,
        maxWidth: data.isRoot ? 220 : 180,
        borderRadius: data.isRoot ? 20 : 14,
        background: colors.bg,
        border: `1.5px solid ${colors.border}`,
        boxShadow: selected
          ? `0 0 0 2px #7c3aed, 0 0 32px ${colors.glow}, 0 8px 32px rgba(0,0,0,0.4)`
          : `0 4px 20px rgba(0,0,0,0.3), 0 0 12px ${colors.glow}`,
        padding: data.isRoot ? '16px 20px' : '12px 16px',
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
      {/* React Flow ハンドル（接続ポイント、不可視） */}
      <Handle id="left"   type="target" position={Position.Left}   style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle id="right"  type="source" position={Position.Right}  style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle id="top"    type="target" position={Position.Top}    style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />

      {/* ラベル */}
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
            fontSize: data.isRoot ? 16 : 14,
            fontWeight: data.isRoot ? 700 : 500,
            width: '100%',
            textAlign: 'center',
          }}
        />
      ) : (
        <p
          style={{
            color: colors.text,
            fontSize: data.isRoot ? 16 : 14,
            fontWeight: data.isRoot ? 700 : 500,
            margin: 0,
            textAlign: 'center',
            wordBreak: 'break-word',
            lineHeight: 1.4,
          }}
        >
          {data.label}
        </p>
      )}

      {/* 削除ボタン（左上、選択/ホバー時） */}
      <AnimatePresence>
        {showActions && id !== 'root' && (
          <motion.button
            key="delete"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.12 }}
            onClick={(e) => { e.stopPropagation(); deleteNode(id) }}
            style={{
              ...ADD_BTN,
              top: -10,
              left: -10,
              border: '1.5px solid rgba(239, 68, 68, 0.7)',
              color: '#f87171',
            }}
          >
            <Trash2 size={11} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 右の + ボタン */}
      <AnimatePresence>
        {showActions && (
          <motion.button
            key="add-right"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.12 }}
            onClick={(e) => { e.stopPropagation(); addChildNode(id, 'right') }}
            style={{
              ...ADD_BTN,
              right: -11,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
            title="右に追加"
          >
            <Plus size={13} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 下の + ボタン */}
      <AnimatePresence>
        {showActions && (
          <motion.button
            key="add-bottom"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.12 }}
            onClick={(e) => { e.stopPropagation(); addChildNode(id, 'bottom') }}
            style={{
              ...ADD_BTN,
              bottom: -11,
              left: '50%',
              transform: 'translateX(-50%)',
            }}
            title="下に追加"
          >
            <Plus size={13} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
