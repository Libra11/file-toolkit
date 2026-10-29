import { useEffect, useState } from 'react'
import './assets/index.css'
import AppLayout from './components/ui/layout/AppLayout'
import HomePage from './components/HomePage'
import ToolWorkspace from './components/ToolWorkspace'
import FavoriteToolsDialog from './components/FavoriteToolsDialog'
import UpdateNotification from './components/UpdateNotification'
import ChangelogPopup, { useChangelogPopup } from './components/ChangelogPopup'
import RegionSelectionOverlay from './components/ScreenRecorderTool/RegionSelectionOverlay'
import {
  defaultFavoriteTools,
  legacyToolIds,
  toolDefinitions,
  type ToolId
} from './lib/toolRegistry'

const FAVORITES_KEY = 'fileToolkit.favoriteTools'

function loadFavorites(): ToolId[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY)
    if (!stored) return defaultFavoriteTools
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return defaultFavoriteTools
    return parsed.reduce<ToolId[]>((result, value) => {
      const id =
        typeof value === 'string' && toolDefinitions.some((tool) => tool.id === value)
          ? (value as ToolId)
          : typeof value === 'number'
            ? (legacyToolIds[value - 1] ?? null)
            : null
      if (id && !result.includes(id) && result.length < 6) result.push(id)
      return result
    }, [])
  } catch {
    return defaultFavoriteTools
  }
}

function App(): JSX.Element {
  const { isOpen, currentVersion, hideChangelog, checkForNewChangelog, showChangelog } =
    useChangelogPopup()
  const [activeTool, setActiveTool] = useState<ToolId | null>(null)
  const [favorites, setFavorites] = useState<ToolId[]>(loadFavorites)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const isRegionSelectionMode =
    new URLSearchParams(window.location.search).get('mode') === 'region-selection'

  useEffect(() => {
    checkForNewChangelog()
  }, [checkForNewChangelog])

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  }, [favorites])

  const selectTool = (id: ToolId | null): void => {
    setActiveTool(id)
    document.getElementById('workspace-scroll')?.scrollTo({ top: 0 })
  }

  const handleVersionClick = async (): Promise<void> => {
    try {
      showChangelog(await window.system.getAppVersion())
    } catch (error) {
      console.error('Failed to get version for changelog:', error)
    }
  }

  if (isRegionSelectionMode) return <RegionSelectionOverlay />

  return (
    <AppLayout
      activeTool={activeTool}
      onSelectTool={selectTool}
      favorites={favorites}
      onEditFavorites={() => setFavoritesOpen(true)}
      searchOpen={searchOpen}
      onSearchOpenChange={setSearchOpen}
      onVersionClick={handleVersionClick}
    >
      {activeTool ? (
        <ToolWorkspace toolId={activeTool} onBack={() => selectTool(null)} />
      ) : (
        <HomePage
          onSelectTool={selectTool}
          favorites={favorites}
          onOpenSearch={() => setSearchOpen(true)}
          onEditFavorites={() => setFavoritesOpen(true)}
        />
      )}
      <FavoriteToolsDialog
        open={favoritesOpen}
        onOpenChange={setFavoritesOpen}
        favorites={favorites}
        onSave={setFavorites}
      />
      <UpdateNotification />
      <ChangelogPopup isOpen={isOpen} onClose={hideChangelog} version={currentVersion} />
    </AppLayout>
  )
}

export default App
