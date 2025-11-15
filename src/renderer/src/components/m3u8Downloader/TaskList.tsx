/**
 * Author: Libra
 * Date: 2025-05-15 17:32:27
 * LastEditors: Libra
 * Description:
 */
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Download,
  X,
  AlertCircle,
  CheckCircle,
  FolderOpen,
  Play,
  Pause,
  RefreshCw,
  Clock,
  BarChart2,
  AlertTriangle
} from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Progress } from '@renderer/components/ui/progress'
import { Badge } from '@renderer/components/ui/badge'
import { DownloadStatus } from '@shared/types'
import { bytesToSize, formatTime, cn } from '@renderer/lib/utils'

interface TaskListProps {
  activeTasks: Array<{
    id: string
    url: string
    fileName: string
    status: DownloadStatus
    progress: number
    speed: number
    estimatedTimeRemaining: number
    error?: string
    retries: number
    totalSegments: number
    downloadedSegments: number
    totalBytes: number
    downloadedBytes: number
    startTime?: number
    outputPath?: string
  }>
  onPauseTask: (taskId: string) => Promise<void>
  onResumeTask: (taskId: string) => Promise<void>
  onCancelTask: (taskId: string) => Promise<void>
  onRetryTask: (taskId: string) => Promise<void>
  onOpenFileLocation: (filePath: string) => Promise<void>
  onClearTasks: (taskIds: string[]) => void
}

export default function TaskList({
  activeTasks,
  onPauseTask,
  onResumeTask,
  onCancelTask,
  onRetryTask,
  onOpenFileLocation,
  onClearTasks
}: TaskListProps): JSX.Element {
  const { t } = useTranslation()
  const [taskFilter, setTaskFilter] = useState<
    'all' | 'completed' | 'downloading' | 'waiting' | 'failed'
  >('all')

  // 根据筛选条件过滤任务
  const filteredTasks = useMemo(() => {
    switch (taskFilter) {
      case 'completed':
        return activeTasks.filter((task) => task.status === DownloadStatus.COMPLETED)
      case 'downloading':
        return activeTasks.filter((task) => task.status === DownloadStatus.DOWNLOADING)
      case 'waiting':
        return activeTasks.filter((task) => task.status === DownloadStatus.WAITING)
      case 'failed':
        return activeTasks.filter(
          (task) =>
            task.status === DownloadStatus.FAILED || task.status === DownloadStatus.CANCELLED
        )
      default:
        return activeTasks
    }
  }, [activeTasks, taskFilter])

  // 计算每个分类下的任务数量
  const taskCounts = useMemo(() => {
    return {
      all: activeTasks.length,
      completed: activeTasks.filter((task) => task.status === DownloadStatus.COMPLETED).length,
      downloading: activeTasks.filter((task) => task.status === DownloadStatus.DOWNLOADING).length,
      waiting: activeTasks.filter((task) => task.status === DownloadStatus.WAITING).length,
      failed: activeTasks.filter(
        (task) => task.status === DownloadStatus.FAILED || task.status === DownloadStatus.CANCELLED
      ).length
    }
  }, [activeTasks])

  // 获取任务状态图标
  const getStatusIcon = (status: DownloadStatus): JSX.Element => {
    switch (status) {
      case DownloadStatus.DOWNLOADING:
        return <Download className="w-4 h-4 text-primary animate-pulse" />
      case DownloadStatus.PAUSED:
        return <Pause className="w-4 h-4 text-amber-500" />
      case DownloadStatus.COMPLETED:
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case DownloadStatus.FAILED:
        return <AlertCircle className="w-4 h-4 text-destructive" />
      case DownloadStatus.CANCELLED:
        return <X className="w-4 h-4 text-muted-foreground" />
      case DownloadStatus.WAITING:
        return <Clock className="w-4 h-4 text-blue-500" />
      default:
        return <Download className="w-4 h-4" />
    }
  }

  // 获取任务状态文本
  const getStatusText = (status: DownloadStatus): string => {
    switch (status) {
      case DownloadStatus.DOWNLOADING:
        return t('taskStatusDownloading')
      case DownloadStatus.PAUSED:
        return t('taskStatusPaused')
      case DownloadStatus.COMPLETED:
        return t('taskStatusCompleted')
      case DownloadStatus.FAILED:
        return t('taskStatusFailed')
      case DownloadStatus.CANCELLED:
        return t('taskStatusCancelled')
      case DownloadStatus.WAITING:
        return t('taskStatusWaiting')
      default:
        return status
    }
  }

  const filterOptions: Array<{
    key: 'all' | 'completed' | 'downloading' | 'waiting' | 'failed'
    label: string
    count: number
  }> = [
    { key: 'all', label: t('allTasks') || '所有任务', count: taskCounts.all },
    { key: 'completed', label: t('completedTasks') || '已完成', count: taskCounts.completed },
    { key: 'downloading', label: t('downloadingTasks') || '下载中', count: taskCounts.downloading },
    { key: 'waiting', label: t('waitingTasks') || '排队中', count: taskCounts.waiting },
    { key: 'failed', label: t('failedTasks') || '失败/取消', count: taskCounts.failed }
  ]

  return (
    <Card className="w-full border border-blue-100/60 bg-white/95 shadow-xl shadow-blue-900/10 backdrop-blur-sm dark:border-blue-500/30 dark:bg-slate-900/70">
      <CardHeader className="border-b border-white/60 pb-5 dark:border-white/10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-white">
              <BarChart2 className="h-5 w-5 text-blue-500" />
              {t('activeTasks') || '下载任务列表'}
              <Badge variant="outline" className="ml-1">
                {activeTasks.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
              {t('activeTasksDescription') || '查看和管理所有下载任务'}
            </CardDescription>
          </div>
          {activeTasks.some((task) =>
            [DownloadStatus.COMPLETED, DownloadStatus.FAILED, DownloadStatus.CANCELLED].includes(
              task.status
            )
          ) && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-slate-200/70 bg-white/80 text-slate-600 hover:text-destructive dark:border-slate-700 dark:bg-slate-900"
              onClick={() => {
                const tasksToRemove = activeTasks
                  .filter((task) =>
                    [
                      DownloadStatus.COMPLETED,
                      DownloadStatus.FAILED,
                      DownloadStatus.CANCELLED
                    ].includes(task.status)
                  )
                  .map((task) => task.id)

                onClearTasks(tasksToRemove)
              }}
            >
              <X className="h-4 w-4 mr-1" />
              {t('clearCompleted') || '清除已完成'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {t('filterTasks') || '任务筛选'}
          </span>
          <div className="mt-3 flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <Button
                key={option.key}
                variant={taskFilter === option.key ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(
                  'h-8 rounded-full border border-transparent px-4 text-xs font-semibold shadow-none',
                  taskFilter === option.key
                    ? 'bg-blue-500/10 text-blue-600 border-blue-500/40 dark:bg-blue-500/20 dark:text-blue-100'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
                onClick={() => setTaskFilter(option.key)}
              >
                {option.label}
                <Badge
                  variant="outline"
                  className="ml-2 h-4 min-w-[1.8rem] rounded-full border-blue-200/70 text-[10px] text-blue-600 dark:border-blue-500/50 dark:text-blue-100"
                >
                  {option.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {activeTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200/70 bg-white/85 p-8 text-center text-muted-foreground dark:border-slate-700 dark:bg-slate-900/60">
            <Download className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p>
              {t('noDownloadTasksYet', {
                defaultValue: '还没有下载任务，开始一个任务后即可在此跟踪进度。'
              })}
            </p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-amber-200/70 bg-amber-50/80 p-6 text-center text-amber-600 dark:border-amber-500/40 dark:bg-amber-500/10">
            <AlertTriangle className="w-10 h-10 mx-auto mb-2" />
            <p>{t('noTasksInThisCategory') || '该分类下没有任务'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm transition hover:border-blue-200/80 dark:border-slate-700 dark:bg-slate-900/60"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {getStatusIcon(task.status)}
                      <span className="truncate max-w-[240px] sm:max-w-[320px]">{task.fileName}</span>
                      <Badge variant="outline" className="border-slate-200 text-xs text-slate-600 dark:border-slate-600 dark:text-slate-200">
                        {getStatusText(task.status)}
                      </Badge>
                      {task.retries > 0 && (
                        <Badge variant="outline" className="border-amber-300/60 bg-amber-50 text-amber-600 dark:border-amber-500/60 dark:bg-amber-500/20 dark:text-amber-100">
                          {t('retryCount', { count: task.retries }) || `重试: ${task.retries}`}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground break-all">{task.url}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {task.status === DownloadStatus.DOWNLOADING && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPauseTask(task.id)}
                        title={t('pauseTask') || '暂停'}
                        className="rounded-full"
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {task.status === DownloadStatus.PAUSED && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onResumeTask(task.id)}
                        title={t('resumeTask') || '继续'}
                        className="rounded-full"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {task.status === DownloadStatus.FAILED && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRetryTask(task.id)}
                        title={t('retryTask') || '重试'}
                        className="rounded-full"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                    {[
                      DownloadStatus.DOWNLOADING,
                      DownloadStatus.PAUSED,
                      DownloadStatus.WAITING
                    ].includes(task.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCancelTask(task.id)}
                        title={t('cancelTask') || '取消'}
                        className="rounded-full border-destructive/40 text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {task.status === DownloadStatus.COMPLETED && task.outputPath && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenFileLocation(task.outputPath!)}
                        className="rounded-full border-green-500/40 text-green-600 hover:bg-green-500/10"
                        title={t('openLocation') || '打开文件位置'}
                      >
                        <FolderOpen className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>
                          {t('progressLabel', {
                            defaultValue: '进度'
                          })}
                        </span>
                      {task.status === DownloadStatus.DOWNLOADING && (
                        <span className="text-blue-600 dark:text-blue-300">
                          {bytesToSize(task.speed)}/s · {formatTime(task.estimatedTimeRemaining)}
                        </span>
                      )}
                    </div>
                    <Progress
                      value={task.progress}
                      className="h-2.5 rounded-full"
                      indicatorClassName={
                        task.status === DownloadStatus.COMPLETED
                          ? 'bg-green-500'
                          : task.status === DownloadStatus.FAILED
                            ? 'bg-destructive'
                            : task.status === DownloadStatus.PAUSED
                              ? 'bg-amber-500'
                              : task.status === DownloadStatus.DOWNLOADING
                                ? 'animate-pulse bg-blue-500'
                                : undefined
                      }
                    />
                    <div className="text-xs text-slate-500">
                      {task.progress}%
                      {task.totalSegments > 0 && (
                        <span className="ml-2">
                          (
                          {t('segmentsProgress', {
                            downloaded: task.downloadedSegments,
                            total: task.totalSegments
                          }) || `${task.downloadedSegments}/${task.totalSegments} 片段`}
                          )
                        </span>
                      )}
                    </div>
                  </div>

                    <div className="space-y-2 rounded-xl border border-slate-200/60 bg-white/70 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                      <p className="font-medium text-slate-700 dark:text-slate-200">
                        {t('sizeLabel', { defaultValue: '数据量' })}
                      </p>
                    {task.totalBytes > 0 ? (
                      <p className="font-mono">
                        {bytesToSize(task.downloadedBytes)} / {bytesToSize(task.totalBytes)}
                      </p>
                    ) : (
                      <p className="text-slate-500 dark:text-slate-400">--</p>
                    )}
                    {task.startTime && (
                      <p className="text-[11px] text-slate-400">
                        {t('startTimeLabel', { defaultValue: '开始时间' })}: {new Date(task.startTime).toLocaleTimeString()}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 rounded-xl border border-slate-200/60 bg-white/70 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                    <p className="font-medium text-slate-700 dark:text-slate-200">
                      {t('segmentsLabel', { defaultValue: '分片状态' })}
                    </p>
                    <p>
                      {task.downloadedSegments}/{task.totalSegments || '∞'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {t('retryCount', { count: task.retries }) || `重试: ${task.retries}`}
                    </p>
                  </div>
                </div>

                {task.error && (
                  <div className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                    {task.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
