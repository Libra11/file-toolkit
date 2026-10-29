import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Bug, Calendar, ScrollText, Star, Wrench } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import {
  ChangelogEntry,
  changelog,
  getChangelogForVersion,
  hasNewChangelog
} from '../data/changelog'

interface ChangelogPopupProps {
  isOpen: boolean
  onClose: () => void
  version?: string
}

function ChangelogPopup({ isOpen, onClose, version }: ChangelogPopupProps): JSX.Element | null {
  const { t, i18n } = useTranslation()
  const [changelogEntry, setChangelogEntry] = useState<ChangelogEntry | null>(null)
  const language = (i18n.language || '').toLowerCase()
  const isChineseLocale = language.startsWith('zh')

  useEffect(() => {
    if (version && isOpen) {
      const entry = getChangelogForVersion(version)
      setChangelogEntry(entry || changelog[0] || null)
    }
  }, [version, isOpen])

  const getChangeIcon = (type: string): JSX.Element | null => {
    switch (type) {
      case 'features':
        return <Star className="h-4 w-4" strokeWidth={1.8} />
      case 'improvements':
        return <Wrench className="h-4 w-4" strokeWidth={1.8} />
      case 'fixes':
        return <Bug className="h-4 w-4" strokeWidth={1.8} />
      case 'breaking':
        return <AlertTriangle className="h-4 w-4" strokeWidth={1.8} />
      default:
        return null
    }
  }

  const getChangeTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      features: t('features'),
      improvements: t('improvements'),
      fixes: t('fixes'),
      breaking: t('breakingChanges')
    }
    return labels[type] || type
  }

  const renderChangeItems = (items: string[]): JSX.Element[] => {
    const containsChinese = (text: string): boolean => /[\u4e00-\u9fff]/.test(text)
    const filtered = items.filter((item) =>
      isChineseLocale ? containsChinese(item) : !containsChinese(item)
    )
    const displayItems = filtered.length > 0 ? filtered : items

    return displayItems.map((item, idx) => (
      <li key={`${item}-${idx}`} className="flex items-start gap-3 text-sm leading-6">
        <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
        <span className="min-w-0 text-secondary-foreground">{item}</span>
      </li>
    ))
  }

  const handleDontShowAgain = (): void => {
    if (version) {
      localStorage.setItem('changelog-last-seen', version)
    }
    onClose()
  }

  if (!changelogEntry) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[calc(100vh-2rem)] max-h-[42rem] max-w-4xl flex-col gap-0 overflow-hidden rounded-lg border-border bg-card p-0 shadow-xl">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4 pr-12 text-left sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/[0.06] text-primary">
              <ScrollText className="h-4 w-4" strokeWidth={1.8} />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {t('changelog')}
              </p>
              <DialogTitle className="text-base font-semibold text-foreground">
                {t('whatsNew')}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="sr-only">
            {t('whatsNew')} · v{changelogEntry.version}
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-rows-[10rem_minmax(0,1fr)] md:grid-cols-[13rem_minmax(0,1fr)] md:grid-rows-1">
          <aside className="flex min-h-0 flex-col border-b border-border bg-muted/20 md:border-b-0 md:border-r">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
              <span className="text-xs font-medium text-foreground">{t('changelog')}</span>
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                {String(changelog.length).padStart(2, '0')}
              </span>
            </div>
            <ScrollArea className="min-h-0 flex-1">
              <nav aria-label={t('changelog')} className="space-y-1 p-2">
                {changelog.map((entry) => {
                  const isSelected = entry.version === changelogEntry.version

                  return (
                    <button
                      key={entry.version}
                      type="button"
                      aria-current={isSelected ? 'true' : undefined}
                      onClick={() => setChangelogEntry(entry)}
                      className={`flex w-full items-center gap-2.5 rounded-md border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
                        isSelected
                          ? 'border-primary/20 bg-accent text-accent-foreground'
                          : 'border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          isSelected ? 'bg-primary' : 'bg-border'
                        }`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono text-xs font-medium">
                          v{entry.version}
                        </span>
                        <span className="mt-0.5 block text-[10px] tabular-nums text-muted-foreground">
                          {entry.date}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </nav>
            </ScrollArea>
          </aside>

          <section className="flex min-h-0 flex-col bg-card">
            <header className="shrink-0 border-b border-border px-5 py-4 sm:px-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {t('whatsNew')}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-mono text-xl font-semibold tracking-tight text-foreground">
                  v{changelogEntry.version}
                </h2>
                <time className="flex items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" strokeWidth={1.8} />
                  {changelogEntry.date}
                </time>
              </div>
            </header>

            <ScrollArea className="min-h-0 flex-1">
              <div className="px-5 py-5 sm:px-6">
                <div className="divide-y divide-border">
                  {Object.entries(changelogEntry.changes).map(([type, items]) => {
                    if (!items || items.length === 0) return null
                    const isBreaking = type === 'breaking'

                    return (
                      <section key={type} className="py-5 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-md border ${
                              isBreaking
                                ? 'border-destructive/20 bg-destructive/[0.06] text-destructive'
                                : 'border-border bg-muted/40 text-primary'
                            }`}
                          >
                            {getChangeIcon(type)}
                          </span>
                          <h3 className="text-sm font-semibold text-foreground">
                            {getChangeTypeLabel(type)}
                          </h3>
                        </div>
                        <ul className="mt-3 space-y-2.5 pl-[2.35rem]">
                          {renderChangeItems(items)}
                        </ul>
                      </section>
                    )
                  })}
                </div>
              </div>
            </ScrollArea>
          </section>
        </div>

        <DialogFooter className="shrink-0 flex-col-reverse gap-2 border-t border-border bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:space-x-0 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            onClick={handleDontShowAgain}
            className="w-full rounded-md text-xs sm:w-auto"
          >
            {t('dontShowAgain')}
          </Button>
          <Button
            type="button"
            onClick={onClose}
            className="w-full rounded-md shadow-none sm:w-auto"
          >
            {t('close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ChangelogPopup

export const useChangelogPopup = (): {
  isOpen: boolean
  currentVersion: string
  showChangelog: (version: string) => void
  hideChangelog: () => void
  checkForNewChangelog: () => Promise<void>
} => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentVersion, setCurrentVersion] = useState<string>('')

  const showChangelog = useCallback((version: string): void => {
    setCurrentVersion(version)
    setIsOpen(true)
  }, [])

  const checkForNewChangelog = useCallback(async (): Promise<void> => {
    try {
      const version = await window.system.getAppVersion()
      const lastSeenVersion = localStorage.getItem('changelog-last-seen') || '0.0.0'

      if (hasNewChangelog(lastSeenVersion, version)) {
        showChangelog(version)
        localStorage.setItem('changelog-last-seen', version)
      }
    } catch (error) {
      console.error('Failed to check for changelog:', error)
    }
  }, [showChangelog])

  const hideChangelog = useCallback((): void => {
    setIsOpen(false)
  }, [])

  return {
    isOpen,
    currentVersion,
    showChangelog,
    hideChangelog,
    checkForNewChangelog
  }
}
