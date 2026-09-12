import { useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useMindmapStore } from '../../mindmap/store/mindmapStore'
import { Sidebar, type HomeSection } from './Sidebar'
import { TopBar, type TopBarVariant } from './TopBar'
import { MapGrid } from './MapGrid'
import { TemplatesSection } from './TemplatesSection'
import { TrashView } from './TrashView'
import {
  getActiveSheets,
  getRecentSheets,
  getStarredSheets,
  getTrashedSheets,
} from '../utils/sheetSelectors'

type StaticSection = Exclude<HomeSection, 'folder'>

const SECTION_TITLE: Record<StaticSection, string> = {
  recent: '最近使用した項目',
  all: 'すべてのマップ',
  starred: 'スター付き',
  templates: 'その他のテンプレート',
  trash: 'ゴミ箱',
}

const SECTION_EMPTY_MESSAGE: Record<StaticSection, string> = {
  recent: 'まだマップがありません',
  all: 'まだマップがありません',
  starred: 'スターしたマップはまだありません',
  templates: '',
  trash: 'ゴミ箱は空です',
}

const SECTION_TOPBAR_VARIANT: Record<StaticSection, TopBarVariant> = {
  recent: 'recent',
  all: 'library',
  starred: 'library',
  templates: 'templates',
  trash: 'trash',
}

export function HomeScreen() {
  const sheets = useMindmapStore(useShallow((s) => s.sheets))
  const folders = useMindmapStore(useShallow((s) => s.folders))
  const [section, setSection] = useState<HomeSection>('recent')
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<'updatedAt' | 'name'>('updatedAt')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const handleSectionChange = (next: HomeSection) => {
    setSection(next)
    setSelectedFolderId(null)
  }

  const handleSelectFolder = (folderId: string) => {
    setSection('folder')
    setSelectedFolderId(folderId)
  }

  const selectedFolder = folders.find((f) => f.id === selectedFolderId) ?? null

  const filteredSheets = useMemo(() => {
    const base =
      section === 'recent' ? getRecentSheets(sheets)
      : section === 'all' ? getActiveSheets(sheets)
      : section === 'starred' ? getStarredSheets(sheets)
      : section === 'trash' ? getTrashedSheets(sheets)
      : section === 'folder' ? getActiveSheets(sheets).filter((s) => s.folderId === selectedFolderId)
      : []

    const query = searchQuery.trim().toLowerCase()
    const filtered = query ? base.filter((s) => s.name.toLowerCase().includes(query)) : base

    // 最近使用した項目は常にlastOpenedAt降順のまま（ソートUIなし）
    if (section === 'recent') return filtered

    return [...filtered].sort((a, b) =>
      sortKey === 'name'
        ? a.name.localeCompare(b.name, 'ja')
        : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }, [sheets, section, selectedFolderId, searchQuery, sortKey])

  const title = section === 'folder' ? selectedFolder?.name ?? 'フォルダ' : SECTION_TITLE[section]
  const emptyMessage = section === 'folder' ? 'このフォルダにマップはありません' : SECTION_EMPTY_MESSAGE[section]
  const topBarVariant: TopBarVariant = section === 'folder' ? 'library' : SECTION_TOPBAR_VARIANT[section]

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#ffffff' }}>
      <Sidebar
        section={section}
        onSectionChange={handleSectionChange}
        selectedFolderId={selectedFolderId}
        onSelectFolder={handleSelectFolder}
      />

      <div style={{ flex: 1, minWidth: 0, height: '100vh', overflowY: 'auto', padding: '28px 40px' }}>
        <TopBar
          variant={topBarVariant}
          title={title}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortKey={sortKey}
          onSortChange={setSortKey}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {section === 'templates' ? (
          <TemplatesSection />
        ) : section === 'trash' ? (
          <TrashView sheets={filteredSheets} viewMode={viewMode} />
        ) : (
          <MapGrid
            sheets={filteredSheets}
            viewMode={viewMode}
            variant="normal"
            emptyMessage={emptyMessage}
          />
        )}
      </div>
    </div>
  )
}
