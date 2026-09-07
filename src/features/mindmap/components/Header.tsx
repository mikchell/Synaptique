import { motion } from 'framer-motion'
import { Brain, LogOut, Save } from 'lucide-react'
import { useAuth } from '../../auth/useAuth'

export function Header() {
  const { user, signOut } = useAuth()

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: 'rgba(255, 255, 255, 0.9)',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        backdropFilter: 'blur(20px)',
        zIndex: 200,
      }}
    >
      {/* ロゴ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
            borderRadius: 10,
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Brain size={18} color="white" />
        </div>
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          俺のMindMap
        </span>
      </div>

      {/* 右側 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Save size={13} color="#22c55e" />
          <span style={{ color: '#22c55e', fontSize: 12, fontWeight: 500 }}>自動保存済み</span>
        </div>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                alt="avatar"
                style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
              />
            )}
            <button
              onClick={() => signOut()}
              title="ログアウト"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'none',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: 8,
                padding: '4px 10px',
                cursor: 'pointer',
                color: '#64748b',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <LogOut size={13} />
              ログアウト
            </button>
          </div>
        )}
      </div>
    </motion.header>
  )
}
