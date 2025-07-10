import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './ui/dialog'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { ScrollArea } from './ui/scroll-area'
import { Calendar, Star, Bug, Wrench, AlertTriangle } from 'lucide-react'
import { ChangelogEntry, getChangelogForVersion, hasNewChangelog } from '../data/changelog'

interface ChangelogPopupProps {
  isOpen: boolean
  onClose: () => void
  version?: string
}

const ChangelogPopup: React.FC<ChangelogPopupProps> = ({ isOpen, onClose, version }) => {
  const { t, i18n } = useTranslation()
  const [changelogEntry, setChangelogEntry] = useState<ChangelogEntry | null>(null)
  const isChineseLocale = i18n.language === 'zh-CN'

  useEffect(() => {
    if (version && isOpen) {
      const entry = getChangelogForVersion(version)
      setChangelogEntry(entry || null)
    }
  }, [version, isOpen])

  const getChangeIcon = (type: string): JSX.Element | null => {
    switch (type) {
      case 'features':
        return <Star className="h-4 w-4 text-green-500" />
      case 'improvements':
        return <Wrench className="h-4 w-4 text-blue-500" />
      case 'fixes':
        return <Bug className="h-4 w-4 text-orange-500" />
      case 'breaking':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
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

  const renderChangeItems = (items: string[]): (JSX.Element | null)[] => {
    return items.map((item, idx) => {
      const isOdd = idx % 2 === 1
      if (isChineseLocale && !isOdd) {
        return (
          <li key={idx} className="flex items-start gap-2 text-sm">
            <span className="text-muted-foreground">•</span>
            <span>{item}</span>
          </li>
        )
      }
      if (!isChineseLocale && isOdd) {
        return (
          <li key={idx} className="flex items-start gap-2 text-sm">
            <span className="text-muted-foreground">•</span>
            <span>{item}</span>
          </li>
        )
      }
      return null
    })
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
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('whatsNew')}
            <Badge variant="outline" className="ml-2">
              v{changelogEntry.version}
            </Badge>
          </DialogTitle>
          <DialogDescription>{changelogEntry.date}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-4">
            {Object.entries(changelogEntry.changes).map(([type, items]) => {
              if (!items || items.length === 0) return null

              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getChangeIcon(type)}
                    <h4 className="font-semibold text-sm">{getChangeTypeLabel(type)}</h4>
                  </div>
                  <ul className="space-y-1 pl-6">{renderChangeItems(items)}</ul>
                  <Separator className="my-3" />
                </div>
              )
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleDontShowAgain} className="flex-1">
            {t('dontShowAgain')}
          </Button>
          <Button onClick={onClose} className="flex-1">
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

  const showChangelog = (version: string): void => {
    setCurrentVersion(version)
    setIsOpen(true)
  }

  const checkForNewChangelog = async (): Promise<void> => {
    try {
      const version = await window.system.getAppVersion()
      const lastSeenVersion = localStorage.getItem('changelog-last-seen') || '0.0.0'

      if (hasNewChangelog(lastSeenVersion, version)) {
        showChangelog(version)
        // 自动标记为已查看，避免重复弹出
        localStorage.setItem('changelog-last-seen', version)
      }
    } catch (error) {
      console.error('Failed to check for changelog:', error)
    }
  }

  const hideChangelog = (): void => {
    setIsOpen(false)
  }

  return {
    isOpen,
    currentVersion,
    showChangelog,
    hideChangelog,
    checkForNewChangelog
  }
}
