import { motion } from 'framer-motion'
import { useAuth } from './useAuth'

export function LoginScreen() {
  const { signInWithGoogle } = useAuth()

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        backgroundImage: `radial-gradient(circle, rgba(148,163,184,0.5) 1.5px, transparent 1.5px)`,
        backgroundSize: '24px 24px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        style={{
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 24,
          padding: '48px 40px',
          width: 360,
          boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 32,
        }}
      >
        {/* ロゴ */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <SynaptiqueIcon />
          <div style={{ textAlign: 'center' }}>
            <h1
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: '-0.5px',
                background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Synaptique
            </h1>
            <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: 13 }}>
              アイデアをつなげよう
            </p>
          </div>
        </div>

        {/* Googleログインボタン */}
        <button
          onClick={() => signInWithGoogle()}
          style={{
            width: '100%',
            padding: '12px 20px',
            borderRadius: 12,
            border: '1px solid rgba(0,0,0,0.12)',
            background: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            fontSize: 14,
            fontWeight: 600,
            color: '#1e293b',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'
            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'
          }}
        >
          <GoogleIcon />
          Googleでログイン
        </button>
      </motion.div>
    </div>
  )
}

function SynaptiqueIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="synapseGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      {/* 接続線 */}
      <line x1="32" y1="32" x2="14" y2="16" stroke="url(#synapseGrad)" strokeWidth="1.8" strokeOpacity="0.5" />
      <line x1="32" y1="32" x2="50" y2="16" stroke="url(#synapseGrad)" strokeWidth="1.8" strokeOpacity="0.5" />
      <line x1="32" y1="32" x2="10" y2="44" stroke="url(#synapseGrad)" strokeWidth="1.8" strokeOpacity="0.5" />
      <line x1="32" y1="32" x2="54" y2="44" stroke="url(#synapseGrad)" strokeWidth="1.8" strokeOpacity="0.5" />
      <line x1="32" y1="32" x2="32" y2="54" stroke="url(#synapseGrad)" strokeWidth="1.8" strokeOpacity="0.5" />
      <line x1="14" y1="16" x2="50" y2="16" stroke="url(#synapseGrad)" strokeWidth="1.2" strokeOpacity="0.25" />
      <line x1="10" y1="44" x2="54" y2="44" stroke="url(#synapseGrad)" strokeWidth="1.2" strokeOpacity="0.25" />
      {/* 外側ノード */}
      <circle cx="14" cy="16" r="5" fill="url(#synapseGrad)" opacity="0.7" />
      <circle cx="50" cy="16" r="5" fill="url(#synapseGrad)" opacity="0.7" />
      <circle cx="10" cy="44" r="4" fill="url(#synapseGrad)" opacity="0.55" />
      <circle cx="54" cy="44" r="4" fill="url(#synapseGrad)" opacity="0.55" />
      <circle cx="32" cy="54" r="4" fill="url(#synapseGrad)" opacity="0.55" />
      {/* 中心ノード */}
      <circle cx="32" cy="32" r="9" fill="url(#synapseGrad)" />
      <circle cx="32" cy="32" r="5" fill="white" opacity="0.9" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}
