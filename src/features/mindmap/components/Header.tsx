import { motion } from 'framer-motion'
import { LogOut, Save } from 'lucide-react'
import { useAuth } from '../../auth/useAuth'

function SynaptiqueIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="headerSynapseGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <line x1="32" y1="32" x2="14" y2="16" stroke="url(#headerSynapseGrad)" strokeWidth="1.8" strokeOpacity="0.5" />
      <line x1="32" y1="32" x2="50" y2="16" stroke="url(#headerSynapseGrad)" strokeWidth="1.8" strokeOpacity="0.5" />
      <line x1="32" y1="32" x2="10" y2="44" stroke="url(#headerSynapseGrad)" strokeWidth="1.8" strokeOpacity="0.5" />
      <line x1="32" y1="32" x2="54" y2="44" stroke="url(#headerSynapseGrad)" strokeWidth="1.8" strokeOpacity="0.5" />
      <line x1="32" y1="32" x2="32" y2="54" stroke="url(#headerSynapseGrad)" strokeWidth="1.8" strokeOpacity="0.5" />
      <line x1="14" y1="16" x2="50" y2="16" stroke="url(#headerSynapseGrad)" strokeWidth="1.2" strokeOpacity="0.25" />
      <line x1="10" y1="44" x2="54" y2="44" stroke="url(#headerSynapseGrad)" strokeWidth="1.2" strokeOpacity="0.25" />
      <circle cx="14" cy="16" r="5" fill="url(#headerSynapseGrad)" opacity="0.7" />
      <circle cx="50" cy="16" r="5" fill="url(#headerSynapseGrad)" opacity="0.7" />
      <circle cx="10" cy="44" r="4" fill="url(#headerSynapseGrad)" opacity="0.55" />
      <circle cx="54" cy="44" r="4" fill="url(#headerSynapseGrad)" opacity="0.55" />
      <circle cx="32" cy="54" r="4" fill="url(#headerSynapseGrad)" opacity="0.55" />
      <circle cx="32" cy="32" r="9" fill="url(#headerSynapseGrad)" />
      <circle cx="32" cy="32" r="5" fill="white" opacity="0.9" />
    </svg>
  )
}

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
        <SynaptiqueIcon />
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Synaptique
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
