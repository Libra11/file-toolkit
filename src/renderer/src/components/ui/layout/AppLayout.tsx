import { ReactNode, useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Blocks,
  ChevronRight,
  FileBox,
  Languages,
  LayoutDashboard,
  Moon,
  Search,
  Settings2,
  SlidersHorizontal,
  Star,
  Sun,
  Minus,
  X
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@renderer/lib/utils'
import { toolDefinitions, toolGroups, toolMap, type ToolId } from '@renderer/lib/toolRegistry'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { SettingsMenu } from '@renderer/components/SettingsMenu'
import { useSettings } from '@renderer/hooks/useSettings'

interface AppLayoutProps {
  children: ReactNode
  activeTool: ToolId | null
  onSelectTool: (tool: ToolId | null) => void
  favorites: ToolId[]
  onEditFavorites: () => void
  searchOpen: boolean
  onSearchOpenChange: (open: boolean) => void
  onVersionClick?: () => void
}

const chromeButton =
  'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40'

export default function AppLayout({
  children,
  activeTool,
  onSelectTool,
  favorites,
  onEditFavorites,
  searchOpen,
  onSearchOpenChange,
  onVersionClick
}: AppLayoutProps): JSX.Element {
  const { t } = useTranslation()
  const { settings, updateSettings } = useSettings()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [version, setVersion] = useState('')
  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  useEffect(() => {
    window.system
      .getAppVersion()
      .then(setVersion)
      .catch(() => setVersion('—'))
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.isComposing || event.keyCode === 229) return
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (searchOpen) {
          onSearchOpenChange(false)
        } else if (!document.querySelector('[role="dialog"][data-state="open"]')) {
          onSearchOpenChange(true)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return (): void => window.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen, onSearchOpenChange])

  useEffect(() => {
    if (searchOpen) {
      setQuery('')
      setHighlightedIndex(0)
    }
  }, [searchOpen])

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    if (!normalized) return toolDefinitions
    return toolDefinitions.filter((tool) =>
      `${t(tool.titleKey)} ${t(tool.descriptionKey)}`.toLocaleLowerCase().includes(normalized)
    )
  }, [query, t])

  const activeOptionId = searchResults[highlightedIndex]
    ? `tool-search-option-${searchResults[highlightedIndex].id}`
    : undefined

  useEffect(() => {
    if (!searchOpen || !activeOptionId) return
    document.getElementById(activeOptionId)?.scrollIntoView({ block: 'nearest' })
  }, [activeOptionId, searchOpen])

  const openTool = (id: ToolId): void => {
    onSelectTool(id)
    onSearchOpenChange(false)
  }

  const toggleLanguage = (): void => {
    updateSettings({ language: settings.language === 'en' ? 'zh' : 'en' })
  }

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (
      event.nativeEvent.isComposing ||
      event.nativeEvent.keyCode === 229 ||
      searchResults.length === 0
    ) {
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((current) => Math.min(current + 1, searchResults.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex((current) => Math.max(current - 1, 0))
    } else if (event.key === 'Enter' && searchResults[highlightedIndex]) {
      event.preventDefault()
      openTool(searchResults[highlightedIndex].id)
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <header
        className="relative z-40 flex h-[52px] shrink-0 items-center border-b border-border bg-card"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <button
          type="button"
          onClick={() => onSelectTool(null)}
          aria-label={`${t('appName')} · ${t('workspace')}`}
          title={t('workspace')}
          className="flex h-full w-60 shrink-0 items-center gap-2.5 border-r border-border px-5 text-left max-lg:w-[72px] max-lg:justify-center max-lg:px-0"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <FileBox className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <span className="min-w-0 max-lg:hidden">
            <span className="block truncate text-[13px] font-semibold tracking-[-0.01em]">
              {t('appName')}
            </span>
            <span className="mt-0.5 block text-[8px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t('workspace')}
            </span>
          </span>
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2 px-4 text-xs sm:px-5">
          <button
            type="button"
            onClick={() => onSelectTool(null)}
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            {t('workspace')}
          </button>
          {activeTool && (
            <>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
              <span className="truncate font-medium">{t(toolMap[activeTool].titleKey)}</span>
            </>
          )}
        </div>

        <div
          className="flex shrink-0 items-center gap-1 px-3"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            type="button"
            onClick={toggleLanguage}
            className={chromeButton}
            title={t('toggleLanguage')}
            aria-label={t('toggleLanguage')}
          >
            <Languages className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => updateSettings({ isDarkMode: !settings.isDarkMode })}
            className={chromeButton}
            title={t('darkMode')}
            aria-label={t('darkMode')}
          >
            {settings.isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <span className="mx-1.5 h-4 w-px bg-border" />
          <button
            type="button"
            onClick={() => window.system.minimizeWindow()}
            className={chromeButton}
            title={t('minimize')}
            aria-label={t('minimize')}
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => window.system.closeWindow()}
            className={cn(chromeButton, 'hover:bg-destructive hover:text-destructive-foreground')}
            title={t('close')}
            aria-label={t('close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-60 shrink-0 flex-col border-r border-white/[0.06] bg-[#1c2420] text-white/70 max-lg:w-[72px]">
          <div className="p-3 max-lg:px-2.5">
            <button
              type="button"
              onClick={() => onSearchOpenChange(true)}
              className="flex h-9 w-full items-center gap-2.5 rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs text-white/45 transition-colors hover:bg-white/[0.08] hover:text-white/80 max-lg:justify-center max-lg:px-0"
              title={t('searchTools')}
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-left max-lg:hidden">
                {t('searchTools')}
              </span>
              <kbd className="font-sans text-[10px] text-white/30 max-lg:hidden">⌘K</kbd>
            </button>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 max-lg:px-2.5">
            <button
              type="button"
              onClick={() => onSelectTool(null)}
              className={cn(
                'mb-4 flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-xs font-medium transition-colors hover:bg-white/[0.06] hover:text-white max-lg:justify-center max-lg:px-0',
                !activeTool && 'bg-white/[0.09] text-white'
              )}
              title={t('workspace')}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" strokeWidth={1.7} />
              <span className="max-lg:hidden">{t('workspace')}</span>
            </button>

            <div className="mb-5">
              <div className="mb-1.5 flex h-6 items-center justify-between px-2.5 max-lg:justify-center max-lg:px-0">
                <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/35 max-lg:hidden">
                  {t('frequentTools')}
                </span>
                <Star className="hidden h-3 w-3 text-white/35 max-lg:block" />
                <button
                  type="button"
                  onClick={onEditFavorites}
                  className="text-white/35 transition-colors hover:text-white max-lg:hidden"
                  title={t('customize')}
                >
                  <SlidersHorizontal className="h-3 w-3" />
                </button>
              </div>
              {favorites.map((id) => {
                const tool = toolMap[id]
                const Icon = tool.icon
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelectTool(id)}
                    className={cn(
                      'flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-xs transition-colors hover:bg-white/[0.06] hover:text-white max-lg:justify-center max-lg:px-0',
                      activeTool === id && 'bg-white/[0.09] text-white'
                    )}
                    title={t(tool.titleKey)}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.7} />
                    <span className="truncate max-lg:hidden">{t(tool.titleKey)}</span>
                  </button>
                )
              })}
              <button
                type="button"
                onClick={onEditFavorites}
                className="mt-1 hidden h-8 w-full items-center justify-center rounded-md text-white/35 hover:bg-white/[0.06] hover:text-white max-lg:flex"
                title={t('customize')}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </button>
            </div>

            {toolGroups.map((group) => (
              <div key={group.id} className="mb-4">
                <div className="mb-1.5 flex h-6 items-center gap-2 px-2.5 max-lg:justify-center max-lg:px-0">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/35 max-lg:hidden">
                    {t(group.labelKey)}
                  </span>
                  <span className="hidden h-px w-5 bg-white/15 max-lg:block" />
                </div>
                {toolDefinitions
                  .filter((tool) => tool.group === group.id)
                  .map((tool) => {
                    const Icon = tool.icon
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => onSelectTool(tool.id)}
                        className={cn(
                          'group relative flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-xs transition-colors hover:bg-white/[0.06] hover:text-white max-lg:justify-center max-lg:px-0',
                          activeTool === tool.id && 'bg-white/[0.1] text-white'
                        )}
                        title={t(tool.titleKey)}
                      >
                        {activeTool === tool.id && (
                          <span className="absolute left-0 h-4 w-0.5 rounded-r bg-[#a3ccb6]" />
                        )}
                        <Icon
                          className="h-4 w-4 shrink-0 opacity-75 group-hover:opacity-100"
                          strokeWidth={1.7}
                        />
                        <span className="truncate max-lg:hidden">{t(tool.titleKey)}</span>
                      </button>
                    )
                  })}
              </div>
            ))}
          </nav>

          <div className="border-t border-white/[0.07] p-3 max-lg:px-2.5">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-[11px] text-white/50 transition-colors hover:bg-white/[0.05] hover:text-white/80 max-lg:justify-center max-lg:px-0"
              title={t('settings')}
            >
              <Settings2 className="h-3.5 w-3.5 shrink-0" />
              <span className="max-lg:hidden">{t('settings')}</span>
            </button>
            <button
              type="button"
              onClick={onVersionClick}
              className="flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-[11px] text-white/35 transition-colors hover:bg-white/[0.05] hover:text-white/70 max-lg:justify-center max-lg:px-0"
              title={t('clickToViewChangelog')}
            >
              <Blocks className="h-3.5 w-3.5 shrink-0" />
              <span className="max-lg:hidden">
                v{version || '…'} · {t('changelog')}
              </span>
            </button>
          </div>
        </aside>

        <main
          id="workspace-scroll"
          className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-background"
        >
          {children}
        </main>
      </div>

      <Dialog open={searchOpen} onOpenChange={onSearchOpenChange}>
        <DialogContent
          className="top-[16%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0"
          hideClose
        >
          <DialogTitle className="sr-only">{t('searchTools')}</DialogTitle>
          <DialogDescription className="sr-only">{t('searchToolsDescription')}</DialogDescription>
          <div className="flex h-14 items-center gap-3 border-b border-border px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={searchOpen}
              aria-controls="tool-search-listbox"
              aria-activedescendant={activeOptionId}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setHighlightedIndex(0)
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder={t('searchTools')}
              className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </div>
          <div
            id="tool-search-listbox"
            role="listbox"
            aria-label={t('searchTools')}
            className="max-h-[55vh] overflow-y-auto p-2"
          >
            {searchResults.map((tool, index) => {
              const Icon = tool.icon
              return (
                <button
                  key={tool.id}
                  id={`tool-search-option-${tool.id}`}
                  type="button"
                  role="option"
                  aria-selected={index === highlightedIndex}
                  tabIndex={-1}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => openTool(tool.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition-colors',
                    index === highlightedIndex ? 'bg-accent' : 'hover:bg-muted'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.7} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-foreground">
                      {t(tool.titleKey)}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                      {t(tool.descriptionKey)}
                    </span>
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>
              )
            })}
            {searchResults.length === 0 && (
              <p className="px-4 py-10 text-center text-xs text-muted-foreground">
                {t('noToolsFoundDescription')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4 border-t border-border bg-muted/40 px-4 py-2.5 text-[10px] text-muted-foreground">
            <span>↑↓ {t('navigate')}</span>
            <span>↵ {t('openTool')}</span>
            <span className="ml-auto">{t('toolsCount', { count: searchResults.length })}</span>
          </div>
        </DialogContent>
      </Dialog>
      <SettingsMenu open={settingsOpen} onOpenChange={setSettingsOpen} trigger={null} />
    </div>
  )
}
