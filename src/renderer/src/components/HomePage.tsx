import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  FileInput,
  FileOutput,
  Search,
  SlidersHorizontal,
  Star
} from 'lucide-react'
import {
  toolDefinitions,
  toolGroups,
  toolMap,
  type ToolGroup,
  type ToolId
} from '@renderer/lib/toolRegistry'
import { cn } from '@renderer/lib/utils'
import { Panel } from '@renderer/components/ui/panel'
import { Button } from '@renderer/components/ui/button'
import { SegmentedControl } from '@renderer/components/ui/segmented-control'
import { EmptyState } from '@renderer/components/ui/states'

interface HomePageProps {
  onSelectTool: (id: ToolId) => void
  favorites: ToolId[]
  onOpenSearch: () => void
  onEditFavorites: () => void
}

type Filter = 'all' | ToolGroup

export default function HomePage({
  onSelectTool,
  favorites,
  onOpenSearch,
  onEditFavorites
}: HomePageProps): JSX.Element {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const visibleTools = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    return toolDefinitions.filter((tool) => {
      if (filter !== 'all' && tool.group !== filter) return false
      return (
        !normalized ||
        `${t(tool.titleKey)} ${t(tool.descriptionKey)}`.toLocaleLowerCase().includes(normalized)
      )
    })
  }, [filter, query, t])

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-7 lg:px-9 lg:py-9">
      <section className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-7">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {t('workspaceEyebrow')}
          </div>
          <h1 className="max-w-2xl text-[28px] font-semibold leading-[1.2] tracking-[-0.04em] text-foreground sm:text-[34px]">
            {t('workspaceWelcome')}
          </h1>
          <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
            {t('workspaceIntro')}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenSearch}
          className="group flex h-10 items-center gap-3 rounded-md border border-border bg-card px-3 text-xs text-muted-foreground shadow-sm transition-colors hover:border-input hover:text-foreground"
        >
          <Search className="h-3.5 w-3.5" />
          <span>{t('findTool')}</span>
          <kbd className="ml-3 rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[10px]">
            ⌘ K
          </kbd>
        </button>
      </section>

      <section className="mt-7 grid gap-4 md:grid-cols-2" aria-label={t('quickStart')}>
        <button
          type="button"
          onClick={() => onSelectTool('conversion')}
          className="group relative overflow-hidden rounded-lg border border-primary/20 bg-accent/65 p-5 text-left transition-colors hover:border-primary/45 hover:bg-accent sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/15 bg-card text-primary">
              <FileOutput className="h-5 w-5" strokeWidth={1.6} />
            </span>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
          </div>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
            01 / {t('coreTools')}
          </p>
          <h2 className="mt-1.5 text-lg font-semibold tracking-[-0.02em]">{t('fileConversion')}</h2>
          <p className="mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">
            {t('fileConversionDescription')}
          </p>
          <div className="mt-5 flex items-center gap-2 text-[10px] font-medium tracking-wide text-muted-foreground">
            {['JPG', 'PNG', 'WEBP', 'MP4', 'MP3'].map((format) => (
              <span key={format} className="border-r border-primary/15 pr-2 last:border-0">
                {format}
              </span>
            ))}
          </div>
        </button>
        <button
          type="button"
          onClick={() => onSelectTool('compression')}
          className="group rounded-lg border border-border bg-card p-5 text-left transition-colors hover:border-primary/35 hover:bg-accent/30 sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted/60 text-foreground">
              <FileInput className="h-5 w-5" strokeWidth={1.6} />
            </span>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
          </div>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            02 / {t('coreTools')}
          </p>
          <h2 className="mt-1.5 text-lg font-semibold tracking-[-0.02em]">
            {t('fileCompression')}
          </h2>
          <p className="mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">
            {t('fileCompressionDescription')}
          </p>
          <div className="mt-5 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {[t('image'), t('audio'), t('video')].map((format) => (
              <span key={format} className="border-r border-border pr-2 last:border-0">
                {format}
              </span>
            ))}
          </div>
        </button>
      </section>

      <section className="mt-9">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Star className="h-3.5 w-3.5 text-muted-foreground" />
              {t('frequentTools')}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">{t('frequentToolsSubtitle')}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onEditFavorites}>
            <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
            {t('customize')}
          </Button>
        </div>
        {favorites.length > 0 ? (
          <div className="grid overflow-hidden rounded-lg border border-border bg-card md:grid-cols-3">
            {favorites.slice(0, 3).map((id, index) => {
              const tool = toolMap[id]
              const Icon = tool.icon
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectTool(id)}
                  className={cn(
                    'group flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/55',
                    index > 0 && 'border-t border-border md:border-l md:border-t-0'
                  )}
                >
                  <Icon
                    className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary"
                    strokeWidth={1.7}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium">{t(tool.titleKey)}</span>
                    <span className="mt-1 block truncate text-[11px] text-muted-foreground">
                      {t(tool.descriptionKey)}
                    </span>
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                </button>
              )
            })}
          </div>
        ) : (
          <EmptyState
            icon={Star}
            title={t('noFrequentToolsSelected')}
            description={t('noFrequentToolsSelectedDescription')}
            action={
              <Button variant="outline" size="sm" onClick={onEditFavorites}>
                {t('customize')}
              </Button>
            }
          />
        )}
      </section>

      <section id="tool-library" className="mt-9 pb-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-[-0.02em]">{t('allTools')}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t('libraryDescription')}</p>
          </div>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {t('toolsCount', { count: visibleTools.length })}
          </span>
        </div>
        <Panel>
          <div className="flex flex-col gap-3 border-b border-border p-3 xl:flex-row xl:items-center xl:justify-between">
            <SegmentedControl
              value={filter}
              onChange={setFilter}
              ariaLabel={t('category')}
              options={[
                { value: 'all', label: t('allTools') },
                ...toolGroups.map((group) => ({ value: group.id, label: t(group.labelKey) }))
              ]}
            />
            <div className="relative w-full xl:w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('searchTools')}
                className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-xs outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/50"
              />
            </div>
          </div>
          <div className="hidden grid-cols-[minmax(190px,0.8fr)_minmax(240px,1.4fr)_130px_24px] gap-5 border-b border-border bg-muted/30 px-5 py-2.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground lg:grid">
            <span>{t('toolName')}</span>
            <span>{t('description')}</span>
            <span>{t('category')}</span>
            <span />
          </div>
          <div className="divide-y divide-border">
            {visibleTools.map((tool, index) => {
              const Icon = tool.icon
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => onSelectTool(tool.id)}
                  className="group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40 lg:grid-cols-[minmax(190px,0.8fr)_minmax(240px,1.4fr)_130px_24px] lg:gap-5 lg:px-5"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="hidden w-5 text-[10px] tabular-nums text-muted-foreground/60 sm:block">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <Icon
                      className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                      strokeWidth={1.7}
                    />
                    <span className="truncate text-xs font-medium">{t(tool.titleKey)}</span>
                  </span>
                  <span className="hidden truncate text-[11px] text-muted-foreground lg:block">
                    {t(tool.descriptionKey)}
                  </span>
                  <span className="hidden text-[10px] text-muted-foreground lg:block">
                    {t(toolGroups.find((group) => group.id === tool.group)?.labelKey ?? '')}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              )
            })}
          </div>
          {visibleTools.length === 0 && (
            <div className="p-4">
              <EmptyState
                icon={Search}
                title={t('noToolsFound')}
                description={t('noToolsFoundDescription')}
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setQuery('')
                      setFilter('all')
                    }}
                  >
                    {t('clearFilters')}
                  </Button>
                }
              />
            </div>
          )}
        </Panel>
      </section>
    </div>
  )
}
