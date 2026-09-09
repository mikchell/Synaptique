import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useIsMobile } from '../../../hooks/useIsMobile'
import { useMindmapStore } from '../store/mindmapStore'

const TUTORIAL_KEY = 'synaptique_tutorial_done'

const STEPS = [
  {
    title: '① 子ノードを追加する',
    description: 'ノードにカーソルを合わせると「＋」ボタンが現れます。クリックして子ノードを追加できます。',
    spotlight: { top: 'calc(50vh - 36px)', left: 'calc(50vw - 120px)', right: undefined, width: 240, height: 88, borderRadius: 24 },
    tooltip: { top: 'calc(50vh + 68px)', left: '50%', right: undefined, transform: 'translateX(-50%)' },
  },
  {
    title: '② テキストを編集する',
    description: 'ノードをダブルクリックするとテキストを編集できます。Enterキーで確定します。',
    spotlight: { top: 'calc(50vh - 36px)', left: 'calc(50vw - 120px)', right: undefined, width: 240, height: 88, borderRadius: 24 },
    tooltip: { top: 'calc(50vh + 68px)', left: '50%', right: undefined, transform: 'translateX(-50%)' },
  },
  {
    title: '③ 色とメモを設定する',
    description: 'ノードを選択すると右側にパネルが開きます。色の変更やメモの入力ができます。',
    spotlight: { top: 'calc(50vh - 80px)', left: undefined, right: '24px', width: 160, height: 400, borderRadius: 18 },
    tooltip: { top: 'calc(50vh - 100px)', left: undefined, right: '200px', transform: undefined },
  },
  {
    title: '④ レイアウトを整頓する',
    description: 'ノードが増えて散らかったら、左下のツールバーで整頓できます。ワンクリックで自動的にきれいに並べ直します。',
    spotlight: { top: 'calc(100vh - 264px)', left: '32px', right: undefined, width: 52, height: 172, borderRadius: 14 },
    tooltip: { top: 'calc(100vh - 300px)', left: '96px', right: undefined, transform: undefined },
  },
]

export function Tutorial() {
  const isMobile = useIsMobile()
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)
  const templateModalOpen = useMindmapStore((s) => s.templateModalOpen)

  useEffect(() => {
    if (!isMobile && !localStorage.getItem(TUTORIAL_KEY)) {
      setVisible(true)
    }
  }, [isMobile])

  // テンプレート選択モーダルが開いている間はチュートリアルを表示しない
  if (isMobile || templateModalOpen) return null

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
    } else {
      handleDone()
    }
  }

  const handleDone = () => {
    localStorage.setItem(TUTORIAL_KEY, '1')
    setVisible(false)
  }

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* スポットライト */}
          <motion.div
            key={`spotlight-${step}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'fixed',
              top: current.spotlight.top,
              left: current.spotlight.left,
              right: current.spotlight.right,
              width: current.spotlight.width,
              height: current.spotlight.height,
              borderRadius: current.spotlight.borderRadius,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
              zIndex: 1000,
              pointerEvents: 'none',
            }}
          />

          {/* ツールチップカード */}
          <motion.div
            key={`tooltip-${step}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: current.tooltip.top,
              left: current.tooltip.left,
              right: current.tooltip.right,
              transform: current.tooltip.transform,
              zIndex: 1001,
              background: 'white',
              borderRadius: 16,
              padding: '20px 20px 16px',
              width: 260,
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
          >
            {/* スキップボタン */}
            <button
              onClick={handleDone}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                display: 'flex',
                padding: 4,
                borderRadius: 6,
              }}
              title="スキップ"
            >
              <X size={14} />
            </button>

            <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: '#1e1b4b' }}>
              {current.title}
            </p>

            <p style={{ margin: '0 0 16px', fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
              {current.description}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* ドットインジケーター */}
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: i === step ? 16 : 6,
                      height: 6,
                      borderRadius: 3,
                      background: i === step ? '#7c3aed' : '#e2e8f0',
                      transition: 'all 0.2s ease',
                    }}
                  />
                ))}
              </div>

              {/* 次へ / はじめる */}
              <button
                onClick={handleNext}
                style={{
                  background: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '7px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isLast ? 'はじめる' : '次へ →'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
