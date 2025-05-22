/**
 * Author: Libra
 * Date: 2025-03-30 11:36:01
 * LastEditors: Libra
 * Description:
 */
/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 应用布局组件
 */
import { ReactNode, useEffect, useState } from 'react'
import { FileCog, Moon, Sun, Globe, Minus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n from '@renderer/i18n'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps): JSX.Element {
  const { t } = useTranslation()
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    localStorage.getItem('darkMode') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  const [version, setVersion] = useState<string>('')

  // 监听颜色模式变化
  useEffect(() => {
    const html = document.documentElement

    if (isDarkMode) {
      html.classList.add('dark')
      localStorage.setItem('darkMode', 'true')
    } else {
      html.classList.remove('dark')
      localStorage.setItem('darkMode', 'false')
    }
  }, [isDarkMode])

  useEffect(() => {
    async function fetchVersion(): Promise<void> {
      try {
        const version = await window.system.getAppVersion()
        console.log(version)
        setVersion(version)
      } catch (error) {
        console.error('Failed to get version:', error)
        setVersion('N/A')
      }
    }
    fetchVersion()
  }, [])

  // 切换暗黑模式
  const toggleDarkMode = (): void => {
    setIsDarkMode(!isDarkMode)
  }

  // 切换语言
  const toggleLanguage = (): void => {
    const currentLanguage = i18n.language
    const newLanguage = currentLanguage === 'en' ? 'zh' : 'en'
    i18n.changeLanguage(newLanguage)
    localStorage.setItem('language', newLanguage)
  }

  // 窗口控制
  const handleMinimize = async (): Promise<void> => {
    await window.system.minimizeWindow()
  }

  const handleClose = async (): Promise<void> => {
    await window.system.closeWindow()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
      {/* 背景装饰 */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-r from-blue-500/20 to-violet-500/20 blur-3xl opacity-50 dark:opacity-30" />
        <div className="absolute bottom-0 right-0 w-full h-40 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 blur-3xl opacity-50 dark:opacity-30" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* 自定义标题栏 */}
      <div className="fixed top-0 left-0 w-full bg-gradient-to-r from-blue-500/10 to-violet-500/10 backdrop-blur-md z-50 h-10 flex items-center justify-between px-4 shadow-sm select-none custom-titlebar border-b border-slate-200/30 dark:border-slate-800/30">
        <div
          className="flex items-center flex-grow h-full"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <div className="flex items-center">
            <FileCog className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
            <span className="text-sm font-medium">
              {t('appName')}《{version}》
            </span>
          </div>
        </div>
        <div
          className="flex items-center"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {/* 语言切换 */}
          <button
            onClick={toggleLanguage}
            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 dark:text-slate-400 transition-colors duration-200"
            aria-label={t('toggleLanguage')}
            title={t('toggleLanguage')}
          >
            <Globe className="h-4 w-4" />
          </button>

          {/* 暗黑模式切换 */}
          <button
            onClick={toggleDarkMode}
            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 dark:text-slate-400 transition-colors duration-200 ml-1"
            aria-label={isDarkMode ? '切换到亮色模式' : '切换到暗色模式'}
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* 窗口控制按钮 */}
          <button
            onClick={handleMinimize}
            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 dark:text-slate-400 transition-colors duration-200 ml-1"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md hover:bg-red-500 hover:text-white transition-colors duration-200 ml-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 内容区域，要留出顶部标题栏的空间 */}
      <div className="pt-10 overflow-auto w-full flex flex-col h-screen">
        {/* 主要内容 */}
        <main className="flex-1 flex  justify-center py-8 px-4 md:px-6">{children}</main>

        {/* 页脚 */}
        <footer className="mt-auto py-6 text-center text-sm text-slate-500 dark:text-slate-400">
          <div className="px-4">
            <p>
              &copy; {new Date().getFullYear()} File Toolkit. {t('allRightsReserved')}
            </p>
            <div className="flex justify-center space-x-4 mt-2">
              <a href="#" className="hover:text-slate-900 dark:hover:text-slate-100 transition">
                {t('privacyPolicy')}
              </a>
              <span>•</span>
              <a href="#" className="hover:text-slate-900 dark:hover:text-slate-100 transition">
                {t('termsOfService')}
              </a>
              <span>•</span>
              <a href="#" className="hover:text-slate-900 dark:hover:text-slate-100 transition">
                {t('contact')}
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
