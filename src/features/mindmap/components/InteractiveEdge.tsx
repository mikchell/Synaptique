import { BaseEdge, EdgeLabelRenderer, type EdgeProps, getBezierPath, getStraightPath, useInternalNode } from '@xyflow/react'
import { Plus } from 'lucide-react'
import { memo, useRef, useState } from 'react'
import { useMindmapStore } from '../store/mindmapStore'

// 中心から対象方向への射線と楕円の正確な交点を計算
// 旧実装(cos/sin)はパラメトリック点で方向がズレるため射線交点式に修正
function ellipseBorderPoint(
  cx: number, cy: number,
  rx: number, ry: number,
  toX: number, toY: number
): { x: number; y: number } {
  const dx = toX - cx
  const dy = toY - cy
  if (dx === 0 && dy === 0) return { x: cx + rx, y: cy }
  // t = 1 / sqrt((dx/rx)² + (dy/ry)²)  →  交点 = (cx + t·dx, cy + t·dy)
  const t = 1 / Math.sqrt((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry))
  return { x: cx + dx * t, y: cy + dy * t }
}

function InteractiveEdgeComponent({
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
  const insertNodeBetween = useMindmapStore((s) => s.insertNodeBetween)
  const isFree = useMindmapStore((s) =>
    s.sheets.find((sh) => sh.id === s.currentSheetId)?.mapType === 'free'
  )

  // ハンドル種別に依存せずpositionAbsoluteからノード中心を計算
  // → ドラッグ中もtargetX/Yプロップ変化でエッジが再描画される
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)

  let sx = sourceX, sy = sourceY, tx = targetX, ty = targetY

  if (isFree && sourceNode && targetNode) {
    const srcW = sourceNode.measured?.width ?? 200
    const srcH = sourceNode.measured?.height ?? 60
    const srcCX = sourceNode.internals.positionAbsolute.x + srcW / 2
    const srcCY = sourceNode.internals.positionAbsolute.y + srcH / 2

    const tgtW = targetNode.measured?.width ?? 200
    const tgtH = targetNode.measured?.height ?? 60
    const tgtCX = targetNode.internals.positionAbsolute.x + tgtW / 2
    const tgtCY = targetNode.internals.positionAbsolute.y + tgtH / 2

    const srcPt = ellipseBorderPoint(srcCX, srcCY, srcW / 2, srcH / 2, tgtCX, tgtCY)
    const tgtPt = ellipseBorderPoint(tgtCX, tgtCY, tgtW / 2, tgtH / 2, srcCX, srcCY)

    sx = srcPt.x; sy = srcPt.y
    tx = tgtPt.x; ty = tgtPt.y
  }

  const [edgePath, labelX, labelY] = isFree
    ? getStraightPath({ sourceX: sx, sourceY: sy, targetX: tx, targetY: ty })
    : getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })

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

export const InteractiveEdge = memo(InteractiveEdgeComponent)
