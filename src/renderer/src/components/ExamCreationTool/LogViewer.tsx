/**
 * Author: Libra
 * Date: 2025-04-24 14:30:00
 * LastEditors: Libra
 * Description: 考试创建日志查看器
 */
import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Check, Info, AlertTriangle, AlertOctagon, Clock } from 'lucide-react'

// 日志消息接口
interface LogMessage {
  type: 'info' | 'success' | 'warn' | 'error'
  message: string
  timestamp: string
}

export const LogViewer = (): JSX.Element => {
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
  const getLogTypeInfo = (
    type: LogMessage['type']
  ): { icon: JSX.Element; color: string; bgColor: string } => {
    switch (type) {
      case 'info':
        return {
          icon: <Info className="h-4 w-4" />,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20'
        }
      case 'success':
        return {
          icon: <Check className="h-4 w-4" />,
          color: 'text-green-500',
          bgColor: 'bg-green-50 dark:bg-green-900/20'
        }
      case 'warn':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
        }
      case 'error':
        return {
          icon: <AlertOctagon className="h-4 w-4" />,
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20'
        }
      default:
        return {
          icon: <Info className="h-4 w-4" />,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20'
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
      className="h-[400px] overflow-y-auto rounded-md bg-white dark:bg-slate-800/50 border border-green-100 dark:border-green-800/30 shadow-inner"
    >
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
          <div className="animate-pulse bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-3 rounded-full mb-4">
            <Clock className="h-8 w-8" />
          </div>
          <p className="text-indigo-600 dark:text-indigo-400 font-medium">等待考试创建过程...</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">日志将实时显示在此处</p>
        </div>
      ) : (
        <div className="space-y-2 p-2">
          {logs.map((log, index) => {
            const { icon, color, bgColor } = getLogTypeInfo(log.type)
            return (
              <motion.div
                key={`${log.timestamp}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex items-start gap-3 p-2 rounded-lg ${bgColor} border border-slate-100 dark:border-slate-800/50 shadow-sm w-full`}
              >
                <div
                  className={`mt-0.5 flex-shrink-0 ${color} p-1.5 rounded-md bg-white/80 dark:bg-slate-800/80`}
                >
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs ${color} font-medium px-1.5 py-0.5 rounded-full bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800/50 flex-shrink-0`}
                    >
                      {formatTimestamp(log.timestamp)}
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 break-words">
                      {log.message}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
