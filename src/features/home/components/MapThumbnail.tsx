import { useMemo } from 'react'
import type { Edge, Node } from '@xyflow/react'
import type { AnyNodeData, MapType } from '../../mindmap/store/mindmapStore'
import { COLOR_MAP } from '../../mindmap/components/MindmapNode'
import { computeThumbnailLayout } from '../utils/thumbnailLayout'

interface Props {
  nodes: Node<AnyNodeData>[]
  edges: Edge[]
  mapType?: MapType
}

export function MapThumbnail({ nodes, edges, mapType }: Props) {
  const { viewBoxWidth, viewBoxHeight, boxes, lines } = useMemo(
    () => computeThumbnailLayout(nodes, edges, mapType),
    [nodes, edges, mapType]
  )

  if (boxes.length === 0) {
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}>
        <rect
          x={viewBoxWidth / 2 - 40}
          y={viewBoxHeight / 2 - 16}
          width={80}
          height={32}
          rx={8}
          fill="none"
          stroke="rgba(148,163,184,0.4)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />
      </svg>
    )
  }

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#c4b5fd" strokeWidth={1} />
      ))}
      {boxes.map((b) => (
        <rect
          key={b.id}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          rx={b.isCircle ? b.w / 2 : mapType === 'free' ? b.h / 2 : Math.min(b.w, b.h) * 0.35}
          fill={COLOR_MAP[b.color].bg}
          stroke={COLOR_MAP[b.color].border}
          strokeWidth={1}
        />
      ))}
    </svg>
  )
}
