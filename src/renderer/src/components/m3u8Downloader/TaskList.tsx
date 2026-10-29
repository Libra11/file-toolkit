import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Download,
  FolderOpen,
  ListFilter,
  Pause,
  Play,
  RefreshCw,
  Search,
  SearchX,
  Trash2,
  X
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Panel, PanelBody, PanelHeader } from '@renderer/components/ui/panel'
import { SegmentedControl } from '@renderer/components/ui/segmented-control'
import { EmptyState, Notice, StatusDot } from '@renderer/components/ui/states'
import { DownloadStatus } from '@shared/types'
import { bytesToSize, formatTime, cn } from '@renderer/lib/utils'
import type { DownloadTask } from './types'

type TaskFilter = 'all' | 'completed' | 'downloading' | 'waiting' | 'paused' | 'failed'

interface TaskListProps {
  activeTasks: DownloadTask[]
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
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all')
  const [query, setQuery] = useState('')

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    const tasks = activeTasks.filter((task) => {
      switch (taskFilter) {
        case 'completed':
          return task.status === DownloadStatus.COMPLETED
        case 'downloading':
          return task.status === DownloadStatus.DOWNLOADING
        case 'waiting':
          return task.status === DownloadStatus.WAITING
        case 'paused':
          return task.status === DownloadStatus.PAUSED
        case 'failed':
          return [DownloadStatus.FAILED, DownloadStatus.CANCELLED].includes(task.status)
        default:
          return true
      }
    })

    if (!normalizedQuery) {
      return tasks
    }
    return tasks.filter((task) =>
      `${task.fileName} ${task.url}`.toLocaleLowerCase().includes(normalizedQuery)
    )
  }, [activeTasks, query, taskFilter])

  const taskCounts = useMemo(
    () => ({
      all: activeTasks.length,
      completed: activeTasks.filter((task) => task.status === DownloadStatus.COMPLETED).length,
      downloading: activeTasks.filter((task) => task.status === DownloadStatus.DOWNLOADING).length,
      waiting: activeTasks.filter((task) => task.status === DownloadStatus.WAITING).length,
      paused: activeTasks.filter((task) => task.status === DownloadStatus.PAUSED).length,
      failed: activeTasks.filter((task) =>
        [DownloadStatus.FAILED, DownloadStatus.CANCELLED].includes(task.status)
      ).length
    }),
    [activeTasks]
  )

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

  const getStatusTone = (status: DownloadStatus): 'neutral' | 'active' | 'success' | 'error' => {
    if (status === DownloadStatus.DOWNLOADING) return 'active'
    if (status === DownloadStatus.COMPLETED) return 'success'
    if (status === DownloadStatus.FAILED) return 'error'
    return 'neutral'
  }

  const filterOptions = [
    { value: 'all' as const, label: `${t('allTasks')} · ${taskCounts.all}` },
    {
      value: 'downloading' as const,
      label: `${t('downloadingTasks')} · ${taskCounts.downloading}`
    },
    { value: 'waiting' as const, label: `${t('waitingTasks')} · ${taskCounts.waiting}` },
    { value: 'paused' as const, label: `${t('taskStatusPaused')} · ${taskCounts.paused}` },
    { value: 'completed' as const, label: `${t('completedTasks')} · ${taskCounts.completed}` },
    { value: 'failed' as const, label: `${t('failedTasks')} · ${taskCounts.failed}` }
  ]

  const removableTaskIds = activeTasks
    .filter((task) =>
      [DownloadStatus.COMPLETED, DownloadStatus.FAILED, DownloadStatus.CANCELLED].includes(
        task.status
      )
    )
    .map((task) => task.id)

  return (
    <Panel>
      <PanelHeader
        eyebrow={t('downloadTasks')}
        title={t('activeTasks')}
        description={t('activeTasksDescription')}
        action={
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {filteredTasks.length} / {activeTasks.length}
            </span>
            {removableTaskIds.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => onClearTasks(removableTaskIds)}>
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                {t('clearCompleted')}
              </Button>
            )}
          </div>
        }
      />
      <PanelBody className="space-y-4 p-4">
        <div className="space-y-3 rounded-lg border border-border bg-muted/25 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground">
            <ListFilter className="h-3.5 w-3.5 text-muted-foreground" />
            {t('filterTasks')}
          </div>
          <SegmentedControl
            value={taskFilter}
            onChange={setTaskFilter}
            options={filterOptions}
            ariaLabel={t('filterTasks')}
            className="w-full"
          />
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`${t('search')} · ${t('fileName')} / URL`}
              aria-label={t('search')}
              className="bg-card pl-9 text-xs"
            />
          </div>
        </div>

        {activeTasks.length === 0 ? (
          <EmptyState
            icon={Download}
            title={t('activeTasks')}
            description={t('noDownloadTasksYet')}
          />
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={t('noTasksInThisCategory')}
            description={query || t('filterTasks')}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTaskFilter('all')
                  setQuery('')
                }}
              >
                {t('allTasks')}
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const progress = Math.min(100, Math.max(0, task.progress || 0))
              return (
                <article
                  key={task.id}
                  className="rounded-lg border border-border bg-background/35 p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <h3
                          className="max-w-full truncate text-sm font-medium text-foreground"
                          title={task.fileName}
                        >
                          {task.fileName}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <StatusDot tone={getStatusTone(task.status)} />
                          {getStatusText(task.status)}
                        </div>
                        {task.retries > 0 && (
                          <span className="text-[11px] text-muted-foreground">
                            {t('retryCount', { count: task.retries })}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 break-all font-mono text-[11px] leading-relaxed text-muted-foreground">
                        {task.url}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {task.status === DownloadStatus.DOWNLOADING && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void onPauseTask(task.id)}
                        >
                          <Pause className="mr-1.5 h-3.5 w-3.5" />
                          {t('pauseTask')}
                        </Button>
                      )}
                      {task.status === DownloadStatus.PAUSED && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void onResumeTask(task.id)}
                        >
                          <Play className="mr-1.5 h-3.5 w-3.5" />
                          {t('resumeTask')}
                        </Button>
                      )}
                      {task.status === DownloadStatus.FAILED && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void onRetryTask(task.id)}
                        >
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                          {t('retryTask')}
                        </Button>
                      )}
                      {[
                        DownloadStatus.DOWNLOADING,
                        DownloadStatus.PAUSED,
                        DownloadStatus.WAITING
                      ].includes(task.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void onCancelTask(task.id)}
                        >
                          <X className="mr-1.5 h-3.5 w-3.5" />
                          {t('cancelTask')}
                        </Button>
                      )}
                      {task.status === DownloadStatus.COMPLETED && task.outputPath && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (task.outputPath) void onOpenFileLocation(task.outputPath)
                          }}
                        >
                          <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
                          {t('openLocation')}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-mono font-medium text-foreground">{progress}%</span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {task.status === DownloadStatus.DOWNLOADING
                          ? `${bytesToSize(task.speed)}/s · ${formatTime(task.estimatedTimeRemaining)}`
                          : getStatusText(task.status)}
                      </span>
                    </div>
                    <div
                      className="h-1.5 overflow-hidden rounded-sm bg-muted"
                      role="progressbar"
                      aria-label={`${task.fileName} ${getStatusText(task.status)}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={progress}
                    >
                      <div
                        className={cn(
                          'h-full bg-primary transition-[width]',
                          task.status === DownloadStatus.FAILED && 'bg-destructive',
                          [DownloadStatus.PAUSED, DownloadStatus.CANCELLED].includes(task.status) &&
                            'bg-muted-foreground'
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <dl className="mt-4 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
                    <div className="bg-card px-3 py-2.5">
                      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {t('sizeLabel')}
                      </dt>
                      <dd className="mt-1 font-mono text-xs text-foreground">
                        {task.totalBytes > 0
                          ? `${bytesToSize(task.downloadedBytes)} / ${bytesToSize(task.totalBytes)}`
                          : `${bytesToSize(task.downloadedBytes)} / --`}
                      </dd>
                    </div>
                    <div className="bg-card px-3 py-2.5">
                      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {t('segmentsLabel')}
                      </dt>
                      <dd className="mt-1 font-mono text-xs text-foreground">
                        {task.downloadedSegments} / {task.totalSegments || '--'}
                      </dd>
                    </div>
                    <div className="bg-card px-3 py-2.5">
                      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {t('startTimeLabel')}
                      </dt>
                      <dd className="mt-1 font-mono text-xs text-foreground">
                        {task.startTime ? new Date(task.startTime).toLocaleTimeString() : '--'}
                      </dd>
                    </div>
                  </dl>

                  {task.error && (
                    <Notice
                      tone="error"
                      title={getStatusText(task.status)}
                      description={task.error}
                      className="mt-3"
                    />
                  )}
                </article>
              )
            })}
          </div>
        )}
      </PanelBody>
    </Panel>
  )
}
