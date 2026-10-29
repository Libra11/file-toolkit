import { useEffect, useState, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Languages, Moon, Settings as SettingsIcon, Sun } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@renderer/components/ui/dialog'
import { Label } from '@renderer/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Switch } from '@renderer/components/ui/switch'
import { useSettings } from '@renderer/hooks/useSettings'

const languages = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' }
]

interface SettingsMenuProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: ReactElement | null
}

export function SettingsMenu({
  open: controlledOpen,
  onOpenChange,
  trigger
}: SettingsMenuProps = {}): JSX.Element {
  const { t } = useTranslation()
  const { settings, updateSettings } = useSettings()
  const [appVersion, setAppVersion] = useState('')
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isOpen = controlledOpen ?? uncontrolledOpen

  useEffect(() => {
    async function fetchVersion(): Promise<void> {
      try {
        const version = await window.system.getAppVersion()
        setAppVersion(version)
      } catch (error) {
        console.error('Failed to get app version:', error)
        setAppVersion('N/A')
      }
    }
    fetchVersion()
  }, [])

  const handleOpenChange = (open: boolean): void => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(open)
    }
    onOpenChange?.(open)
  }

  const toggleDarkMode = (): void => {
    updateSettings({ isDarkMode: !settings.isDarkMode })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger === null ? null : (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-2 rounded-md bg-card px-3 shadow-none"
            >
              <SettingsIcon className="h-4 w-4" strokeWidth={1.8} />
              <span>{t('settings')}</span>
              <span className="sr-only">{t('openSettings')}</span>
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent className="max-w-[540px] gap-0 overflow-y-auto rounded-lg border-border bg-card p-0 shadow-xl">
        <DialogHeader className="border-b border-border px-6 py-5 pr-12 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/[0.06] text-primary">
              <SettingsIcon className="h-4 w-4" strokeWidth={1.8} />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {t('appName')}
              </p>
              <DialogTitle className="text-base font-semibold text-foreground">
                {t('settings')}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="sr-only">
            {t('appName')} · {t('settings')}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/20 p-5 sm:p-6">
          <div className="overflow-hidden rounded-md border border-border bg-card">
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground">
                  <Languages className="h-4 w-4" strokeWidth={1.8} />
                </div>
                <div>
                  <Label htmlFor="language" className="text-sm font-medium text-foreground">
                    {t('language')}
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">{t('selectLanguage')}</p>
                </div>
              </div>
              <Select
                value={settings.language}
                onValueChange={(value) => updateSettings({ language: value })}
              >
                <SelectTrigger
                  id="language"
                  className="h-9 rounded-md shadow-none sm:w-40 sm:shrink-0"
                >
                  <SelectValue placeholder={t('selectLanguage')} />
                </SelectTrigger>
                <SelectContent className="rounded-md shadow-lg">
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code} className="rounded-sm">
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-border p-4 sm:p-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground">
                  {settings.isDarkMode ? (
                    <Sun className="h-4 w-4" strokeWidth={1.8} />
                  ) : (
                    <Moon className="h-4 w-4" strokeWidth={1.8} />
                  )}
                </div>
                <Label htmlFor="darkMode" className="text-sm font-medium text-foreground">
                  {t('darkMode')}
                </Label>
              </div>
              <Switch
                id="darkMode"
                checked={settings.isDarkMode}
                onCheckedChange={toggleDarkMode}
              />
            </div>
          </div>
        </div>

        {appVersion ? (
          <div className="flex items-center justify-between gap-4 border-t border-border px-6 py-3 text-xs">
            <span className="text-muted-foreground">{t('appName')}</span>
            <span className="font-mono tabular-nums text-foreground">v{appVersion}</span>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
