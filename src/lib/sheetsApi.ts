import { supabase } from './supabase'
import type { Sheet } from '../features/mindmap/store/mindmapStore'

interface DbSheetMeta {
  id: string
  name: string
}

interface DbSheet extends DbSheetMeta {
  data: { nodes: Sheet['nodes']; edges: Sheet['edges'] }
}

// シートのメタデータのみ取得（軽量）
export async function fetchSheetsMeta(): Promise<Pick<Sheet, 'id' | 'name'>[]> {
  const { data, error } = await supabase
    .from('sheets')
    .select('id, name')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as DbSheetMeta[]
}

// 特定シートのデータ（nodes/edges）を取得
export async function fetchSheetData(
  id: string
): Promise<Pick<Sheet, 'nodes' | 'edges'>> {
  const { data, error } = await supabase
    .from('sheets')
    .select('data')
    .eq('id', id)
    .single()

  if (error) throw error
  const d = (data as { data: DbSheet['data'] }).data
  return { nodes: d.nodes ?? [], edges: d.edges ?? [] }
}

// 全シートをまとめて取得（初回ロード用）
export async function fetchSheets(): Promise<Sheet[]> {
  const { data, error } = await supabase
    .from('sheets')
    .select('id, name, data')
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data as DbSheet[]).map((s) => ({
    id: s.id,
    name: s.name,
    nodes: s.data?.nodes ?? [],
    edges: s.data?.edges ?? [],
  }))
}

// 単一シートをupsert（user_idはDBトリガーでauth.uid()を自動セット）
export async function upsertSheet(sheet: Sheet): Promise<void> {
  const { error } = await supabase.from('sheets').upsert(
    {
      id: sheet.id,
      name: sheet.name,
      data: { nodes: sheet.nodes, edges: sheet.edges },
    },
    { onConflict: 'id' }
  )
  if (error) throw error
}

// 複数シートをバッチupsert（5件ずつ並列処理）
export async function upsertSheetsBatch(sheets: Sheet[]): Promise<void> {
  const BATCH_SIZE = 5
  for (let i = 0; i < sheets.length; i += BATCH_SIZE) {
    const batch = sheets.slice(i, i + BATCH_SIZE)
    await Promise.all(batch.map((s) => upsertSheet(s)))
  }
}

export async function deleteSheetFromDb(id: string): Promise<void> {
  const { error } = await supabase.from('sheets').delete().eq('id', id)
  if (error) throw error
}
