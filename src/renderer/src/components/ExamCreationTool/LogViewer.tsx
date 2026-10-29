/**
 * Author: Libra
 * Date: 2025-04-24 14:30:00
 * LastEditors: Libra
 * Description: 考试创建日志查看器
 */
import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Info, AlertTriangle, AlertOctagon, Clock } from 'lucide-react'
import { cn } from '@renderer/lib/utils'

// 日志消息接口
interface LogMessage {
  type: 'info' | 'success' | 'warn' | 'error'
  message: string
  timestamp: string
}

export const LogViewer = (): JSX.Element => {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<LogMessage[]>([])
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 注册日志监听器
    const unsubscribe = window.exam.onLog((log): void => {
      setLogs((prevLogs) => [...prevLogs, log])
    })

    // 组件卸载时取消监听
    return (): void => {
      unsubscribe()
    }
  }, [])

  // 日志内容滚动到底部
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    }
  }, [logs])

  // 根据日志类型返回对应的图标和颜色
  const getLogTypeInfo = (type: LogMessage['type']): { icon: JSX.Element; className: string } => {
    switch (type) {
      case 'info':
        return {
          icon: <Info className="h-3.5 w-3.5" />,
          className: 'text-muted-foreground'
        }
      case 'success':
        return {
          icon: <Check className="h-3.5 w-3.5" />,
          className: 'text-primary'
        }
      case 'warn':
        return {
          icon: <AlertTriangle className="h-3.5 w-3.5" />,
          className: 'text-amber-700 dark:text-amber-400'
        }
      case 'error':
        return {
          icon: <AlertOctagon className="h-3.5 w-3.5" />,
          className: 'text-destructive'
        }
      default:
        return {
          icon: <Info className="h-3.5 w-3.5" />,
          className: 'text-muted-foreground'
        }
    }
  }

  // 格式化时间戳
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  }

  return (
    <div
      ref={scrollAreaRef}
      role="log"
      aria-live="polite"
      aria-label={t('examLogAria')}
      className="h-[280px] overflow-y-auto overscroll-contain rounded-md border border-border bg-background/60"
    >
      {logs.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center px-5 py-8 text-center">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/50 text-muted-foreground">
            <Clock className="h-4 w-4" strokeWidth={1.6} />
          </div>
          <p className="text-xs font-medium text-foreground">{t('examLogEmptyTitle')}</p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
            {t('examLogEmptyDescription')}
          </p>
        </div>
      ) : (
        <ol className="divide-y divide-border/70">
          {logs.map((log, index) => {
            const { icon, className } = getLogTypeInfo(log.type)
            return (
              <li
                key={`${log.timestamp}-${index}`}
                className="flex items-start gap-2.5 px-3 py-2.5"
              >
                <span className={cn('mt-0.5 shrink-0', className)}>{icon}</span>
                <div className="min-w-0 flex-1">
                  <time className="block font-mono text-[10px] tabular-nums text-muted-foreground">
                    {formatTimestamp(log.timestamp)}
                  </time>
                  <p
                    className={cn(
                      'mt-1 whitespace-pre-wrap break-words text-[11px] leading-5 text-foreground',
                      log.type === 'error' && 'text-destructive'
                    )}
                  >
                    {log.message}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
