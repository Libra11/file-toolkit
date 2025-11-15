/**
 * Author: Libra
 * Date: 2025-07-03 17:08:54
 * LastEditors: Libra
 * Description:
 */
import { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DownloadCloud,
  Sparkles,
  ShieldCheck,
  Activity,
  Clock,
  Gauge,
  AlertCircle
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@renderer/components/ui/tabs'
import { Badge } from '@renderer/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@renderer/components/ui/alert'
import { bytesToSize } from '@renderer/lib/utils'
import TaskList from './TaskList'
import DownloadForm from './DownloadForm'
import { DownloadTask, DownloadOptions } from './types'
import { DownloadStatus } from '@shared/types'

export default function M3u8DownloadTool(): JSX.Element {
  const { t } = useTranslation()
  const [mainTab, setMainTab] = useState<string>('create')
  const [error, setError] = useState('')
  const [activeTasks, setActiveTasks] = useState<DownloadTask[]>([])

  // 用于轮询任务状态
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // 监听任务状态变化
  useEffect(() => {
    // 组件挂载时立即获取一次状态
    fetchTasksStatus()

    // 启动轮询（不论是否有活动任务）
    pollingRef.current = setInterval(fetchTasksStatus, 1000)

    return (): void => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, []) // 空依赖数组，只在组件挂载和卸载时执行

  // 轮询获取任务状态
  const fetchTasksStatus = async (): Promise<void> => {
    try {
      console.log('正在获取下载任务状态...')
      const tasks = await window.m3u8Download.getAllTasks()
      console.log('获取到任务:', tasks)

      if (tasks && Array.isArray(tasks)) {
        setActiveTasks(tasks)
      } else {
        console.error('获取任务状态失败: 未返回有效数据')
      }
    } catch (error) {
      console.error('获取任务状态错误:', error)
      // 5秒后自动重试一次
      setTimeout(fetchTasksStatus, 5000)
    }
  }

  // 处理单个下载
  const handleSingleDownload = async (
    url: string,
    fileName: string,
    outputDir: string,
    options: DownloadOptions
  ): Promise<void> => {
    try {
      setError('')

      // 实际调用下载API
      const taskId = await window.m3u8Download.downloadM3u8(url, outputDir, fileName, options)

      console.log('开始下载任务，ID:', taskId)

      // 立即获取一次状态，不等待轮询
      await fetchTasksStatus()

      // 下载开始后自动切换到下载列表标签页
      setMainTab('tasks')
    } catch (error) {
      console.error('下载错误:', error)
      setError(`${t('downloadError')}: ${error}`)
      throw error // 向上抛出错误让表单组件处理
    }
  }

  // 处理批量下载
  const handleBatchDownload = async (
    batchInput: string,
    outputDir: string,
    options: DownloadOptions
  ): Promise<void> => {
    try {
      setError('')

      // 解析输入行
      const lines = batchInput
        .trim()
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      if (lines.length === 0) {
        setError(t('noBatchInputFound'))
        throw new Error(t('noBatchInputFound'))
      }

      // 解析并标准化每一行
      const processedLines = lines.map((line) => {
        // 如果包含分隔符
        if (line.includes('----')) {
          return line
        }

        // 如果是纯URL，尝试从URL中提取文件名
        try {
          const url = new URL(line)
          const pathParts = url.pathname.split('/')
          const fileName =
            pathParts[pathParts.length - 1].replace(/\.[^/.]+$/, '') || `下载文件_${Date.now()}`
          return `${line}----${fileName}`
        } catch {
          // 如果不是有效URL，直接返回
          return `${line}----视频_${Date.now()}`
        }
      })

      console.log('处理后的批量下载行:', processedLines)

      // 调用批量下载
      const taskIds = await window.m3u8Download.batchDownloadM3u8(
        processedLines,
        outputDir,
        options
      )

      console.log('开始批量下载任务，ID列表:', taskIds)

      // 立即获取一次状态，不等待轮询
      await fetchTasksStatus()

      // 下载开始后自动切换到下载列表标签页
      setMainTab('tasks')
    } catch (error) {
      console.error('批量下载错误:', error)
      setError(`${t('batchDownloadError')}: ${error}`)
      throw error // 向上抛出错误让表单组件处理
    }
  }

  // 暂停任务
  const handlePauseTask = async (taskId: string): Promise<void> => {
    try {
      await window.m3u8Download.pauseTask(taskId)
      await fetchTasksStatus() // 刷新任务状态
    } catch (error) {
      console.error('暂停任务错误:', error)
      setError(`${t('pauseTaskError')}: ${error}`)
    }
  }

  // 恢复任务
  const handleResumeTask = async (taskId: string): Promise<void> => {
    try {
      await window.m3u8Download.resumeTask(taskId)
      await fetchTasksStatus() // 刷新任务状态
    } catch (error) {
      console.error('恢复任务错误:', error)
      setError(`${t('resumeTaskError')}: ${error}`)
    }
  }

  // 取消任务
  const handleCancelTask = async (taskId: string): Promise<void> => {
    try {
      await window.m3u8Download.cancelTask(taskId)
      await fetchTasksStatus() // 刷新任务状态
    } catch (error) {
      console.error('取消任务错误:', error)
      setError(`${t('cancelTaskError')}: ${error}`)
    }
  }

  // 重试任务
  const handleRetryTask = async (taskId: string): Promise<void> => {
    try {
      await window.m3u8Download.retryTask(taskId)
      await fetchTasksStatus() // 刷新任务状态
    } catch (error) {
      console.error('重试任务错误:', error)
      setError(`${t('retryTaskError')}: ${error}`)
    }
  }

  // 打开文件位置
  const handleOpenFileLocation = async (filePath: string): Promise<void> => {
    try {
      await window.system.openFileLocation(filePath)
    } catch (error) {
      console.error('打开文件位置错误:', error)
      setError(`${t('openFileLocationError')}: ${error}`)
    }
  }

  // 清除任务
  const handleClearTasks = (taskIds: string[]): void => {
    window.m3u8Download.clearTasks(taskIds)

    // 更新本地状态
    setActiveTasks((prev) => prev.filter((task) => !taskIds.includes(task.id)))
  }

  const summary = useMemo(() => {
    const downloading = activeTasks.filter((task) => task.status === DownloadStatus.DOWNLOADING)
    const completed = activeTasks.filter((task) => task.status === DownloadStatus.COMPLETED).length
    const failed = activeTasks.filter((task) =>
      [DownloadStatus.FAILED, DownloadStatus.CANCELLED].includes(task.status)
    ).length
    const waiting = activeTasks.filter((task) => task.status === DownloadStatus.WAITING).length
    const totalSpeed = downloading.reduce((acc, task) => acc + (task.speed || 0), 0)

    return {
      total: activeTasks.length,
      downloading: downloading.length,
      completed,
      waiting,
      failed,
      avgSpeed: downloading.length > 0 ? totalSpeed / downloading.length : 0
    }
  }, [activeTasks])

  const heroStats = [
    {
      key: 'downloading',
      label: t('downloadingTasks') || '下载中',
      value: summary.downloading,
      Icon: Activity,
      helper: t('maxConcurrentDownloads') || '并发执行'
    },
    {
      key: 'waiting',
      label: t('waitingTasks') || '等待中',
      value: summary.waiting,
      Icon: Clock,
      helper: t('queueHint', { defaultValue: '排队等待合并' })
    },
    {
      key: 'completed',
      label: t('completedTasks') || '已完成',
      value: summary.completed,
      Icon: ShieldCheck,
      helper: t('integrityCheckLabel', { defaultValue: '完整校验通过' })
    },
    {
      key: 'speed',
      label: t('averageSpeed', { defaultValue: '平均速度' }),
      value: summary.avgSpeed > 0 ? `${bytesToSize(summary.avgSpeed)}/s` : '--',
      Icon: Gauge,
      helper: t('throughputLabel', { defaultValue: '实时吞吐' })
    }
  ]

  return (
    <div className="relative mx-auto overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-6 shadow-2xl shadow-blue-900/10 backdrop-blur-sm dark:border-white/5 dark:bg-slate-900/60 md:p-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-blue-100/60 via-white to-transparent dark:from-blue-900/25 dark:via-slate-900" />
      <div className="space-y-6">
        <div className="flex flex-col gap-5">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-100/70 px-3 py-1 text-sm font-medium text-blue-600 dark:bg-blue-900/40 dark:text-blue-200">
            <DownloadCloud className="h-4 w-4" />
            {t('m3u8Download')}
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              {t('m3u8Download')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('m3u8DownloadDescription')}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {heroStats.map(({ key, label, value, helper, Icon }) => (
              <div
                key={key}
                className="rounded-2xl border border-blue-100/60 bg-white/80 p-4 shadow-sm dark:border-blue-500/20 dark:bg-slate-900/60"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {label}
                  </p>
                  <Icon className="h-4 w-4 text-blue-500" />
                </div>
                <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{helper}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-blue-100/70 bg-blue-50/60 p-4 text-sm text-blue-700 shadow-inner dark:border-blue-500/30 dark:bg-blue-900/20 dark:text-blue-100 md:flex-row md:items-start md:gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-blue-500 shadow-sm dark:bg-white/10 dark:text-blue-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold">{t('batchDownload') || '批量下载提示'}</p>
              <p className="text-xs leading-relaxed text-blue-600/80 dark:text-blue-100/80">
                {t('batchInputFormat')}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <Alert className="rounded-2xl border border-destructive/40 bg-destructive/10 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('downloadError') || '操作失败'}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="create" value={mainTab} onValueChange={setMainTab} className="w-full">
          <div className="flex justify-center">
            <TabsList className="mb-6 grid h-[3.4rem] w-full max-w-lg grid-cols-2 items-center overflow-hidden rounded-full bg-blue-100/70 p-1 text-sm font-medium dark:bg-blue-900/40">
              <TabsTrigger
                value="create"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-slate-600 transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm dark:text-slate-300 dark:data-[state=active]:bg-slate-900/80 dark:data-[state=active]:text-blue-200"
              >
                {t('createDownload') || '创建下载'}
              </TabsTrigger>
              <TabsTrigger
                value="tasks"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-slate-600 transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm dark:text-slate-300 dark:data-[state=active]:bg-slate-900/80 dark:data-[state=active]:text-blue-200"
              >
                {t('downloadTasks') || '下载任务'}
                {activeTasks.length > 0 && (
                  <Badge variant="outline" className="ml-1">
                    {activeTasks.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="create">
            <DownloadForm
              onSingleDownload={handleSingleDownload}
              onBatchDownload={handleBatchDownload}
              onSetActiveTab={setMainTab}
            />
          </TabsContent>

          <TabsContent value="tasks">
            <TaskList
              activeTasks={activeTasks}
              onPauseTask={handlePauseTask}
              onResumeTask={handleResumeTask}
              onCancelTask={handleCancelTask}
              onRetryTask={handleRetryTask}
              onOpenFileLocation={handleOpenFileLocation}
              onClearTasks={handleClearTasks}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
