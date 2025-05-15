/*
 * @Author: Libra
 * @Date: 2025-05-14
 * @LastEditors: Libra
 * @Description: M3U8下载相关类型定义
 */

export interface M3u8Download {
  // 选择目录
  selectM3u8OutputDirectory: () => Promise<string | undefined>
  selectBatchOutputDirectory: () => Promise<string | undefined>

  // 下载相关
  downloadM3u8: (
    url: string,
    outputPath: string,
    fileName: string,
    options?: any
  ) => Promise<string>
  batchDownloadM3u8: (
    urlFileNamePairs: string[],
    outputPath: string,
    options?: any
  ) => Promise<string[]>

  // 任务管理
  getAllTasks: () => Promise<any[]>
  getTaskStatus: (taskId: string) => Promise<any>
  pauseTask: (taskId: string) => Promise<boolean>
  resumeTask: (taskId: string) => Promise<boolean>
  cancelTask: (taskId: string) => Promise<boolean>
  retryTask: (taskId: string) => Promise<string>
  clearTasks: (taskIds: string[]) => Promise<boolean>
}
