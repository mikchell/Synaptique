import type { Edge, Node } from '@xyflow/react'
import type { AnyNodeData, MapType, MindmapNodeData, NodeColor } from '../../mindmap/store/mindmapStore'

const THUMB_W = 220
const THUMB_H = 140
const PAD = 10
const MAX_SCALE = 1.5

// MindmapNode.tsxのSIZE_MAP/paddingV計算を簡易再現した想定サイズ
// （実測値はキャンバスに描画されているシートでしか取れないため、ホーム画面のサムネイルでは概算値を使う）
const ROOT_W = 240
const NON_ROOT_W = 180
const ROOT_H = { linear: 76, free: 176 }
const NON_ROOT_H = { linear: 58, free: 130 }

export interface ThumbnailBox {
  id: string
  x: number
  y: number
  w: number
  h: number
  color: NodeColor
  isCircle: boolean
}

export interface ThumbnailLine {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface ThumbnailLayout {
  viewBoxWidth: number
  viewBoxHeight: number
  boxes: ThumbnailBox[]
  lines: ThumbnailLine[]
}

export function computeThumbnailLayout(
  rawNodes: Node<AnyNodeData>[],
  edges: Edge[],
  mapType: MapType = 'linear'
): ThumbnailLayout {
  const empty: ThumbnailLayout = { viewBoxWidth: THUMB_W, viewBoxHeight: THUMB_H, boxes: [], lines: [] }
  // 画像ノードはミニプレビューでは省略し、マインドマップのツリー部分のみ描画する
  const nodes = rawNodes.filter((n): n is Node<MindmapNodeData> => n.type === 'mindmapNode')
  if (nodes.length === 0) return empty

  const heightKey = mapType === 'free' ? 'free' : 'linear'

  const sizeOf = (n: Node<MindmapNodeData>) => {
    const styleW = typeof n.style?.width === 'number' ? n.style.width : undefined
    const styleH = typeof n.style?.height === 'number' ? n.style.height : undefined
    const fallbackW = n.data.isRoot ? ROOT_W : NON_ROOT_W
    const fallbackH = n.data.isRoot ? ROOT_H[heightKey] : NON_ROOT_H[heightKey]
    const w = n.width ?? styleW ?? fallbackW
    const h = n.height ?? styleH ?? (n.data.isCircle ? w : fallbackH)
    return { w, h }
  }

  // bounding box計算
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const n of nodes) {
    const { w, h } = sizeOf(n)
    minX = Math.min(minX, n.position.x)
    minY = Math.min(minY, n.position.y)
    maxX = Math.max(maxX, n.position.x + w)
    maxY = Math.max(maxY, n.position.y + h)
  }
  const contentW = Math.max(maxX - minX, 1)
  const contentH = Math.max(maxY - minY, 1)

  // 枠内に収まるスケール（拡大しすぎない）
  const scale = Math.min(
    (THUMB_W - PAD * 2) / contentW,
    (THUMB_H - PAD * 2) / contentH,
    MAX_SCALE
  )

  // 中央寄せオフセット
  const offsetX = (THUMB_W - contentW * scale) / 2 - minX * scale
  const offsetY = (THUMB_H - contentH * scale) / 2 - minY * scale

  const boxes: ThumbnailBox[] = nodes.map((n) => {
    const { w, h } = sizeOf(n)
    return {
      id: n.id,
      x: n.position.x * scale + offsetX,
      y: n.position.y * scale + offsetY,
      w: w * scale,
      h: h * scale,
      color: n.data.color,
      isCircle: !!n.data.isCircle,
    }
  })

  const boxById = new Map(boxes.map((b) => [b.id, b]))
  const centerOf = (b: ThumbnailBox) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 })

  const lines: ThumbnailLine[] = edges.flatMap((e) => {
    const s = boxById.get(e.source)
    const t = boxById.get(e.target)
    if (!s || !t) return []
    const cs = centerOf(s)
    const ct = centerOf(t)
    return [{ x1: cs.x, y1: cs.y, x2: ct.x, y2: ct.y }]
  })

  return { viewBoxWidth: THUMB_W, viewBoxHeight: THUMB_H, boxes, lines }
}
