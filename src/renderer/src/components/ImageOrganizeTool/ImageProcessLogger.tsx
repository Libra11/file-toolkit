/**
 * Author: Libra
 * Date: 2025-04-27 15:30:00
 * LastEditors: Libra
 * Description: 图片处理日志查看器
 */
import { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Info,
  Check,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Image,
  Layers,
  FileCog,
  FileOutput,
  List,
  LayoutList,
  Eye
} from 'lucide-react'
import { Progress } from '@renderer/components/ui/progress'
import { Button } from '@renderer/components/ui/button'
import { Switch } from '@renderer/components/ui/switch'
import { Label } from '@renderer/components/ui/label'

// 日志消息接口
export interface ProcessLogMessage {
  type: 'info' | 'success' | 'warn' | 'error'
  message: string
  timestamp: string
  percentage?: number
  step?: string
}

// 组件属性接口
interface ImageProcessLoggerProps {
  isProcessing?: boolean
  logs: ProcessLogMessage[]
  currentProgress: number
  currentStep: string
}

// 最大显示的日志数量
const MAX_VISIBLE_LOGS = 100

export const ImageProcessLogger = ({
  isProcessing = false,
  logs = [],
  currentProgress = 0,
  currentStep = ''
}: ImageProcessLoggerProps): JSX.Element => {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [compactMode, setCompactMode] = useState<boolean>(false)
  const [autoScroll, setAutoScroll] = useState<boolean>(true)

  // 使用记忆化处理大量日志，只显示最近的一部分
  const visibleLogs = useMemo(() => {
    if (compactMode) {
      // 在紧凑模式下，只显示每个步骤的第一条和关键日志（警告、错误）
      const stepMap = new Map<string, ProcessLogMessage>()
      const criticalLogs: ProcessLogMessage[] = []

      // 保留每个步骤的最新日志和所有错误/警告日志
      logs.forEach((log) => {
        if (log.type === 'warn' || log.type === 'error' || log.type === 'success') {
          criticalLogs.push(log)
        } else if (log.step) {
          stepMap.set(log.step, log)
        }
      })

      // 合并步骤日志和关键日志，并排序
      return [...Array.from(stepMap.values()), ...criticalLogs]
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(-MAX_VISIBLE_LOGS)
    }

    // 普通模式：只显示最新的日志
    return logs.slice(-MAX_VISIBLE_LOGS)
  }, [logs, compactMode])

  // 日志内容滚动到底部
  useEffect(() => {
    if (scrollAreaRef.current && autoScroll) {
      const scrollContainer = scrollAreaRef.current
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    }
  }, [visibleLogs, autoScroll])

  // 监听手动滚动事件，决定是否继续自动滚动
  useEffect(() => {
    const handleScroll = (): void => {
      if (!scrollAreaRef.current) return

      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current
      // 如果用户手动向上滚动，则暂停自动滚动，直到用户再次滚动到底部
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 30
      setAutoScroll(isAtBottom)
    }

    const scrollContainer = scrollAreaRef.current
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll)
      return (): void => scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // 获取步骤图标
  const getStepIcon = (step?: string): JSX.Element => {
    switch (step) {
      case '文件平铺':
        return <Layers className="h-4 w-4" />
      case '文件分类':
        return <FileCog className="h-4 w-4" />
      case '文件重命名':
        return <FileOutput className="h-4 w-4" />
      case '图片压缩':
        return <Image className="h-4 w-4" />
      case 'Excel分类':
        return <FileOutput className="h-4 w-4" />
      case '清理目录':
        return <FileCog className="h-4 w-4" />
      case '完成':
        return <Check className="h-4 w-4" />
      case '错误':
        return <AlertOctagon className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  // 根据日志类型返回对应的图标和颜色
  const getLogTypeInfo = (
    log: ProcessLogMessage
  ): { icon: JSX.Element; color: string; bgColor: string } => {
    const stepIcon = getStepIcon(log.step)

    switch (log.type) {
      case 'info':
        return {
          icon: stepIcon,
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
          icon: stepIcon,
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

  // 计算处理了多少个文件（基于日志）
  const getProcessedFileCount = (): number => {
    // 查找最后一条包含"文件"和数字的日志消息
    for (let i = logs.length - 1; i >= 0; i--) {
      const log = logs[i]
      if (log.message) {
        const match = log.message.match(/处理了\s*(\d+)\s*个?文件/)
        if (match && match[1]) {
          return parseInt(match[1], 10)
        }
      }
    }
    return 0
  }

  // 获取当前步骤的进度统计
  const getStepStats = (): { current: number; total: number; percent: number } => {
    const fileCount = getProcessedFileCount()
    return {
      current: fileCount,
      total: Math.max(fileCount, 100), // 如果没有明确总数，假设至少100个
      percent: currentProgress
    }
  }

  // 切换视图模式
  const toggleCompactMode = (): void => {
    setCompactMode(!compactMode)
  }

  // 当需要手动滚动到底部时
  const scrollToBottom = (): void => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
      setAutoScroll(true)
    }
  }

  const stats = getStepStats()

  return (
    <div className="space-y-4">
      {/* 进度条区域 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/10 dark:to-blue-900/10 p-3 rounded-lg border border-cyan-100 dark:border-cyan-800/30 shadow-sm"
      >
        <div className="flex justify-between items-center mb-1">
          <span className="font-medium text-cyan-700 dark:text-cyan-400 flex items-center gap-1.5">
            {getStepIcon(
              currentStep.includes('平铺')
                ? '文件平铺'
                : currentStep.includes('分类')
                  ? '文件分类'
                  : currentStep.includes('重命名')
                    ? '文件重命名'
                    : currentStep.includes('压缩')
                      ? '图片压缩'
                      : currentStep.includes('Excel')
                        ? 'Excel分类'
                        : currentStep.includes('清理')
                          ? '清理目录'
                          : currentStep.includes('完成')
                            ? '完成'
                            : currentStep.includes('错误')
                              ? '错误'
                              : ''
            )}
            {currentStep}
          </span>
          <div className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center"
            >
              <Switch
                id="compact-mode"
                checked={compactMode}
                onCheckedChange={toggleCompactMode}
                className="data-[state=checked]:bg-cyan-500"
              />
              <Label
                htmlFor="compact-mode"
                className="ml-2 text-xs text-cyan-700 dark:text-cyan-400 cursor-pointer"
              >
                简洁模式
              </Label>
            </motion.div>
            <span className="bg-cyan-100 dark:bg-cyan-800/30 text-cyan-700 dark:text-cyan-300 font-medium px-2 py-0.5 rounded-full text-xs">
              {currentProgress}%
            </span>
          </div>
        </div>
        <Progress value={currentProgress} className="h-2 bg-cyan-100 dark:bg-cyan-900/30" />

        {/* 文件计数器 */}
        {stats.current > 0 && (
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mt-1 px-1">
            <span>已处理: {stats.current} 个文件</span>
            {!autoScroll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={scrollToBottom}
                className="h-6 px-2 py-0 text-xs text-cyan-500 hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300"
              >
                <Eye size={12} className="mr-1" />
                滚动至最新
              </Button>
            )}
          </div>
        )}
      </motion.div>

      {/* 日志区域 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-lg bg-gradient-to-r from-slate-50 to-cyan-50 dark:from-slate-900/50 dark:to-cyan-900/10 p-1 border border-cyan-100 dark:border-cyan-800/30 shadow-md"
      >
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <List size={14} />
            {compactMode ? '关键日志' : `最近 ${Math.min(logs.length, MAX_VISIBLE_LOGS)} 条日志`}
          </span>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCompactMode}
              className="h-6 px-2 text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300"
            >
              {compactMode ? (
                <LayoutList size={14} className="mr-1" />
              ) : (
                <List size={14} className="mr-1" />
              )}
              {compactMode ? '详细模式' : '简洁模式'}
            </Button>
          </motion.div>
        </div>

        <div
          ref={scrollAreaRef}
          className="h-[300px] overflow-y-auto rounded-md bg-white/80 dark:bg-slate-800/50 shadow-inner scrollbar-thin scrollbar-thumb-cyan-200 dark:scrollbar-thumb-cyan-800 scrollbar-track-transparent"
        >
          {visibleLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: 'reverse'
                }}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-3 rounded-full mb-4 shadow-md"
              >
                <Clock className="h-8 w-8" />
              </motion.div>
              <p className="text-cyan-600 dark:text-cyan-400 font-medium">
                {isProcessing ? '准备处理中...' : '等待图片处理开始...'}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center max-w-xs">
                {isProcessing ? '正在初始化，请稍候...' : '处理日志将实时显示在此处'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              <AnimatePresence initial={false}>
                {visibleLogs.map((log, index) => {
                  const { icon, color, bgColor } = getLogTypeInfo(log)
                  return (
                    <motion.div
                      key={`${log.timestamp}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex items-start gap-3 p-2.5 rounded-lg ${bgColor} border border-slate-100 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-shadow`}
                    >
                      <div
                        className={`mt-0.5 flex-shrink-0 ${color} p-1.5 rounded-md bg-white/90 dark:bg-slate-800/90 shadow-sm`}
                      >
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs ${color} font-medium px-1.5 py-0.5 rounded-full bg-white/90 dark:bg-slate-800/90 border border-slate-100 dark:border-slate-800/50 flex-shrink-0`}
                          >
                            {formatTimestamp(log.timestamp)}
                          </span>
                          {log.percentage !== undefined && (
                            <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium px-1.5 py-0.5 rounded-full">
                              {log.percentage}%
                            </span>
                          )}
                          <span className="font-medium text-slate-700 dark:text-slate-300 break-words">
                            {log.message}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {/* 如果日志被截断，显示提示 */}
              {logs.length > MAX_VISIBLE_LOGS && !compactMode && (
                <div className="text-xs text-center text-slate-500 dark:text-slate-400 py-1">
                  仅显示最近 {MAX_VISIBLE_LOGS} 条日志，共 {logs.length} 条
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
