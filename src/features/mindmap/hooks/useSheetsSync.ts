import { useEffect, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { useMindmapStore } from '../store/mindmapStore'
import {
  fetchSheets,
  upsertSheet,
  upsertSheetsBatch,
  deleteSheetFromDb,
} from '../../../lib/sheetsApi'

const NODE_DEBOUNCE_MS = 1000   // ノード・エッジ変更の保存間隔
const SHEET_DEBOUNCE_MS = 2000  // シートメタ変更の保存間隔

export function useSheetsSync(user: User | null) {
  const loadSheets = useMindmapStore((s) => s.loadSheets)
  const setIsSaving = useMindmapStore((s) => s.setIsSaving)
  const nodes = useMindmapStore((s) => s.nodes)
  const edges = useMindmapStore((s) => s.edges)
  const sheets = useMindmapStore((s) => s.sheets)

  const initializedRef = useRef(false)
  const prevSheetIdsRef = useRef<string[]>([])
  const nodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sheetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ログイン時にSupabaseからシートを読み込む
  useEffect(() => {
    if (!user) {
      initializedRef.current = false
      prevSheetIdsRef.current = []
      return
    }

    fetchSheets()
      .then((fetched) => {
        if (fetched.length > 0) {
          loadSheets(fetched)
          prevSheetIdsRef.current = fetched.map((s) => s.id)
        } else {
          // DBが空ならlocalStorageの初期データをDBに保存
          const { sheets: local, nodes: n, edges: e, currentSheetId } = useMindmapStore.getState()
          const toSave = local.map((s) =>
            s.id === currentSheetId ? { ...s, nodes: n, edges: e } : s
          )
          prevSheetIdsRef.current = toSave.map((s) => s.id)
          upsertSheetsBatch(toSave).catch(() => toast.error('シートの保存に失敗しました'))
        }
        initializedRef.current = true
      })
      .catch(() => toast.error('シートの読み込みに失敗しました'))
  }, [user?.id])

  // ノード・エッジ変更時：現在のシートをDebounce保存
  useEffect(() => {
    if (!initializedRef.current) return

    const { sheets: s, currentSheetId } = useMindmapStore.getState()
    const currentSheet = s.find((sh) => sh.id === currentSheetId)
    if (!currentSheet) return

    setIsSaving(true)
    if (nodeTimerRef.current) clearTimeout(nodeTimerRef.current)
    nodeTimerRef.current = setTimeout(() => {
      upsertSheet({ ...currentSheet, nodes, edges })
        .then(() => setIsSaving(false))
        .catch(() => { setIsSaving(false); toast.error('変更の保存に失敗しました') })
    }, NODE_DEBOUNCE_MS)

    return () => {
      if (nodeTimerRef.current) clearTimeout(nodeTimerRef.current)
    }
  }, [nodes, edges])

  // シートの追加・削除・リネームを検知してDBに反映
  const sheetKey = sheets.map((s) => s.id + s.name).join(',')
  useEffect(() => {
    if (!initializedRef.current) return

    const { nodes: n, edges: e, currentSheetId } = useMindmapStore.getState()
    const currentIds = sheets.map((s) => s.id)
    const prevIds = prevSheetIdsRef.current

    // 削除されたシートをDBから削除
    const deletedIds = prevIds.filter((id) => !currentIds.includes(id))
    deletedIds.forEach((id) => deleteSheetFromDb(id).catch(() => toast.error('シートの削除に失敗しました')))

    // 追加・更新されたシートをDebounceで保存
    setIsSaving(true)
    if (sheetTimerRef.current) clearTimeout(sheetTimerRef.current)
    sheetTimerRef.current = setTimeout(() => {
      const updated = sheets.map((s) =>
        s.id === currentSheetId ? { ...s, nodes: n, edges: e } : s
      )
      upsertSheetsBatch(updated)
        .then(() => setIsSaving(false))
        .catch(() => { setIsSaving(false); toast.error('シートの保存に失敗しました') })
    }, SHEET_DEBOUNCE_MS)

    prevSheetIdsRef.current = currentIds

    return () => {
      if (sheetTimerRef.current) clearTimeout(sheetTimerRef.current)
    }
  }, [sheetKey])
}
