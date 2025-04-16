/**
 * Author: Libra
 * Date: 2025-04-16 15:18:43
 * LastEditors: Libra
 * Description:
 */
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, X } from 'lucide-react'
import { Progress } from '@renderer/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@renderer/components/ui/alert'

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
  const { t } = useTranslation()
  const [updateMessage, setUpdateMessage] = useState<UpdateMessage | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    console.log('useEffect', window.system.ipcRendererOn)
    // 监听更新消息
    const handleUpdateMessage = (_: unknown, message: UpdateMessage): void => {
      setUpdateMessage(message)
      console.log('message ', message)
      if (message.type !== 'checking' && message.type !== 'updateNotAvailable') {
        setShow(true)
      }
    }

    window.system.ipcRendererOn('update-message', handleUpdateMessage)

    return (): void => {
      window.system.ipcRendererOff('update-message')
    }
  }, [])

  if (!show || !updateMessage) return null

  const getAlertVariant = (): 'default' | 'destructive' | 'success' => {
    switch (updateMessage.type) {
      case 'error':
        return 'destructive'
      case 'updateAvailable':
      case 'downloadProgress':
        return 'default'
      case 'updateDownloaded':
        return 'success'
      default:
        return 'default'
    }
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 z-50">
      <Alert variant={getAlertVariant()} className="relative">
        <button
          onClick={() => setShow(false)}
          className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">关闭</span>
        </button>
        {updateMessage.type === 'downloadProgress' ? <Download className="h-4 w-4" /> : null}
        <AlertTitle>
          {updateMessage.type === 'updateAvailable'
            ? t('newVersionAvailable', { version: updateMessage.data?.version })
            : updateMessage.message}
        </AlertTitle>
        <AlertDescription>
          {updateMessage.type === 'error' && updateMessage.error ? (
            <p className="text-sm text-red-500">{updateMessage.error}</p>
          ) : null}
          {updateMessage.type === 'downloadProgress' && updateMessage.data?.percent ? (
            <div className="mt-2">
              <Progress value={updateMessage.data.percent} className="h-2" />
              <p className="text-sm mt-1 text-right">{Math.round(updateMessage.data.percent)}%</p>
            </div>
          ) : null}
        </AlertDescription>
      </Alert>
    </div>
  )
}
