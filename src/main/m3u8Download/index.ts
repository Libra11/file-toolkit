/*
 * @Author: Libra
 * @Date: 2025-05-14 17:58:04
 * @LastEditors: Libra
 * @Description: m3u8视频下载功能实现
 */
import fs from 'fs'
import path from 'path'
import { ffmpegPath } from '../utils/ffmpegConfig'
import { parseM3U8Contents, fetchM3U8Contents } from './m3u8Parser'
import { EventEmitter } from 'events'

// 下载状态枚举
export enum DownloadStatus {
  WAITING = 'waiting',
  DOWNLOADING = 'downloading',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// 下载任务接口
export interface DownloadTask {
  id: string
  url: string
  outputDir: string
  fileName: string
  status: DownloadStatus
  progress: number
  speed: number // 字节/秒
  estimatedTimeRemaining: number // 秒
  error?: string
  retries: number
  totalSegments: number
  downloadedSegments: number
  totalBytes: number
  downloadedBytes: number
  lastDownloadedBytes: number
  startTime?: number
  lastUpdateTime?: number
  outputPath?: string
  totalDuration: number
}

// 下载选项接口
export interface DownloadOptions {
  maxRetries?: number
  retryDelay?: number // 毫秒
  segmentTimeout?: number // 毫秒
  continueOnError?: boolean
  maxConcurrent?: number
}

// 全局下载事件发射器
export const downloadEventEmitter = new EventEmitter()

// 活动下载任务Map
const activeTasks = new Map<string, DownloadTask>()

// 全局下载池控制
const downloadPool = {
  activeCount: 0,
  maxConcurrent: 2,
  queue: [] as Array<{
    url: string
    outputDir: string
    fileName: string
    options: DownloadOptions
    resolve: (taskId: string) => void
    reject: (error: Error) => void
    taskId: string
  }>,

  // 添加下载任务到队列
  addToQueue(task: {
    url: string
    outputDir: string
    fileName: string
    options: DownloadOptions
    resolve: (taskId: string) => void
    reject: (error: Error) => void
    taskId?: string // 可选的任务ID
  }): string {
    // 使用提供的任务ID或创建新ID
    const taskId = task.taskId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // 尝试解析M3U8文件获取分段信息
    fetchM3U8Contents(task.url)
      .then((m3u8Content) => {
        // 解析获取分段数量和总时长
        const parsed = parseM3U8Contents(m3u8Content, task.url)
        const totalSegments = parsed.segments.length
        // 获取总时长（秒）
        const totalDuration = parsed.totalDuration
        // 估算总字节数（每个分段约2MB）
        const totalBytes = totalSegments * 2 * 1024 * 1024

        console.log(`解析到M3U8信息: 分段数=${totalSegments}, 总时长=${totalDuration}秒`)

        // 获取现有任务或创建新任务
        const existingTask = activeTasks.get(taskId)
        let newTask: DownloadTask

        if (existingTask) {
          // 更新现有任务信息
          newTask = {
            ...existingTask,
            totalSegments,
            totalBytes,
            totalDuration
          }
        } else {
          // 创建新任务对象
          newTask = {
            id: taskId,
            url: task.url,
            outputDir: task.outputDir,
            fileName: task.fileName,
            status: DownloadStatus.WAITING,
            progress: 0,
            speed: 0,
            estimatedTimeRemaining: 0,
            retries: 0,
            totalSegments,
            downloadedSegments: 0,
            totalBytes,
            downloadedBytes: 0,
            lastDownloadedBytes: 0,
            startTime: Date.now(),
            lastUpdateTime: Date.now(),
            totalDuration
          }

          // 发送任务创建事件
          downloadEventEmitter.emit('task:created', { ...newTask })
        }

        // 更新活动任务
        activeTasks.set(taskId, newTask)

        // 如果是更新现有任务，发送更新事件
        if (existingTask) {
          downloadEventEmitter.emit('task:updated', { ...newTask })
        }

        // 将任务加入队列，包含任务ID
        this.queue.push({
          ...task,
          taskId
        })

        // 尝试开始下载
        this.processQueue()
      })
      .catch((error) => {
        console.warn(`无法解析M3U8文件 ${task.url}, 将使用默认值: ${error.message}`)

        // 即使解析失败，仍然创建或更新任务但使用默认值
        const existingTask = activeTasks.get(taskId)

        if (!existingTask) {
          // 创建新任务对象
          const newTask: DownloadTask = {
            id: taskId,
            url: task.url,
            outputDir: task.outputDir,
            fileName: task.fileName,
            status: DownloadStatus.WAITING,
            progress: 0,
            speed: 0,
            estimatedTimeRemaining: 0,
            retries: 0,
            totalSegments: 0,
            downloadedSegments: 0,
            totalBytes: 0,
            downloadedBytes: 0,
            lastDownloadedBytes: 0,
            startTime: Date.now(),
            lastUpdateTime: Date.now(),
            totalDuration: 0
          }

          // 添加到活动任务
          activeTasks.set(taskId, newTask)

          // 发送任务创建事件
          downloadEventEmitter.emit('task:created', { ...newTask })
        }

        // 将任务加入队列，包含任务ID
        this.queue.push({
          ...task,
          taskId
        })

        // 尝试开始下载
        this.processQueue()
      })

    // 返回任务ID
    return taskId
  },

  // 处理队列
  processQueue(): void {
    console.log(
      `下载池状态: 活动=${this.activeCount}/${this.maxConcurrent}, 队列=${this.queue.length}`
    )

    // 当处理队列时，确保所有等待任务的状态也得到更新
    // 这样UI就可以显示所有任务，不管是否正在下载
    for (const queuedTask of this.queue) {
      const task = activeTasks.get(queuedTask.taskId)
      if (task && task.status === DownloadStatus.WAITING) {
        // 发送任务状态更新，保持在UI中可见
        downloadEventEmitter.emit('task:progress', { ...task })
      }
    }

    // 如果活动下载数小于最大并发数且队列不为空，则启动新下载
    while (this.activeCount < this.maxConcurrent && this.queue.length > 0) {
      // 取出队列中的第一个任务
      const task = this.queue.shift()
      if (!task) continue

      console.log(
        `开始下载任务: ${task.fileName}, 活动数: ${this.activeCount + 1}/${this.maxConcurrent}`
      )

      // 增加活动计数
      this.activeCount++

      // 获取对应的任务对象
      const taskObj = activeTasks.get(task.taskId)
      if (!taskObj) {
        console.error(`找不到任务对象: ${task.taskId}`)
        this.activeCount--
        task.reject(new Error('找不到任务对象'))
        this.processQueue()
        continue
      }

      // 更新任务状态为下载中
      taskObj.status = DownloadStatus.DOWNLOADING
      activeTasks.set(task.taskId, taskObj)
      downloadEventEmitter.emit('task:started', { ...taskObj })

      // 开始下载并返回任务ID
      const downloadPromise = downloadM3u8Internal(
        task.url,
        task.outputDir,
        task.fileName,
        task.taskId
      )

      downloadPromise
        .then(() => {
          // 任务成功，减少活动计数
          this.activeCount--
          // 将任务状态设为完成
          const completedTask = activeTasks.get(task.taskId)
          if (completedTask) {
            completedTask.status = DownloadStatus.COMPLETED
            completedTask.progress = 100
            activeTasks.set(task.taskId, completedTask)
            downloadEventEmitter.emit('task:completed', { ...completedTask })
          }
          task.resolve(task.taskId)

          // 继续处理队列
          setTimeout(() => this.processQueue(), 500)
        })
        .catch((error) => {
          // 任务失败，减少活动计数
          this.activeCount--

          // 将任务状态设为失败
          const failedTask = activeTasks.get(task.taskId)
          if (failedTask) {
            failedTask.status = DownloadStatus.FAILED
            failedTask.error = error.message
            activeTasks.set(task.taskId, failedTask)
            downloadEventEmitter.emit('task:failed', { ...failedTask })
          }

          task.reject(error)

          // 继续处理队列
          setTimeout(() => this.processQueue(), 500)
        })
    }
  },

  // 设置最大并发数
  setMaxConcurrent(value: number): void {
    if (value > 0 && value <= 10) {
      console.log(`设置最大并发下载数: ${this.maxConcurrent} -> ${value}`)
      this.maxConcurrent = value
      this.processQueue() // 更新后立即检查队列
    }
  }
}

/**
 * 内部下载函数，不进行队列处理
 */
async function downloadM3u8Internal(
  url: string,
  outputDir: string,
  fileName: string,
  existingTaskId?: string
): Promise<void> {
  try {
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // 清理文件名，移除非法字符
    const sanitizedFileName = fileName
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .trim()

    // 构建输出文件路径
    const outputPath = path.join(outputDir, `${sanitizedFileName}.mp4`)

    console.log(`开始下载m3u8: ${url} -> ${outputPath}`)

    // 使用已存在的任务ID
    if (!existingTaskId) {
      throw new Error('内部下载函数必须指定任务ID')
    }

    const taskId = existingTaskId

    // 构建FFmpeg命令参数
    const args = [
      // 输入
      '-i',
      url,
      // 覆盖现有文件
      '-y',
      // 使用复制编解码器（不重新编码）
      '-c',
      'copy',
      // 允许不安全的URL
      '-protocol_whitelist',
      'file,http,https,tcp,tls,crypto',
      // 启用详细进度输出
      '-stats',
      '-progress',
      'pipe:1',
      // 输出文件
      outputPath
    ]

    // 获取当前任务对象
    const task = activeTasks.get(taskId)
    if (!task) {
      throw new Error(`任务对象不存在: ${taskId}`)
    }

    task.outputPath = outputPath // 设置输出路径

    // 使用子进程执行FFmpeg命令并处理输出
    const ffmpegProcess = require('child_process').spawn(ffmpegPath, args)

    // 用于解析FFmpeg输出的进度信息
    let progressOutput = ''

    // 读取标准输出并解析进度信息
    ffmpegProcess.stdout.on('data', (data: Buffer) => {
      progressOutput += data.toString()

      // 解析进度信息
      const lines = progressOutput.split('\n')
      progressOutput = lines.pop() || ''

      // 更新下载任务进度
      const task = activeTasks.get(taskId)
      if (task) {
        // 查找总时间和当前时间
        const outTimeMs =
          parseFloat(lines.find((line) => line.startsWith('out_time_ms='))?.split('=')[1] || '0') /
          1000000
        // 使用实际的总时长，而不是估算值
        const totalTimeMs =
          task.totalDuration > 0
            ? task.totalDuration
            : task.totalSegments > 0
              ? task.totalSegments * 10
              : 0

        const now = Date.now()

        // 如果有总时间，则计算进度
        if (totalTimeMs > 0) {
          task.progress = Math.min(100, Math.round((outTimeMs / totalTimeMs) * 100))
          task.downloadedSegments = Math.round(task.totalSegments * (task.progress / 100))
        } else {
          // 如果没有总时间，则基于输出行数估算进度
          const frameCount = parseInt(
            lines.find((line) => line.startsWith('frame='))?.split('=')[1] || '0'
          )
          if (frameCount > 0) {
            task.progress = Math.min(95, Math.round((frameCount / 1000) * 100)) // 估计值，最多显示到95%
          }
        }

        // 更新下载字节数 - 从total_size获取
        const totalSizeLine = lines.find((line) => line.startsWith('total_size='))
        if (totalSizeLine) {
          const totalSize = parseInt(totalSizeLine.split('=')[1] || '0')
          // 计算当前下载速度（基于实际字节变化）
          if (
            task.lastUpdateTime &&
            task.lastUpdateTime !== now &&
            task.lastDownloadedBytes !== undefined
          ) {
            const bytesDelta = totalSize - task.lastDownloadedBytes
            const timeDelta = (now - task.lastUpdateTime) / 1000 // 转换为秒
            if (timeDelta > 0 && bytesDelta > 0) {
              // 实际下载速度（字节/秒）
              task.speed = Math.round(bytesDelta / timeDelta)

              // 估计剩余时间（秒）
              if (task.progress > 0 && task.speed > 0) {
                const remainingPercent = 100 - task.progress
                const estimatedTotalBytes = (totalSize * 100) / task.progress
                const remainingBytes = estimatedTotalBytes * (remainingPercent / 100)
                task.estimatedTimeRemaining = remainingBytes / task.speed
              }
            }
          }

          // 更新字节计数
          task.downloadedBytes = totalSize
          task.lastDownloadedBytes = totalSize
        } else {
          // 如果没有total_size，回退到使用比特率估算
          const bitrate = parseInt(
            lines.find((line) => line.startsWith('bitrate='))?.split('=')[1] || '0'
          )
          task.speed = (bitrate * 1024) / 8 // 比特率转换为字节/秒（但可能不准确）
        }

        task.lastUpdateTime = now

        // 更新任务状态
        activeTasks.set(taskId, task)

        // 发出进度更新事件
        downloadEventEmitter.emit('task:progress', { ...task })
      }
    })

    // 读取错误输出
    ffmpegProcess.stderr.on('data', (data: Buffer) => {
      console.warn('FFmpeg stderr:', data.toString())
    })

    // 使用Promise包装完成事件，使函数可以返回
    return new Promise((resolve, reject) => {
      // 处理完成事件
      ffmpegProcess.on('close', (code: number) => {
        if (code === 0) {
          // 下载成功
          console.log(`下载完成: ${outputPath}`)
          resolve()
        } else {
          // 下载失败
          console.error(`下载失败: ${outputPath}, 退出代码: ${code}`)
          reject(new Error(`下载失败，退出代码: ${code}`))
        }
      })
    })
  } catch (error) {
    console.error('下载m3u8视频失败:', error)
    throw error
  }
}

/**
 * 使用FFmpeg下载m3u8视频
 * @param url m3u8地址
 * @param outputDir 输出目录
 * @param fileName 文件名（不带扩展名）
 * @param options 下载选项
 * @returns 下载任务ID
 */
export async function downloadM3u8(
  url: string,
  outputDir: string,
  fileName: string,
  options: DownloadOptions = {}
): Promise<string> {
  console.log(`请求下载: ${fileName}`)

  // 更新最大并发设置（如果提供了）
  if (options.maxConcurrent && options.maxConcurrent > 0) {
    downloadPool.setMaxConcurrent(options.maxConcurrent)
  }

  // 创建任务ID
  const taskId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // 立即创建初始任务对象并添加到activeTasks
  const initialTask: DownloadTask = {
    id: taskId,
    url,
    outputDir,
    fileName,
    status: DownloadStatus.WAITING,
    progress: 0,
    speed: 0,
    estimatedTimeRemaining: 0,
    retries: 0,
    totalSegments: 0,
    downloadedSegments: 0,
    totalBytes: 0,
    downloadedBytes: 0,
    lastDownloadedBytes: 0,
    startTime: Date.now(),
    lastUpdateTime: Date.now(),
    totalDuration: 0
  }

  // 立即添加到活动任务列表，使其在UI中可见
  activeTasks.set(taskId, initialTask)

  // 发送任务创建事件
  downloadEventEmitter.emit('task:created', { ...initialTask })

  // 返回一个Promise，当下载开始时resolve
  return new Promise((resolve, reject) => {
    // 添加到下载池
    downloadPool.addToQueue({
      url,
      outputDir,
      fileName,
      options,
      resolve,
      reject,
      taskId // 传递已创建的taskId
    })

    // 立即返回任务ID
    console.log(`任务已添加到队列: ${taskId}`)
    resolve(taskId)
  })
}

/**
 * 获取任务状态
 * @param taskId 任务ID
 * @returns 下载任务对象，如果不存在则返回undefined
 */
export function getTaskStatus(taskId: string): DownloadTask | undefined {
  return activeTasks.get(taskId)
}

/**
 * 获取所有任务
 * @returns 所有下载任务的列表
 */
export function getAllTasks(): DownloadTask[] {
  return Array.from(activeTasks.values())
}

/**
 * 暂停下载任务
 * @param taskId 任务ID
 * @returns 成功暂停返回true，失败返回false
 */
export function pauseTask(taskId: string): boolean {
  const task = activeTasks.get(taskId)
  if (!task || task.status !== DownloadStatus.DOWNLOADING) {
    return false
  }

  // 设置状态为暂停
  task.status = DownloadStatus.PAUSED
  activeTasks.set(taskId, task)

  // 发出暂停事件
  downloadEventEmitter.emit('task:paused', { ...task })

  // 暂停功能需要额外实现ffmpeg进程的暂停
  // 这里只是状态更新，实际暂停需要使用进程信号等机制

  return true
}

/**
 * 恢复下载任务
 * @param taskId 任务ID
 * @returns 成功恢复返回true，失败返回false
 */
export function resumeTask(taskId: string): boolean {
  const task = activeTasks.get(taskId)
  if (!task || task.status !== DownloadStatus.PAUSED) {
    return false
  }

  // 设置状态为下载中
  task.status = DownloadStatus.DOWNLOADING
  activeTasks.set(taskId, task)

  // 发出恢复事件
  downloadEventEmitter.emit('task:resumed', { ...task })

  // 恢复功能需要额外实现ffmpeg进程的恢复
  // 这里只是状态更新，实际恢复需要重新启动下载

  return true
}

/**
 * 取消下载任务
 * @param taskId 任务ID
 * @returns 成功取消返回true，失败返回false
 */
export function cancelTask(taskId: string): boolean {
  const task = activeTasks.get(taskId)
  if (
    !task ||
    [DownloadStatus.COMPLETED, DownloadStatus.FAILED, DownloadStatus.CANCELLED].includes(
      task.status
    )
  ) {
    return false
  }

  // 设置状态为已取消
  task.status = DownloadStatus.CANCELLED
  activeTasks.set(taskId, task)

  // 发出取消事件
  downloadEventEmitter.emit('task:cancelled', { ...task })

  return true
}

/**
 * 解析m3u8链接和文件名对
 * @param input 格式为"url ---- filename"的输入字符串
 * @returns [url, fileName] 元组
 */
export function parseM3u8Input(input: string): [string, string] {
  const parts = input.split('----').map((part) => part.trim())
  if (parts.length < 2 || !parts[0] || !parts[1]) {
    throw new Error('输入格式错误，应为"m3u8链接 ---- 文件名"')
  }
  return [parts[0], parts[1]]
}

/**
 * 解析批量m3u8下载输入
 * @param batchInput 多行输入，每行格式为"url ---- filename"
 * @returns [url, fileName][] 元组数组
 */
export function parseBatchM3u8Input(batchInput: string): [string, string][] {
  const lines = batchInput
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  return lines.map((line) => parseM3u8Input(line))
}

/**
 * 清除指定任务
 * @param taskId 任务ID或任务ID数组
 * @returns 成功清除返回true
 */
export function clearTasks(taskId: string | string[]): boolean {
  if (Array.isArray(taskId)) {
    // 如果传入的是数组，则遍历清除每个任务
    let allSuccess = true
    for (const id of taskId) {
      const success = clearSingleTask(id)
      if (!success) {
        allSuccess = false
      }
    }
    return allSuccess
  } else {
    // 单个任务ID
    return clearSingleTask(taskId)
  }
}

/**
 * 清除单个任务
 * @param taskId 任务ID
 * @returns 成功清除返回true
 */
function clearSingleTask(taskId: string): boolean {
  const task = activeTasks.get(taskId)
  if (!task) {
    return false
  }

  // 从活动任务Map中删除
  activeTasks.delete(taskId)

  // 发出任务删除事件
  downloadEventEmitter.emit('task:removed', { id: taskId })

  console.log(`已清除任务: ${taskId}`)
  return true
}
