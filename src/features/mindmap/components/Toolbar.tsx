import { motion } from 'framer-motion'
import { ImagePlus, Maximize2, RotateCcw, ZoomIn, ZoomOut, LayoutDashboard, ArrowLeftRight } from 'lucide-react'
import { useReactFlow } from '@xyflow/react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { useMindmapStore } from '../store/mindmapStore'
import { deleteNodeImages, getImagePaths, processAndUploadImage } from '../../../lib/imageApi'
import { ConfirmDialog } from './ConfirmDialog'

export function Toolbar() {
  const { zoomIn, zoomOut, fitView, screenToFlowPosition } = useReactFlow()
  const selectedCount = useMindmapStore((s) => s.nodes.filter((n) => n.selected).length)
  const resetMindmap = useMindmapStore((s) => s.resetMindmap)
  const tidyLayout = useMindmapStore((s) => s.tidyLayout)
  const tidySelectedLayout = useMindmapStore((s) => s.tidySelectedLayout)
  const toggleLayout = useMindmapStore((s) => s.toggleLayout)
  const addImageNode = useMindmapStore((s) => s.addImageNode)
  const hasSnapshot = useMindmapStore((s) => s.layoutSnapshot !== null)
  const isFree = useMindmapStore((s) => s.sheets.find((sh) => sh.id === s.currentSheetId)?.mapType === 'free')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [tidyConfirmOpen, setTidyConfirmOpen] = useState(false)
  const hasSelection = selectedCount >= 2
  const fileInputRef = useRef<HTMLInputElement>(null)

  // スマホなどペースト操作が無い環境向けの画像追加（クリップボード貼り付けと同じ処理を使う）
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const position = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    processAndUploadImage(file)
      .then(({ path, width, height }) => addImageNode(path, width, height, position))
      .catch((err) => toast.error(err instanceof Error ? err.message : '画像の追加に失敗しました'))
  }

  const handleTidyConfirm = () => {
    if (hasSelection) {
      tidySelectedLayout()
    } else {
      tidyLayout()
      setTimeout(() => fitView({ padding: 0.3, duration: 500 }), 50)
    }
    setTidyConfirmOpen(false)
  }

  const handleReset = () => {
    const imagePaths = getImagePaths(useMindmapStore.getState().nodes)
    resetMindmap()
    setConfirmOpen(false)
    if (imagePaths.length > 0) {
      deleteNodeImages(imagePaths).catch(() => {})
    }
  }

  const buttonStyle = {
    background: 'rgba(255,255,255,0.9)',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: 10,
    color: '#64748b',
    cursor: 'pointer',
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  }

  return (
    <>
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      style={{
        position: 'fixed',
        bottom: 32,
        left: 32,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 100,
      }}
    >
      {/* ズームコントロール */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.92)',
          border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: 14,
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          backdropFilter: 'blur(16px)',
        }}
      >
        <button
          style={buttonStyle}
          onClick={() => zoomIn()}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'rgba(124, 58, 237, 0.2)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#a78bfa'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor =
              'rgba(124, 58, 237, 0.4)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'rgba(255,255,255,0.9)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#64748b'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor =
              'rgba(0,0,0,0.1)'
          }}
          title="ズームイン"
        >
          <ZoomIn size={16} />
        </button>
        <button
          style={buttonStyle}
          onClick={() => zoomOut()}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'rgba(124, 58, 237, 0.2)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#a78bfa'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor =
              'rgba(124, 58, 237, 0.4)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'rgba(255,255,255,0.9)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#64748b'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor =
              'rgba(0,0,0,0.1)'
          }}
          title="ズームアウト"
        >
          <ZoomOut size={16} />
        </button>
        <button
          style={buttonStyle}
          onClick={() => fitView({ padding: 0.2, duration: 500 })}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'rgba(124, 58, 237, 0.2)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#a78bfa'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor =
              'rgba(124, 58, 237, 0.4)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'rgba(255,255,255,0.9)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#64748b'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor =
              'rgba(0,0,0,0.1)'
          }}
          title="全体表示"
        >
          <Maximize2 size={16} />
        </button>
        {!isFree && (
          <button
            style={buttonStyle}
            onClick={() => setTidyConfirmOpen(true)}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background =
                'rgba(124, 58, 237, 0.2)'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#a78bfa'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                'rgba(124, 58, 237, 0.4)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background =
                'rgba(255,255,255,0.9)'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#64748b'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                'rgba(0,0,0,0.1)'
            }}
            title={hasSelection ? `選択範囲を整頓 (${selectedCount}個)` : '整頓'}
          >
            <LayoutDashboard size={16} />
          </button>
        )}

        {/* 整頓↔元の配置トグル */}
        {!isFree && hasSnapshot && (
          <button
            style={buttonStyle}
            onClick={() => { toggleLayout(); setTimeout(() => fitView({ padding: 0.3, duration: 500 }), 50) }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(124, 58, 237, 0.2)'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#a78bfa'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(124, 58, 237, 0.4)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.9)'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#64748b'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,0,0,0.1)'
            }}
            title="整頓↔元の配置を切り替え"
          >
            <ArrowLeftRight size={16} />
          </button>
        )}

        {/* 画像を追加（クリップボード貼り付けが使えない環境向け） */}
        <button
          style={buttonStyle}
          onClick={() => fileInputRef.current?.click()}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(124, 58, 237, 0.2)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#a78bfa'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(124, 58, 237, 0.4)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.9)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#64748b'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,0,0,0.1)'
          }}
          title="画像を追加"
        >
          <ImagePlus size={16} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelected}
          style={{ display: 'none' }}
        />
      </div>

      {/* リセット */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.92)',
          border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: 14,
          padding: 8,
          backdropFilter: 'blur(16px)',
        }}
      >
        <button
          style={buttonStyle}
          onClick={() => setConfirmOpen(true)}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'rgba(239, 68, 68, 0.15)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#f87171'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor =
              'rgba(239, 68, 68, 0.4)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'rgba(255,255,255,0.9)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#64748b'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor =
              'rgba(0,0,0,0.1)'
          }}
          title="リセット"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </motion.div>

    <ConfirmDialog
      open={tidyConfirmOpen}
      title={hasSelection ? '選択範囲を整頓' : 'レイアウトを整頓'}
      description={
        hasSelection
          ? `選択中の${selectedCount}個のノードのみ整列されます。`
          : 'ノードの位置が自動で整列されます。手動で調整した配置はリセットされます。'
      }
      confirmLabel="整頓する"
      onConfirm={handleTidyConfirm}
      onCancel={() => setTidyConfirmOpen(false)}
    />
    <ConfirmDialog
      open={confirmOpen}
      title="マインドマップをリセット"
      description="すべてのノードが削除され、最初の状態に戻ります。この操作は取り消せません。"
      confirmLabel="リセット"
      onConfirm={handleReset}
      onCancel={() => setConfirmOpen(false)}
    />
    </>
  )
}
