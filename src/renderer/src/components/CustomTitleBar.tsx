import React from 'react'
import { FileType2, Minus, X } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import { useTranslation } from 'react-i18next'

const controlButton =
  'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

const CustomTitleBar: React.FC = () => {
  const { t } = useTranslation()

  const handleMinimize = async (): Promise<void> => {
    await window.system.minimizeWindow()
  }

  const handleClose = async (): Promise<void> => {
    await window.system.closeWindow()
  }

  return (
    <header className="custom-titlebar fixed inset-x-0 top-0 z-50 flex h-[52px] select-none items-center border-b border-border bg-card text-foreground">
      <div
        className="flex h-full min-w-0 flex-1 items-center gap-2.5 px-4"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <FileType2 className="h-4 w-4" strokeWidth={1.7} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold tracking-[-0.01em]">
            {t('appName')}
          </span>
          <span className="mt-0.5 block text-[8px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t('workspace')}
          </span>
        </span>
      </div>

      <div
        className="flex shrink-0 items-center gap-1 px-3"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          type="button"
          onClick={handleMinimize}
          className={controlButton}
          title={t('minimize')}
          aria-label={t('minimize')}
        >
          <Minus className="h-4 w-4" strokeWidth={1.7} />
        </button>
        <button
          type="button"
          onClick={handleClose}
          className={cn(controlButton, 'hover:bg-destructive hover:text-destructive-foreground')}
          title={t('close')}
          aria-label={t('close')}
        >
          <X className="h-4 w-4" strokeWidth={1.7} />
        </button>
      </div>
    </header>
  )
}

export default CustomTitleBar
