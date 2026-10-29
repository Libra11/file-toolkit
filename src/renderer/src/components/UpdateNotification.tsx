import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, CheckCircle2, Download, RefreshCw, X } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Progress } from '@renderer/components/ui/progress'

interface UpdateMessage {
  type:
    | 'error'
    | 'checking'
    | 'updateAvailable'
    | 'downloadProgress'
    | 'updateNotAvailable'
    | 'updateDownloaded'
  message: string
  error?: string
  data?: {
    version?: string
    percent?: number
  }
}

export default function UpdateNotification(): JSX.Element | null {
  const { t, i18n } = useTranslation()
  const [updateMessage, setUpdateMessage] = useState<UpdateMessage | null>(null)
  const [show, setShow] = useState(false)
  const dismissed = useRef(false)
  const activeVersion = useRef<string | undefined>(undefined)

  useEffect(() => {
    const handleUpdateMessage = (_: unknown, message: UpdateMessage): void => {
      const messageVersion = message.data?.version
      if (messageVersion && messageVersion !== activeVersion.current) {
        activeVersion.current = messageVersion
        dismissed.current = false
      }
      if (
        message.type === 'checking' ||
        message.type === 'updateAvailable' ||
        message.type === 'updateDownloaded' ||
        message.type === 'error'
      ) {
        dismissed.current = false
      }

      setUpdateMessage(message)
      if (message.type !== 'checking' && message.type !== 'updateNotAvailable') {
        if (message.type === 'downloadProgress' && dismissed.current) return
        setShow(true)
      }
    }

    window.system.ipcRendererOn('update-message', handleUpdateMessage)

    return (): void => {
      window.system.ipcRendererOff('update-message')
    }
  }, [])

  const dismiss = (): void => {
    dismissed.current = true
    setShow(false)
  }

  if (!show || !updateMessage) return null

  const isError = updateMessage.type === 'error'
  const isProgress = updateMessage.type === 'downloadProgress'
  const isDownloaded = updateMessage.type === 'updateDownloaded'
  const isBusy = updateMessage.type === 'checking' || updateMessage.type === 'downloadProgress'
  const version = updateMessage.data?.version
  const isChineseLocale = (i18n.language || '').toLowerCase().startsWith('zh')
  const title =
    updateMessage.type === 'updateAvailable'
      ? t('newVersionAvailable', {
          version,
          defaultValue: isChineseLocale
            ? `检测到新版本${version ? ` ${version}` : ''}`
            : `A new version${version ? ` ${version}` : ''} is available`
        })
      : updateMessage.message
  const Icon = isError
    ? AlertCircle
    : isDownloaded
      ? CheckCircle2
      : updateMessage.type === 'updateAvailable'
        ? Download
        : RefreshCw

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-end sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-96">
      <section
        role={isError ? 'alert' : isProgress ? 'region' : 'status'}
        aria-live={isError ? 'assertive' : isProgress ? 'off' : 'polite'}
        aria-atomic={!isProgress}
        aria-labelledby="update-notification-title"
        className={`pointer-events-auto w-full overflow-hidden rounded-lg border bg-card text-card-foreground shadow-lg ${
          isError ? 'border-destructive/30' : 'border-border'
        }`}
      >
        <div className="flex items-start gap-3 px-4 py-4">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${
              isError
                ? 'border-destructive/20 bg-destructive/[0.06] text-destructive'
                : 'border-primary/20 bg-primary/[0.06] text-primary'
            }`}
          >
            <Icon className={`h-4 w-4 ${isBusy ? 'animate-spin' : ''}`} strokeWidth={1.8} />
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t('appName')}
            </p>
            <h2 id="update-notification-title" className="mt-1 text-sm font-semibold leading-5">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={dismiss}
            aria-label={t('close')}
            className="-mr-1 -mt-1 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isError && updateMessage.error ? (
          <div className="border-t border-destructive/15 bg-destructive/[0.04] px-4 py-3">
            <p className="whitespace-pre-wrap break-words text-xs leading-5 text-muted-foreground">
              {updateMessage.error}
            </p>
          </div>
        ) : null}

        {updateMessage.type === 'downloadProgress' &&
        typeof updateMessage.data?.percent === 'number' ? (
          <div className="border-t border-border bg-muted/20 px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs">
              <span className="text-muted-foreground">{t('download')}</span>
              <span className="font-mono font-medium tabular-nums text-foreground">
                {Math.round(updateMessage.data.percent)}%
              </span>
            </div>
            <Progress
              value={updateMessage.data.percent}
              className="h-1.5 rounded-sm bg-muted [&>div]:bg-primary"
            />
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/20 px-4 py-3">
          {version ? (
            <span className="mr-auto font-mono text-[11px] text-muted-foreground">v{version}</span>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={dismiss}
            className="h-8 rounded-md px-3 text-xs shadow-none"
          >
            {t('close')}
          </Button>
        </div>
      </section>
    </div>
  )
}
