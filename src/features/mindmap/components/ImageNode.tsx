import { NodeResizeControl, type Node, type NodeProps } from '@xyflow/react'
import { Loader2, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { deleteNodeImage, getNodeImageSignedUrl } from '../../../lib/imageApi'
import { type ImageNodeData, useMindmapStore } from '../store/mindmapStore'

export function ImageNode({ id, data, selected }: NodeProps<Node<ImageNodeData>>) {
  const { deleteNode } = useMindmapStore(
    useShallow((s) => ({ deleteNode: s.deleteNode }))
  )
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setUrl(null)
    setFailed(false)
    getNodeImageSignedUrl(data.path)
      .then((signedUrl) => { if (!cancelled) setUrl(signedUrl) })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [data.path])

  const handleDelete = () => {
    deleteNode(id)
    deleteNodeImage(data.path).catch(() => {})
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        background: '#f1f5f9',
        border: selected ? '2px solid #7c3aed' : '1px solid rgba(0,0,0,0.08)',
        boxShadow: selected ? '0 0 24px rgba(124,58,237,0.25)' : '0 2px 8px rgba(0,0,0,0.08)',
        position: 'relative',
      }}
    >
      {url && (
        <img
          src={url}
          alt="貼り付けた画像"
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />
      )}

      {!url && !failed && (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={20} color="#94a3b8" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {failed && (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#94a3b8' }}>
          画像を読み込めませんでした
        </div>
      )}

      {selected && (['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((pos) => (
        <NodeResizeControl
          key={pos}
          position={pos}
          keepAspectRatio
          minWidth={60}
          minHeight={60}
          style={{
            width: 10, height: 10,
            borderRadius: '50%',
            background: 'white',
            border: '2px solid #7c3aed',
            boxShadow: '0 1px 4px rgba(124,58,237,0.3)',
          }}
        />
      ))}

      {selected && (
        <button
          onClick={(e) => { e.stopPropagation(); handleDelete() }}
          title="削除"
          style={{
            position: 'absolute', top: 6, right: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 24, height: 24, borderRadius: '50%',
            border: 'none', background: 'rgba(255,255,255,0.95)',
            color: '#ef4444', cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }}
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  )
}
