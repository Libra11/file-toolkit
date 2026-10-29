/**
 * Author: Libra
 * Date: 2025-04-27 15:30:00
 * LastEditors: Libra
 * Description: 图片处理日志查看器
 */
import { useEffect, useRef, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
  Eye
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Switch } from '@renderer/components/ui/switch'
import { Label } from '@renderer/components/ui/label'
import { EmptyState, StatusDot } from '@renderer/components/ui/states'

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
  const { t } = useTranslation()
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

    return undefined
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
      case '结果输出':
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
  const getLogTypeInfo = (log: ProcessLogMessage): { icon: JSX.Element; color: string } => {
    const stepIcon = getStepIcon(log.step)

    switch (log.type) {
      case 'info':
        return {
          icon: stepIcon,
          color: 'text-muted-foreground'
        }
      case 'success':
        return {
          icon: <Check className="h-4 w-4" />,
          color: 'text-primary'
        }
      case 'warn':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          color: 'text-foreground'
        }
      case 'error':
        return {
          icon: <AlertOctagon className="h-4 w-4" />,
          color: 'text-destructive'
        }
      default:
        return {
          icon: stepIcon,
          color: 'text-muted-foreground'
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

  const getLocalizedStep = (step?: string): string => {
    if (!step) return ''
    if (step.includes('平铺')) return t('imageOrganizeStepFlatten')
    if (step.includes('分类')) return t('imageOrganizeStepMatch')
    if (step.includes('重命名')) return t('imageOrganizeStepRename')
    if (step.includes('压缩')) return t('imageOrganizeStepCompress')
    if (step.includes('输出')) return t('imageOrganizeStepCleanup')
    if (step.includes('清理')) return t('imageOrganizeStepCleanDirectory')
    if (step.includes('准备')) return t('preparing')
    if (step.includes('完成')) return t('processingComplete')
    if (step.includes('错误') || step.includes('失败')) return t('processingFailed')
    if (step.includes('处理中')) return t('processing')
    return step
  }

  const stats = getStepStats()
  const latestLogType = logs[logs.length - 1]?.type
  const consoleTone = isProcessing
    ? 'active'
    : latestLogType === 'error'
      ? 'error'
      : currentProgress >= 100
        ? 'success'
        : 'neutral'

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-3 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground">
            <StatusDot tone={consoleTone} />
            <span className="text-primary">
              {getStepIcon(
                currentStep.includes('平铺')
                  ? '文件平铺'
                  : currentStep.includes('分类')
                    ? '文件分类'
                    : currentStep.includes('重命名')
                      ? '文件重命名'
                      : currentStep.includes('压缩')
                        ? '图片压缩'
                        : currentStep.includes('输出')
                          ? '结果输出'
                          : currentStep.includes('清理')
                            ? '清理目录'
                            : currentStep.includes('完成')
                              ? '完成'
                              : currentStep.includes('错误')
                                ? '错误'
                                : ''
              )}
            </span>
            <span className="truncate">
              {getLocalizedStep(currentStep) || t('imageOrganizeStatusIdle')}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {compactMode
              ? t('imageOrganizeKeyLogs')
              : t('imageOrganizeRecentLogs', {
                  count: Math.min(logs.length, MAX_VISIBLE_LOGS)
                })}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="font-mono text-xs font-semibold text-primary">{currentProgress}%</span>
          <div className="flex items-center gap-2 border-l border-border pl-3">
            <Switch
              id="compact-mode"
              checked={compactMode}
              onCheckedChange={toggleCompactMode}
              className="data-[state=checked]:bg-primary"
            />
            <Label htmlFor="compact-mode" className="text-[11px] font-normal text-muted-foreground">
              {t('imageOrganizeCompactMode')}
            </Label>
          </div>
        </div>
      </div>

      <div ref={scrollAreaRef} className="h-[330px] overflow-y-auto bg-muted/20">
        {visibleLogs.length === 0 ? (
          <EmptyState
            icon={Clock}
            title={isProcessing ? t('preparing') : t('readyToStart')}
            description={
              isProcessing ? t('imageOrganizeStatusRunning') : t('imageOrganizeLogsDescription')
            }
            className="h-full min-h-0 rounded-none border-0 bg-transparent"
          />
        ) : (
          <div className="font-mono text-[11px]">
            {visibleLogs.map((log, index) => {
              const { icon, color } = getLogTypeInfo(log)
              return (
                <div
                  key={`${log.timestamp}-${index}`}
                  className="grid grid-cols-[72px_16px_minmax(0,1fr)_auto] items-start gap-2 border-b border-border/60 px-3 py-2.5 last:border-b-0"
                >
                  <time
                    dateTime={log.timestamp}
                    className="whitespace-nowrap text-[10px] leading-4 text-muted-foreground"
                  >
                    {formatTimestamp(log.timestamp)}
                  </time>
                  <span className={`leading-4 ${color}`} title={getLocalizedStep(log.step)}>
                    {icon}
                  </span>
                  <span className="min-w-0 whitespace-pre-wrap break-words leading-4 text-foreground">
                    {log.message}
                  </span>
                  <span className="whitespace-nowrap text-[10px] leading-4 text-muted-foreground">
                    {log.percentage !== undefined ? `${log.percentage}%` : ''}
                  </span>
                </div>
              )
            })}

            {/* 如果日志被截断，显示提示 */}
            {logs.length > MAX_VISIBLE_LOGS && !compactMode && (
              <div className="px-3 py-2 text-center text-[10px] text-muted-foreground">
                {t('imageOrganizeLogsTruncated', {
                  visible: MAX_VISIBLE_LOGS,
                  total: logs.length
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {(stats.current > 0 || !autoScroll) && (
        <div className="flex min-h-9 items-center justify-between gap-3 border-t border-border bg-muted/30 px-3 py-1.5">
          <span className="text-[11px] text-muted-foreground">
            {stats.current > 0 ? `${t('imageOrganizeFilesProcessed')}: ${stats.current}` : ''}
          </span>
          {!autoScroll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={scrollToBottom}
              className="h-7 px-2 text-[11px]"
            >
              <Eye className="mr-1.5 h-3 w-3" />
              {t('imageOrganizeScrollToLatest')}
            </Button>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
        <List className="h-3 w-3" />
        {compactMode ? t('imageOrganizeKeyLogs') : t('processingLogs')}
      </div>
    </div>
  )
}
