import { motion } from 'framer-motion'

export function HelpHint() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5 }}
      style={{
        position: 'fixed',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(255, 255, 255, 0.88)',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 100,
        padding: '6px 16px',
        backdropFilter: 'blur(12px)',
        zIndex: 50,
        display: 'flex',
        gap: 16,
        alignItems: 'center',
      }}
    >
      {[
        { key: 'ダブルクリック', desc: '編集' },
        { key: '選択 → 追加', desc: '子ノード' },
        { key: 'スクロール', desc: 'ズーム' },
      ].map((hint) => (
        <div
          key={hint.key}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <kbd
            style={{
              background: 'rgba(0,0,0,0.05)',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: 6,
              padding: '2px 8px',
              fontSize: 11,
              color: '#64748b',
              fontFamily: 'inherit',
            }}
          >
            {hint.key}
          </kbd>
          <span style={{ color: '#475569', fontSize: 11 }}>{hint.desc}</span>
        </div>
      ))}
    </motion.div>
  )
}
