import { Pencil, Plus, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useMindmapStore } from '../store/mindmapStore'

export function SheetTabs() {
  const { sheets, currentSheetId, addSheet, deleteSheet, renameSheet, switchSheet } =
    useMindmapStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = useCallback((id: string, name: string) => {
    setEditingId(id)
    setDraft(name)
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 0)
  }, [])

  const commitEdit = useCallback(() => {
    if (editingId && draft.trim()) renameSheet(editingId, draft.trim())
    setEditingId(null)
  }, [editingId, draft, renameSheet])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        paddingLeft: 12,
        paddingRight: 12,
        zIndex: 100,
      }}
    >
      {sheets.map((sheet) => {
        const isActive = sheet.id === currentSheetId
        const isEditing = editingId === sheet.id
        const isHovered = hoveredId === sheet.id
        return (
          <div
            key={sheet.id}
            onClick={() => !isEditing && switchSheet(sheet.id)}
            onMouseEnter={() => setHoveredId(sheet.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              height: 30,
              padding: '0 8px',
              borderRadius: 8,
              background: isActive ? 'rgba(124,58,237,0.1)' : 'transparent',
              border: isActive ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
              color: isActive ? '#7c3aed' : '#64748b',
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.15s ease',
              minWidth: 0,
              maxWidth: 200,
            }}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitEdit()
                  if (e.key === 'Escape') setEditingId(null)
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#7c3aed',
                  fontSize: 13,
                  fontWeight: 600,
                  width: 90,
                }}
              />
            ) : (
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {sheet.name}
              </span>
            )}

            {/* 鉛筆アイコン（ホバー時 or アクティブ時に表示） */}
            {!isEditing && (isHovered || isActive) && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  startEdit(sheet.id, sheet.name)
                }}
                title="シート名を変更"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  border: 'none',
                  background: 'transparent',
                  color: isActive ? '#7c3aed' : '#94a3b8',
                  cursor: 'pointer',
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                <Pencil size={11} />
              </button>
            )}

            {/* 削除ボタン */}
            {!isEditing && sheets.length > 1 && (isHovered || isActive) && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteSheet(sheet.id)
                }}
                title="シートを削除"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'transparent',
                  color: isActive ? '#7c3aed' : '#94a3b8',
                  cursor: 'pointer',
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                <X size={11} />
              </button>
            )}
          </div>
        )
      })}

      <button
        onClick={addSheet}
        title="シートを追加"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 8,
          border: '1px solid rgba(0,0,0,0.1)',
          background: 'transparent',
          color: '#64748b',
          cursor: 'pointer',
          flexShrink: 0,
          marginLeft: 2,
        }}
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
