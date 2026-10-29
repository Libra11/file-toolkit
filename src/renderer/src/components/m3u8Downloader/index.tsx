import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  DownloadCloud,
  Gauge,
  ListChecks,
  ListPlus,
  X
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { SegmentedControl } from '@renderer/components/ui/segmented-control'
import { Notice } from '@renderer/components/ui/states'
import { bytesToSize, cn } from '@renderer/lib/utils'
import TaskList from './TaskList'
import DownloadForm from './DownloadForm'
import type { DownloadTask, DownloadOptions } from './types'
import { DownloadStatus } from '@shared/types'

interface M3u8DownloadToolProps {
  onBack?: () => void
}

export default function M3u8DownloadTool({ onBack }: M3u8DownloadToolProps): JSX.Element {
  const { t } = useTranslation()
  const [mainTab, setMainTab] = useState('create')
  const [error, setError] = useState('')
  const [activeTasks, setActiveTasks] = useState<DownloadTask[]>([])
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Navigation remains host-owned; the legacy home button is intentionally not rendered.
  void onBack

  const fetchTasksStatus = useCallback(async (): Promise<void> => {
    try {
      const tasks = await window.m3u8Download.getAllTasks()
      if (tasks && Array.isArray(tasks)) {
        setActiveTasks(tasks)
      }
    } catch (fetchError) {
      console.error('获取任务状态错误:', fetchError)
    }
  }, [])

  useEffect(() => {
    void fetchTasksStatus()
    pollingRef.current = setInterval(() => void fetchTasksStatus(), 1000)

    return (): void => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [fetchTasksStatus])

  const handleSingleDownload = async (
    url: string,
    fileName: string,
    outputDir: string,
    options: DownloadOptions
  ): Promise<void> => {
    try {
      setError('')
      await window.m3u8Download.downloadM3u8(url, outputDir, fileName, options)
      await fetchTasksStatus()
      setMainTab('tasks')
    } catch (downloadError) {
      console.error('下载错误:', downloadError)
      setError(`${t('downloadError')}: ${downloadError}`)
      throw downloadError
    }
  }

  const handleBatchDownload = async (
    batchInput: string,
    outputDir: string,
    options: DownloadOptions
  ): Promise<void> => {
    try {
      setError('')
      const lines = batchInput
        .trim()
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      if (lines.length === 0) {
        setError(t('noBatchInputFound'))
        throw new Error(t('noBatchInputFound'))
      }

      const processedLines = lines.map((line) => {
        if (line.includes('----')) {
          return line
        }

        try {
          const url = new URL(line)
          const pathParts = url.pathname.split('/')
          const fileName =
            pathParts[pathParts.length - 1].replace(/\.[^/.]+$/, '') || `下载文件_${Date.now()}`
          return `${line}----${fileName}`
        } catch {
          return `${line}----视频_${Date.now()}`
        }
      })

      await window.m3u8Download.batchDownloadM3u8(processedLines, outputDir, options)
      await fetchTasksStatus()
      setMainTab('tasks')
    } catch (downloadError) {
      console.error('批量下载错误:', downloadError)
      setError(`${t('batchDownloadError')}: ${downloadError}`)
      throw downloadError
    }
  }

  const handlePauseTask = async (taskId: string): Promise<void> => {
    try {
      await window.m3u8Download.pauseTask(taskId)
      await fetchTasksStatus()
    } catch (taskError) {
      console.error('暂停任务错误:', taskError)
      setError(`${t('pauseTaskError')}: ${taskError}`)
    }
  }

  const handleResumeTask = async (taskId: string): Promise<void> => {
    try {
      await window.m3u8Download.resumeTask(taskId)
      await fetchTasksStatus()
    } catch (taskError) {
      console.error('恢复任务错误:', taskError)
      setError(`${t('resumeTaskError')}: ${taskError}`)
    }
  }

  const handleCancelTask = async (taskId: string): Promise<void> => {
    try {
      await window.m3u8Download.cancelTask(taskId)
      await fetchTasksStatus()
    } catch (taskError) {
      console.error('取消任务错误:', taskError)
      setError(`${t('cancelTaskError')}: ${taskError}`)
    }
  }

  const handleRetryTask = async (taskId: string): Promise<void> => {
    try {
      await window.m3u8Download.retryTask(taskId)
      await fetchTasksStatus()
    } catch (taskError) {
      console.error('重试任务错误:', taskError)
      setError(`${t('retryTaskError')}: ${taskError}`)
    }
  }

  const handleOpenFileLocation = async (filePath: string): Promise<void> => {
    try {
      await window.system.openFileLocation(filePath)
    } catch (openError) {
      console.error('打开文件位置错误:', openError)
      setError(`${t('openFileLocationError')}: ${openError}`)
    }
  }

  const handleClearTasks = (taskIds: string[]): void => {
    window.m3u8Download.clearTasks(taskIds)
    setActiveTasks((prev) => prev.filter((task) => !taskIds.includes(task.id)))
  }

  const summary = useMemo(() => {
    const downloading = activeTasks.filter((task) => task.status === DownloadStatus.DOWNLOADING)
    const totalSpeed = downloading.reduce((total, task) => total + (task.speed || 0), 0)

    return {
      total: activeTasks.length,
      downloading: downloading.length,
      completed: activeTasks.filter((task) => task.status === DownloadStatus.COMPLETED).length,
      waiting: activeTasks.filter((task) => task.status === DownloadStatus.WAITING).length,
      failed: activeTasks.filter((task) =>
        [DownloadStatus.FAILED, DownloadStatus.CANCELLED].includes(task.status)
      ).length,
      avgSpeed: downloading.length > 0 ? totalSpeed / downloading.length : 0
    }
  }, [activeTasks])

  const stats = [
    { key: 'total', label: t('allTasks'), value: summary.total, Icon: DownloadCloud },
    {
      key: 'downloading',
      label: t('downloadingTasks'),
      value: summary.downloading,
      Icon: Activity
    },
    { key: 'waiting', label: t('waitingTasks'), value: summary.waiting, Icon: Clock3 },
    {
      key: 'completed',
      label: t('completedTasks'),
      value: summary.completed,
      Icon: CheckCircle2
    },
    { key: 'failed', label: t('failedTasks'), value: summary.failed, Icon: AlertCircle },
    {
      key: 'averageSpeed',
      label: t('averageSpeed'),
      value: summary.avgSpeed > 0 ? `${bytesToSize(summary.avgSpeed)}/s` : '--',
      Icon: Gauge
    }
  ]

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="mx-auto max-w-[1700px] space-y-5 p-4 md:p-6">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
          {stats.map(({ key, label, value, Icon }) => (
            <div key={key} className="flex items-center justify-between gap-3 bg-card px-4 py-3">
              <div>
                <dt className="text-[11px] text-muted-foreground">{label}</dt>
                <dd className="mt-1 font-mono text-xl font-semibold text-foreground">{value}</dd>
              </div>
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
          ))}
        </dl>

        {error && (
          <Notice
            tone="error"
            title={t('downloadError')}
            description={error}
            action={
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setError('')}
                aria-label={t('close')}
              >
                <X className="h-4 w-4" />
              </Button>
            }
          />
        )}

        <SegmentedControl
          value={mainTab}
          onChange={setMainTab}
          options={[
            { value: 'create', label: t('createDownload'), icon: ListPlus },
            {
              value: 'tasks',
              label: `${t('downloadTasks')} · ${activeTasks.length}`,
              icon: ListChecks
            }
          ]}
          ariaLabel={t('m3u8Download')}
          className="grid w-full grid-cols-2 xl:hidden"
        />

        <div className="grid items-start gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className={cn('min-w-0', mainTab === 'tasks' && 'hidden xl:block')}>
            <DownloadForm
              onSingleDownload={handleSingleDownload}
              onBatchDownload={handleBatchDownload}
              onSetActiveTab={setMainTab}
            />
          </div>
          <div className={cn('min-w-0', mainTab === 'create' && 'hidden xl:block')}>
            <TaskList
              activeTasks={activeTasks}
              onPauseTask={handlePauseTask}
              onResumeTask={handleResumeTask}
              onCancelTask={handleCancelTask}
              onRetryTask={handleRetryTask}
              onOpenFileLocation={handleOpenFileLocation}
              onClearTasks={handleClearTasks}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
