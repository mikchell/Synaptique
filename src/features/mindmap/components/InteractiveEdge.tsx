import { BaseEdge, EdgeLabelRenderer, type EdgeProps, getBezierPath } from '@xyflow/react'
import { Plus } from 'lucide-react'
import { useRef, useState } from 'react'
import { useMindmapStore } from '../store/mindmapStore'

export function InteractiveEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  sourceHandleId,
  targetHandleId,
  style,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { insertNodeBetween } = useMindmapStore()

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const handleEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    setHovered(true)
  }

  const handleLeave = () => {
    leaveTimer.current = setTimeout(() => setHovered(false), 100)
  }

  const handleInsert = () => {
    setHovered(false)
    insertNodeBetween(
      source,
      target,
      id,
      sourceHandleId ?? 'right',
      targetHandleId ?? 'left',
    )
  }

  return (
    <>
      {/* pointerEvents: none でクリックを透過させ、下の広いパスに渡す */}
      <BaseEdge path={edgePath} style={{ ...style, pointerEvents: 'none' }} />
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{ cursor: 'pointer' }}
      />
      <EdgeLabelRenderer>
        {hovered && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              zIndex: 10,
              padding: 8,
            }}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
          >
            <button
              onClick={handleInsert}
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#ffffff',
                border: '1.5px solid rgba(124, 58, 237, 0.5)',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                padding: 0,
                opacity: 0.7,
              }}
            >
              <Plus size={12} />
            </button>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  )
}
