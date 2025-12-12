/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 应用布局组件
 */
import { ReactNode, useEffect, useState } from 'react'
import { Sparkles, Moon, Sun, Globe, Minus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n from '@renderer/i18n'

interface AppLayoutProps {
  children: ReactNode
  onVersionClick?: () => void
}

export default function AppLayout({ children, onVersionClick }: AppLayoutProps): JSX.Element {
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
      <div
        className="fixed top-0 left-0 w-full z-50 h-14 border-b border-slate-200/40 bg-white/80 backdrop-blur-xl shadow-[0_12px_50px_rgba(15,23,42,0.08)] dark:border-slate-900/40 dark:bg-slate-900/70"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="h-full flex items-center justify-between px-6">
          <div className="flex items-center gap-4 text-slate-700 dark:text-slate-100">
            <div className="flex items-center justify-center h-9 w-9 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/30 text-blue-600 dark:text-blue-300">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex flex-col leading-tight items-start">
              <span className="text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-50">
                {t('appName')}{' '}
                <span className="text-xs font-semibold lowercase text-slate-500 dark:text-slate-400">
                  v{version}
                </span>
              </span>
              {onVersionClick && (
                <button
                  onClick={onVersionClick}
                  className="text-xs text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 transition"
                  title={t('clickToViewChangelog')}
                  style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                >
                  {t('viewChangelog', { defaultValue: '查看更新日志' })}
                </button>
              )}
            </div>
          </div>

          <div
            className="flex items-center gap-3"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            {/* 语言切换 */}
            <button
              onClick={toggleLanguage}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/60 bg-white/70 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:border-slate-500"
              aria-label={t('toggleLanguage')}
              title={t('toggleLanguage')}
            >
              <Globe className="h-4 w-4" />
            </button>

            {/* 暗黑模式切换 */}
            <button
              onClick={toggleDarkMode}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/60 bg-white/70 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:border-slate-500"
              aria-label={isDarkMode ? '切换到亮色模式' : '切换到暗色模式'}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* 窗口控制按钮 */}
            <button
              onClick={handleMinimize}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/60 bg-white/70 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:border-slate-500"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={handleClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/60 bg-white/80 text-slate-500 transition hover:border-transparent hover:bg-red-500 hover:text-white dark:border-slate-700/60 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-red-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 内容区域，要留出顶部标题栏的空间 */}
      <div id="app-scroll-container" className="pt-14 overflow-auto w-full flex flex-col h-screen">
        {/* 主要内容 */}
        <main className="flex-1 flex  justify-center md:px-6">{children}</main>

        {/* 页脚 */}
        {/* <footer className="mt-auto py-6 text-center text-sm text-slate-500 dark:text-slate-400">
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
        </footer> */}
      </div>
    </div>
  )
}
