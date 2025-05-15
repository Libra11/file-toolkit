/*
 * @Author: Libra
 * @Date: 2025-05-14
 * @LastEditors: Libra
 * @Description: M3U8下载功能预加载脚本
 */
import { ipcRenderer } from 'electron'
import type { M3u8Download } from '../types/m3u8Download'

const m3u8Download: M3u8Download = {
  // 选择M3U8下载输出目录
  selectM3u8OutputDirectory: async (): Promise<string | undefined> => {
    try {
      console.log('预加载脚本: 调用select-m3u8-output-directory')
      const result = await ipcRenderer.invoke('select-m3u8-output-directory')
      console.log(`预加载脚本: select-m3u8-output-directory成功, 结果:${result}`)
      return result
    } catch (error) {
      console.error('预加载脚本: selectM3u8OutputDirectory错误:', error)
      throw error
    }
  },

  // 选择批量下载目录
  selectBatchOutputDirectory: async (): Promise<string | undefined> => {
    try {
      console.log('预加载脚本: 调用select-batch-output-directory')
      const result = await ipcRenderer.invoke('select-batch-output-directory')
      console.log(`预加载脚本: select-batch-output-directory成功, 结果:${result}`)
      return result
    } catch (error) {
      console.error('预加载脚本: selectBatchOutputDirectory错误:', error)
      throw error
    }
  },

  // 下载单个M3U8
  downloadM3u8: async (url: string, outputPath: string, fileName: string, options?: any): Promise<string> => {
    try {
      console.log(`预加载脚本: 调用download-m3u8, url:${url}, 输出:${outputPath}/${fileName}`)
      const result = await ipcRenderer.invoke('download-m3u8', url, outputPath, fileName, options)
      console.log(`预加载脚本: download-m3u8成功, taskId:${result}`)
      return result
    } catch (error) {
      console.error('预加载脚本: downloadM3u8错误:', error)
      throw error
    }
  },

  // 批量下载M3U8
  batchDownloadM3u8: async (urlFileNamePairs: string[], outputPath: string, options?: any): Promise<string[]> => {
    try {
      console.log(`预加载脚本: 调用batch-download-m3u8, 数量:${urlFileNamePairs.length}, 输出:${outputPath}`)
      const result = await ipcRenderer.invoke('batch-download-m3u8', urlFileNamePairs, outputPath, options)
      console.log(`预加载脚本: batch-download-m3u8成功, 任务数:${result.length}`)
      return result
    } catch (error) {
      console.error('预加载脚本: batchDownloadM3u8错误:', error)
      throw error
    }
  },

  // 获取所有任务
  getAllTasks: async (): Promise<any[]> => {
    try {
      console.log('预加载脚本: 调用get-all-tasks')
      const result = await ipcRenderer.invoke('get-all-tasks')
      console.log(`预加载脚本: get-all-tasks成功, 任务数:${result?.length || 0}`)
      return result || []
    } catch (error) {
      console.error('预加载脚本: getAllTasks错误:', error)
      return [] // 错误时返回空数组
    }
  },

  // 获取任务状态
  getTaskStatus: async (taskId: string): Promise<any> => {
    try {
      console.log(`预加载脚本: 调用get-task-status, taskId:${taskId}`)
      const result = await ipcRenderer.invoke('get-task-status', taskId)
      return result
    } catch (error) {
      console.error('预加载脚本: getTaskStatus错误:', error)
      throw error
    }
  },

  // 暂停任务
  pauseTask: async (taskId: string): Promise<boolean> => {
    try {
      console.log(`预加载脚本: 调用pause-task, taskId:${taskId}`)
      const result = await ipcRenderer.invoke('pause-task', taskId)
      return result
    } catch (error) {
      console.error('预加载脚本: pauseTask错误:', error)
      throw error
    }
  },

  // 恢复任务
  resumeTask: async (taskId: string): Promise<boolean> => {
    try {
      console.log(`预加载脚本: 调用resume-task, taskId:${taskId}`)
      const result = await ipcRenderer.invoke('resume-task', taskId)
      return result
    } catch (error) {
      console.error('预加载脚本: resumeTask错误:', error)
      throw error
    }
  },

  // 取消任务
  cancelTask: async (taskId: string): Promise<boolean> => {
    try {
      console.log(`预加载脚本: 调用cancel-task, taskId:${taskId}`)
      const result = await ipcRenderer.invoke('cancel-task', taskId)
      return result
    } catch (error) {
      console.error('预加载脚本: cancelTask错误:', error)
      throw error
    }
  },

  // 重试任务
  retryTask: async (taskId: string): Promise<string> => {
    try {
      console.log(`预加载脚本: 调用retry-task, taskId:${taskId}`)
      const result = await ipcRenderer.invoke('retry-task', taskId)
      return result
    } catch (error) {
      console.error('预加载脚本: retryTask错误:', error)
      throw error
    }
  },

  // 清除任务
  clearTasks: async (taskIds: string[]): Promise<boolean> => {
    try {
      console.log(`预加载脚本: 调用clear-tasks, taskIds:${taskIds.join(',')}`)
      const result = await ipcRenderer.invoke('clear-tasks', taskIds)
      return result
    } catch (error) {
      console.error('预加载脚本: clearTasks错误:', error)
      throw error
    }
  }
}

export { m3u8Download } 