import { motion, AnimatePresence } from 'framer-motion'
import { useShallow } from 'zustand/react/shallow'
import { useMindmapStore, type MapType } from '../store/mindmapStore'

// 「右展開」テンプレートは廃止（フリー展開に一本化）。今後テンプレートを追加していく前提でこの配列とカードUIは残す。
export const TEMPLATES: { type: MapType; label: string; desc: string; preview: React.ReactNode }[] = [
  {
    type: 'free',
    label: 'フリー展開',
    desc: '上下左右どの方向にも\nノードを展開できる',
    preview: (
      <svg width="100" height="60" viewBox="0 0 100 60">
        <rect x="36" y="22" width="28" height="16" rx="4" fill="#ede9fe" stroke="#7c3aed" strokeWidth="1.5" />
        <line x1="64" y1="30" x2="74" y2="30" stroke="#7c3aed" strokeWidth="1.2" opacity="0.6" />
        <rect x="74" y="22" width="22" height="16" rx="3" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.2" />
        <line x1="36" y1="30" x2="26" y2="30" stroke="#7c3aed" strokeWidth="1.2" opacity="0.6" />
        <rect x="4" y="22" width="22" height="16" rx="3" fill="#dcfce7" stroke="#22c55e" strokeWidth="1.2" />
        <line x1="50" y1="22" x2="50" y2="14" stroke="#7c3aed" strokeWidth="1.2" opacity="0.6" />
        <rect x="36" y="2" width="28" height="12" rx="3" fill="#ffedd5" stroke="#f97316" strokeWidth="1.2" />
        <line x1="50" y1="38" x2="50" y2="46" stroke="#7c3aed" strokeWidth="1.2" opacity="0.6" />
        <rect x="36" y="46" width="28" height="12" rx="3" fill="#fce7f3" stroke="#ec4899" strokeWidth="1.2" />
      </svg>
    ),
  },
]

export function TemplateSelectModal() {
  const { templateModalOpen, templateModalMode, addSheet, setCurrentSheetMapType, closeTemplateModal } =
    useMindmapStore(
      useShallow((s) => ({
        templateModalOpen: s.templateModalOpen,
        templateModalMode: s.templateModalMode,
        addSheet: s.addSheet,
        setCurrentSheetMapType: s.setCurrentSheetMapType,
        closeTemplateModal: s.closeTemplateModal,
      }))
    )

  const handleSelect = (mapType: MapType) => {
    if (templateModalMode === 'init') {
      setCurrentSheetMapType(mapType)
    } else {
      addSheet(mapType)
    }
  }

  return (
    <AnimatePresence>
      {templateModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
          onClick={templateModalMode === 'new' ? closeTemplateModal : undefined}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(255,255,255,0.98)',
              borderRadius: 24,
              padding: '32px 28px',
              width: 360,
              boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
            }}
          >
            <p style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#1e1b4b', textAlign: 'center' }}>
              テンプレートを選択
            </p>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>
              マップの展開スタイルを選んでください
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              {TEMPLATES.map(({ type, label, desc, preview }) => (
                <button
                  key={type}
                  onClick={() => handleSelect(type)}
                  style={{
                    flex: 1, border: '1.5px solid rgba(0,0,0,0.08)',
                    borderRadius: 16, padding: '16px 12px',
                    background: '#fafafa', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'
                    e.currentTarget.style.background = '#f5f3ff'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(124,58,237,0.12)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'
                    e.currentTarget.style.background = '#fafafa'
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{ background: '#f0f4ff', borderRadius: 10, padding: '8px 6px' }}>
                    {preview}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#1e1b4b', textAlign: 'center' }}>
                      {label}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: '#64748b', textAlign: 'center', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                      {desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {templateModalMode === 'new' && (
              <button
                onClick={closeTemplateModal}
                style={{
                  marginTop: 16, width: '100%', padding: '8px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, color: '#94a3b8',
                }}
              >
                キャンセル
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
