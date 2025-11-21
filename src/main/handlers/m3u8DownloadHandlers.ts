/*
 * @Author: Libra
 * @Date: 2025-05-14 17:56:33
 * @LastEditors: Libra
 * @Description: m3u8视频下载相关IPC处理程序
 */
import { ipcMain, dialog } from 'electron'
import {
  downloadM3u8,
  getAllTasks,
  pauseTask,
  resumeTask,
  cancelTask,
  getTaskStatus,
  clearTasks
} from '../m3u8Download'

/**
 * 选择m3u8下载输出目录
 */
export async function selectM3u8OutputDirectory(): Promise<string | undefined> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: '选择下载存储位置'
  })
  return result.filePaths.length > 0 ? result.filePaths[0] : undefined
}

/**
 * 选择批量m3u8下载输出目录
 */
export async function selectBatchOutputDirectory(): Promise<string | undefined> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: '选择批量下载存储位置'
  })
  return result.filePaths.length > 0 ? result.filePaths[0] : undefined
}

// 添加一个存储任务进程的映射表，用于跟踪和取消任务
const taskProcesses = new Map()

// 添加批量下载队列和正在下载的标志
const batchDownloadQueue: Array<{
  url: string
  fileName: string
  outputPath: string
  options: any
}> = []
let batchDownloadActive = false

// 跟踪正在进行的下载任务和它们的完成情况
const activeDownloads = new Map<
  string,
  {
    process: any
    completed: boolean
  }
>()

// 处理批量下载队列
async function processBatchDownloadQueue() {
  // 如果队列为空或者已经有活动的批量下载进程，则退出
  if (batchDownloadQueue.length === 0 || batchDownloadActive) {
    console.log('队列为空或已有活动批量下载，退出处理')
    return
  }

  console.log(`处理批量下载队列，当前队列长度：${batchDownloadQueue.length}`)
  batchDownloadActive = true

  try {
    // 从队列中获取下一批任务
    const maxConcurrent = batchDownloadQueue[0]?.options?.maxConcurrent || 2
    console.log(`当前批次最大并发数: ${maxConcurrent}`)

    // 每次从队列中取出maxConcurrent个任务
    const activeBatch = batchDownloadQueue.splice(0, maxConcurrent)
    console.log(`当前批次处理 ${activeBatch.length} 个任务`)

    if (activeBatch.length === 0) {
      batchDownloadActive = false
      return
    }

    // 获取ffmpeg路径
    const { ffmpegPath } = require('../utils/ffmpegConfig')
    const path = require('path')
    const fs = require('fs')
    const { spawn } = require('child_process')

    // 为当前批次创建任务并获取任务ID
    const batchTaskIds: string[] = []

    // 为每个任务创建唯一ID并准备下载
    for (const task of activeBatch) {
      try {
        // 确保输出目录存在
        if (!fs.existsSync(task.outputPath)) {
          fs.mkdirSync(task.outputPath, { recursive: true })
        }

        // 清理文件名
        const sanitizedFileName = task.fileName
          .replace(/[<>:"/\\|?*]/g, '_')
          .replace(/\s+/g, '_')
          .trim()

        // 构建输出文件路径
        const outputFilePath = path.join(task.outputPath, `${sanitizedFileName}.mp4`)

        // 创建唯一的任务ID
        const taskId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        batchTaskIds.push(taskId)

        // 构建FFmpeg命令参数
        const args = [
          '-i',
          task.url,
          '-y',
          '-c',
          'copy',
          '-protocol_whitelist',
          'file,http,https,tcp,tls,crypto',
          '-stats',
          '-progress',
          'pipe:1',
          outputFilePath
        ]

        console.log(`准备下载: ${task.url} -> ${outputFilePath}`)

        // 创建任务对象并发送创建事件
        const taskObj = {
          id: taskId,
          url: task.url,
          outputDir: task.outputPath,
          fileName: sanitizedFileName,
          status: 'waiting',
          progress: 0,
          speed: 0,
          estimatedTimeRemaining: 0,
          retries: 0,
          totalSegments: 0,
          downloadedSegments: 0,
          totalBytes: 0,
          downloadedBytes: 0,
          startTime: Date.now(),
          outputPath: outputFilePath
        }

        // 发布任务创建事件
        console.log(`任务已创建: ${taskId}`)
        // 如果有事件发射器，可以在这里发送事件
        // downloadEventEmitter.emit('task:created', taskObj);

        // 将任务对象添加到主模块的活动任务中
        const { getAllTasks } = require('../m3u8Download')
        const activeTasks = getAllTasks()

        // 开始下载任务
        const ffmpegProcess = spawn(ffmpegPath, args)

        // 跟踪此进程
        activeDownloads.set(taskId, {
          process: ffmpegProcess,
          completed: false
        })

        // 监听进程输出以更新进度
        ffmpegProcess.stdout.on('data', (data) => {
          // 这里可以添加进度更新逻辑
          console.log(`任务 ${taskId} 进度更新...`)
        })

        // 监听进程结束
        ffmpegProcess.on('close', (code) => {
          console.log(`任务 ${taskId} 完成，退出代码: ${code}`)

          // 标记任务为已完成
          const downloadInfo = activeDownloads.get(taskId)
          if (downloadInfo) {
            downloadInfo.completed = true
            activeDownloads.set(taskId, downloadInfo)
          }

          // 检查当前批次是否全部完成
          checkBatchCompletion()
        })

        ffmpegProcess.stderr.on('data', (data) => {
          // 可以记录错误输出
          // console.log(`任务 ${taskId} 错误输出: ${data}`);
        })
      } catch (error) {
        console.error(`启动下载任务失败:`, error)
      }
    }

    // 返回此批次创建的任务ID
    console.log(`当前批次已开始下载，任务ID: ${batchTaskIds.join(', ')}`)

    // 不立即释放批量下载锁，等待当前批次完成
  } catch (error) {
    console.error(`处理批量下载队列出错:`, error)
    batchDownloadActive = false

    // 出错后尝试继续处理队列
    setTimeout(() => {
      processBatchDownloadQueue()
    }, 1000)
  }
}

// 检查当前批次是否全部完成
function checkBatchCompletion() {
  let allCompleted = true

  // 检查所有活动下载是否都已完成
  for (const [taskId, downloadInfo] of activeDownloads.entries()) {
    if (!downloadInfo.completed) {
      allCompleted = false
      break
    }
  }

  // 如果全部完成，则清理并继续处理队列
  if (allCompleted && activeDownloads.size > 0) {
    console.log('当前批次全部完成，继续处理队列')

    // 清空活动下载记录
    activeDownloads.clear()

    // 释放批量下载锁
    batchDownloadActive = false

    // 延迟一段时间后继续处理队列
    setTimeout(() => {
      processBatchDownloadQueue()
    }, 1000)
  } else if (activeDownloads.size === 0) {
    // 没有活动下载（可能是出错情况）
    batchDownloadActive = false

    // 继续处理队列
    setTimeout(() => {
      processBatchDownloadQueue()
    }, 1000)
  }
}

/**
 * 注册m3u8下载相关的IPC处理程序
 */
export function registerM3u8DownloadHandlers(): void {
  // 选择下载目录
  ipcMain.handle('select-m3u8-output-directory', async () => {
    try {
      const result = await selectM3u8OutputDirectory()
      console.log(`选择m3u8下载目录: ${result}`)
      return result
    } catch (error) {
      console.error('选择m3u8下载目录错误:', error)
      throw error
    }
  })

  // 选择批量下载目录
  ipcMain.handle('select-batch-output-directory', async () => {
    try {
      const result = await selectBatchOutputDirectory()
      console.log(`选择批量m3u8下载目录: ${result}`)
      return result
    } catch (error) {
      console.error('选择批量m3u8下载目录错误:', error)
      throw error
    }
  })

  // 下载单个m3u8
  ipcMain.handle(
    'download-m3u8',
    async (_, url: string, outputPath: string, fileName: string, options?: any) => {
      try {
        console.log(`IPC调用: download-m3u8 ${url} -> ${outputPath}/${fileName}`)
        const result = await downloadM3u8(url, outputPath, fileName, options)
        return result
      } catch (error) {
        console.error('下载m3u8错误:', error)
        throw error
      }
    }
  )

  // 批量下载m3u8
  ipcMain.handle(
    'batch-download-m3u8',
    async (_, urlFileNamePairs: string[], outputPath: string, options?: any) => {
      try {
        console.log(
          `IPC调用: batch-download-m3u8 ${urlFileNamePairs.length}个文件 -> ${outputPath}`
        )
        console.log('批量下载选项:', options)

        // 直接提取最大并发数
        const maxConcurrent = options?.maxConcurrent || 2
        console.log(`设置最大并发下载数: ${maxConcurrent}`)

        // 准备所有下载任务的参数
        const downloadTasks = urlFileNamePairs
          .map((pair) => {
            // 尝试解析URL和文件名
            let url = ''
            let fileName = ''

            if (pair.includes('----')) {
              const parts = pair.split('----').map((item) => item.trim())
              if (parts.length >= 2) {
                url = parts[0]
                fileName = parts[1]
              }
            } else {
              // 如果没有分隔符，假设整行是URL
              url = pair.trim()
              fileName = `视频_${Date.now()}`
            }

            return { url, fileName }
          })
          .filter((task) => task.url.trim() !== '')

        console.log(`有效下载任务数: ${downloadTasks.length}`)

        // 如果没有有效任务，直接返回
        if (downloadTasks.length === 0) {
          return []
        }

        // 为所有任务设置相同的maxConcurrent
        const downloadOptions = {
          ...options,
          maxConcurrent
        }

        // 使用Promise.all并行添加所有任务，使它们立即显示在任务列表中
        // 由于我们已经改进了downloadM3u8函数，它会立即添加任务到列表
        const taskIds = await Promise.all(
          downloadTasks.map(async (task) => {
            try {
              return await downloadM3u8(task.url, outputPath, task.fileName, downloadOptions)
            } catch (error) {
              console.error(`添加任务失败: ${task.fileName}`, error)
              return null
            }
          })
        )

        // 过滤掉添加失败的任务
        const validTaskIds = taskIds.filter((id) => id !== null) as string[]

        console.log(`已提交 ${validTaskIds.length} 个下载任务`)
        return validTaskIds
      } catch (error) {
        console.error('批量下载m3u8错误:', error)
        throw error
      }
    }
  )

  // 获取所有下载任务
  ipcMain.handle('get-all-tasks', async () => {
    try {
      const tasks = getAllTasks()
      console.log('获取所有任务:', tasks.length)
      return tasks
    } catch (error) {
      console.error('获取所有任务错误:', error)
      throw error
    }
  })

  // 获取任务状态
  ipcMain.handle('get-task-status', async (_, taskId: string) => {
    try {
      const task = getTaskStatus(taskId)
      return task
    } catch (error) {
      console.error('获取任务状态错误:', error)
      throw error
    }
  })

  // 暂停任务
  ipcMain.handle('pause-task', async (_, taskId: string) => {
    try {
      const result = pauseTask(taskId)
      return result
    } catch (error) {
      console.error('暂停任务错误:', error)
      throw error
    }
  })

  // 恢复任务
  ipcMain.handle('resume-task', async (_, taskId: string) => {
    try {
      const result = resumeTask(taskId)
      return result
    } catch (error) {
      console.error('恢复任务错误:', error)
      throw error
    }
  })

  // 取消任务
  ipcMain.handle('cancel-task', async (_, taskId: string) => {
    try {
      const result = cancelTask(taskId)
      return result
    } catch (error) {
      console.error('取消任务错误:', error)
      throw error
    }
  })

  // 重试任务
  ipcMain.handle('retry-task', async (_, taskId: string) => {
    try {
      // 获取任务信息
      const task = getTaskStatus(taskId)
      if (!task) {
        throw new Error('任务不存在')
      }

      // 重新下载
      const newTaskId = await downloadM3u8(task.url, task.outputDir, task.fileName)

      return newTaskId
    } catch (error) {
      console.error('重试任务错误:', error)
      throw error
    }
  })

  // 清除指定任务
  ipcMain.handle('clear-tasks', async (_, taskIds: string[]) => {
    try {
      console.log(`IPC调用: clear-tasks ${taskIds.length}个任务`)
      // 直接传递任务ID数组
      const result = clearTasks(taskIds)
      return result
    } catch (error) {
      console.error('清除任务错误:', error)
      throw error
    }
  })
}
