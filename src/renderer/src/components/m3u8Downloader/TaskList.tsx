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
import { Card, CardHeader, CardTitle, CardDescription } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Progress } from '@renderer/components/ui/progress'
import { Badge } from '@renderer/components/ui/badge'
import { DownloadStatus } from '@shared/types'
import { bytesToSize, formatTime } from '@renderer/lib/utils'

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

  return (
    <Card className="w-full shadow-lg border-primary/20">
      <CardHeader className="py-3 flex flex-row items-center justify-between bg-muted/50">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-primary" />
            {t('activeTasks') || '下载任务列表'}
            <Badge variant="outline">{activeTasks.length}</Badge>
          </CardTitle>
          <CardDescription>
            {t('activeTasksDescription') || '查看和管理所有下载任务'}
          </CardDescription>
        </div>

        {/* 全局操作按钮 */}
        {activeTasks.some((task) =>
          [DownloadStatus.COMPLETED, DownloadStatus.FAILED, DownloadStatus.CANCELLED].includes(
            task.status
          )
        ) && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // 清除已完成和失败的任务
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
              title={t('clearCompletedTasks')}
            >
              <X className="h-4 w-4 mr-1" />
              {t('clearCompleted') || '清除已完成'}
            </Button>
          </div>
        )}
      </CardHeader>

      {/* 任务筛选器 */}
      <div className="px-4 py-2 bg-muted/30 border-t border-b">
        <span className="text-sm font-medium mr-2">{t('filterTasks') || '任务筛选'}:</span>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={taskFilter === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setTaskFilter('all')}
            className="h-7 text-xs"
          >
            {t('allTasks') || '所有任务'}
            <Badge variant="outline" className="ml-1 text-[10px] h-4 min-w-[1.5rem]">
              {taskCounts.all}
            </Badge>
          </Button>
          <Button
            variant={taskFilter === 'completed' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setTaskFilter('completed')}
            className="h-7 text-xs"
          >
            {t('completedTasks') || '已完成的任务'}
            <Badge variant="outline" className="ml-1 text-[10px] h-4 min-w-[1.5rem]">
              {taskCounts.completed}
            </Badge>
          </Button>
          <Button
            variant={taskFilter === 'downloading' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setTaskFilter('downloading')}
            className="h-7 text-xs"
          >
            {t('downloadingTasks') || '下载中的任务'}
            <Badge variant="outline" className="ml-1 text-[10px] h-4 min-w-[1.5rem]">
              {taskCounts.downloading}
            </Badge>
          </Button>
          <Button
            variant={taskFilter === 'waiting' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setTaskFilter('waiting')}
            className="h-7 text-xs"
          >
            {t('waitingTasks') || '未开始的任务'}
            <Badge variant="outline" className="ml-1 text-[10px] h-4 min-w-[1.5rem]">
              {taskCounts.waiting}
            </Badge>
          </Button>
          <Button
            variant={taskFilter === 'failed' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setTaskFilter('failed')}
            className="h-7 text-xs"
          >
            {t('failedTasks') || '下载失败的任务'}
            <Badge variant="outline" className="ml-1 text-[10px] h-4 min-w-[1.5rem]">
              {taskCounts.failed}
            </Badge>
          </Button>
        </div>
      </div>

      {activeTasks.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          <Download className="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p>还没有下载任务。开始下载后，任务将显示在这里。</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p>{t('noTasksInThisCategory') || '该分类下没有任务'}</p>
        </div>
      ) : (
        <div className="divide-y">
          {filteredTasks.map((task) => (
            <div key={task.id} className="p-4 transition-colors hover:bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {getStatusIcon(task.status)}
                  <span className="font-medium ml-2 truncate max-w-[300px]">{task.fileName}</span>
                  <Badge variant="outline" className="ml-2">
                    {getStatusText(task.status)}
                  </Badge>
                  {task.retries > 0 && (
                    <Badge variant="outline" className="ml-2 text-amber-500">
                      {t('retryCount', { count: task.retries }) || `重试次数: ${task.retries}`}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {task.status === DownloadStatus.DOWNLOADING && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPauseTask(task.id)}
                      title={t('pauseTask') || '暂停'}
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
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  {task.status === DownloadStatus.COMPLETED && task.outputPath && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenFileLocation(task.outputPath!)}
                      className="text-green-600 border-green-600/30 hover:bg-green-600/10"
                      title={t('openLocation') || '打开文件位置'}
                    >
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="text-sm text-muted-foreground mb-2 truncate w-full">{task.url}</div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs mb-1">
                  <span>
                    {task.progress}%
                    {task.totalSegments > 0 && (
                      <span className="ml-1">
                        (
                        {t('segmentsProgress', {
                          downloaded: task.downloadedSegments,
                          total: task.totalSegments
                        }) || `${task.downloadedSegments}/${task.totalSegments} 片段`}
                        )
                      </span>
                    )}
                  </span>
                  {task.status === DownloadStatus.DOWNLOADING && (
                    <span className="text-primary">
                      {bytesToSize(task.speed)}/s • {formatTime(task.estimatedTimeRemaining)}
                    </span>
                  )}
                </div>
                <Progress
                  value={task.progress}
                  className="h-2"
                  indicatorClassName={
                    task.status === DownloadStatus.COMPLETED
                      ? 'bg-green-500'
                      : task.status === DownloadStatus.FAILED
                        ? 'bg-destructive'
                        : task.status === DownloadStatus.PAUSED
                          ? 'bg-amber-500'
                          : task.status === DownloadStatus.DOWNLOADING
                            ? 'animate-pulse bg-primary'
                            : undefined
                  }
                />
              </div>

              {task.error && <div className="mt-2 text-sm text-destructive">{task.error}</div>}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
