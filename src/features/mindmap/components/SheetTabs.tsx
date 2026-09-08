import { Pencil, Plus, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useMindmapStore } from '../store/mindmapStore'

export function SheetTabs() {
  const { sheets, currentSheetId, addSheet, deleteSheet, renameSheet, switchSheet } =
    useMindmapStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [fadeLeft, setFadeLeft] = useState(false)
  const [fadeRight, setFadeRight] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const updateFade = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setFadeLeft(el.scrollLeft > 4)
    setFadeRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateFade()
    el.addEventListener('scroll', updateFade, { passive: true })
    const ro = new ResizeObserver(updateFade)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateFade)
      ro.disconnect()
    }
  }, [updateFade])

  // シート数が変わったときもフェードを再計算
  useEffect(() => {
    updateFade()
  }, [sheets.length, updateFade])

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
        zIndex: 100,
      }}
    >
      {/* スクロール領域とフェードのラッパー */}
      <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
        {/* 左フェード */}
        {fadeLeft && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 32,
              background: 'linear-gradient(to right, rgba(255,255,255,0.92), transparent)',
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* スクロール可能なタブ領域 */}
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            overflowX: 'auto',
            paddingLeft: 12,
            paddingRight: 8,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          } as React.CSSProperties}
          className="hide-scrollbar"
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
                  flexShrink: 0,
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
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sheet.name}
                  </span>
                )}

                {!isEditing && (isHovered || isActive) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); startEdit(sheet.id, sheet.name) }}
                    title="シート名を変更"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 16, height: 16, borderRadius: 4, border: 'none',
                      background: 'transparent', color: isActive ? '#7c3aed' : '#94a3b8',
                      cursor: 'pointer', padding: 0, flexShrink: 0,
                    }}
                  >
                    <Pencil size={11} />
                  </button>
                )}

                {!isEditing && sheets.length > 1 && (isHovered || isActive) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSheet(sheet.id) }}
                    title="シートを削除"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 16, height: 16, borderRadius: '50%', border: 'none',
                      background: 'transparent', color: isActive ? '#7c3aed' : '#94a3b8',
                      cursor: 'pointer', padding: 0, flexShrink: 0,
                    }}
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* 右フェード */}
        {fadeRight && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 32,
              background: 'linear-gradient(to left, rgba(255,255,255,0.92), transparent)',
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {/* 追加ボタン（常に右端に固定） */}
      <div style={{ paddingRight: 12, paddingLeft: 4, flexShrink: 0 }}>
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
          }}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}
