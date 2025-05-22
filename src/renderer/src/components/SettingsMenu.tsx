import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react' // Import useEffect and useState
import { Button } from '@renderer/components/ui/button'
import { Settings as SettingsIcon } from 'lucide-react' // Renamed to avoid conflict
import {
  Dialog,
  DialogContent,
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
  // Add more languages as needed
]

export function SettingsMenu(): JSX.Element {
  const { t } = useTranslation()
  const { settings, updateSettings } = useSettings()
  const [appVersion, setAppVersion] = useState('')

  useEffect(() => {
    async function fetchVersion() {
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

  const toggleDarkMode = (): void => {
    updateSettings({ isDarkMode: !settings.isDarkMode })
  }

  return (
    <div className="fixed bottom-4 right-4">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <SettingsIcon className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">{t('openSettings')}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('settings')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="language" className="text-right">
                {t('language')}
              </Label>
              <Select
                onValueChange={(value) => updateSettings({ language: value })}
                defaultValue={settings.language}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t('selectLanguage')} />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="darkMode" className="text-right">
                {t('darkMode')}
              </Label>
              <Switch
                id="darkMode"
                checked={settings.isDarkMode}
                onCheckedChange={toggleDarkMode}
                className="col-span-3"
              />
            </div>
            {/* Display App Version */}
            {appVersion && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                  {t('versionLabel', { version: appVersion })}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
