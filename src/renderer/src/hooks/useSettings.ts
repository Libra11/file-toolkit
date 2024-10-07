/*
 * @Author: Libra
 * @Date: 2024-10-07 17:05:02
 * @LastEditors: Libra
 * @Description:
 */
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface Settings {
  language: string
  isDarkMode: boolean
}

export function useSettings(): {
  settings: Settings
  updateSettings: (newSettings: Partial<Settings>) => void
} {
  const { i18n } = useTranslation()
  const [settings, setSettings] = useState<Settings>(() => {
    const savedSettings = localStorage.getItem('appSettings')
    return savedSettings ? JSON.parse(savedSettings) : { language: 'en', isDarkMode: false }
  })

  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings))
    i18n.changeLanguage(settings.language)
    document.documentElement.classList.toggle('dark', settings.isDarkMode)
  }, [settings, i18n])

  const updateSettings = (newSettings: Partial<Settings>): void => {
    setSettings((prevSettings) => ({ ...prevSettings, ...newSettings }))
  }

  return { settings, updateSettings }
}
