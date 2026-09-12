import { useMindmapStore } from '../../mindmap/store/mindmapStore'
import { TEMPLATES } from '../../mindmap/components/TemplateSelectModal'

export function TemplatesSection() {
  const addSheet = useMindmapStore((s) => s.addSheet)

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {TEMPLATES.map(({ type, label, desc, preview }) => (
        <button
          key={type}
          onClick={() => addSheet(type)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            width: 180,
            padding: '20px 16px',
            borderRadius: 16,
            border: '1.5px solid rgba(0,0,0,0.08)',
            background: '#fafafa',
            cursor: 'pointer',
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
          <div style={{ background: '#f0f4ff', borderRadius: 10, padding: '8px 6px' }}>{preview}</div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#1e1b4b' }}>{label}</p>
            <p style={{ margin: 0, fontSize: 11, color: '#64748b', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
              {desc}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}
