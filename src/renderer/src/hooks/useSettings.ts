import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Settings {
  language: string
  isDarkMode: boolean
}

const SETTINGS_EVENT = 'file-toolkit:settings-changed'

function loadSettings(defaultLanguage: string): Settings {
  let saved: Partial<Settings> = {}
  try {
    const value: unknown = JSON.parse(localStorage.getItem('appSettings') ?? '{}')
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      saved = value as Partial<Settings>
    }
  } catch {
    // Ignore malformed preferences and fall back to the legacy keys.
  }
  const storedDarkMode = localStorage.getItem('darkMode')
  return {
    language: localStorage.getItem('language') ?? saved.language ?? defaultLanguage,
    isDarkMode:
      storedDarkMode === null
        ? (saved.isDarkMode ?? window.matchMedia('(prefers-color-scheme: dark)').matches)
        : storedDarkMode === 'true'
  }
}

export function useSettings(): {
  settings: Settings
  updateSettings: (newSettings: Partial<Settings>) => void
} {
  const { i18n } = useTranslation()
  const [settings, setSettings] = useState<Settings>(() => loadSettings(i18n.language))

  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings))
    localStorage.setItem('darkMode', String(settings.isDarkMode))
    localStorage.setItem('language', settings.language)
    i18n.changeLanguage(settings.language)
    document.documentElement.classList.toggle('dark', settings.isDarkMode)
    window.dispatchEvent(new CustomEvent<Settings>(SETTINGS_EVENT, { detail: settings }))
  }, [settings, i18n])

  useEffect(() => {
    const syncSettings = (event: Event): void => {
      const next = (event as CustomEvent<Settings>).detail
      if (!next) return
      setSettings((current) =>
        current.language === next.language && current.isDarkMode === next.isDarkMode
          ? current
          : next
      )
    }
    window.addEventListener(SETTINGS_EVENT, syncSettings)
    return (): void => window.removeEventListener(SETTINGS_EVENT, syncSettings)
  }, [])

  const updateSettings = (newSettings: Partial<Settings>): void => {
    setSettings((current) => ({ ...current, ...newSettings }))
  }

  return { settings, updateSettings }
}
