import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@renderer/components/ui/tabs'
import { Badge } from '@renderer/components/ui/badge'
import TaskList from './TaskList'
import DownloadForm from './DownloadForm'
import { DownloadTask, DownloadOptions } from './types'

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

  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="create" value={mainTab} onValueChange={setMainTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="create">{t('createDownload') || '创建下载'}</TabsTrigger>
          <TabsTrigger value="tasks">
            {t('downloadTasks') || '下载任务'}
            {activeTasks.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {activeTasks.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <DownloadForm
            onSingleDownload={handleSingleDownload}
            onBatchDownload={handleBatchDownload}
            onSetActiveTab={setMainTab}
          />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
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
  )
}
