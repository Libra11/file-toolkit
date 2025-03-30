/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 视频压缩相关IPC处理程序
 */
import { ipcMain } from 'electron'
import { compressVideo } from '../../compressors/fileCompressors'

/**
 * 注册视频压缩相关的IPC处理程序
 */
export function registerVideoCompressionHandlers(): void {
  // 视频压缩
  ipcMain.handle('compress-video', async (_, inputPath: string, outputPath: string) => {
    try {
      console.log(`IPC调用: compress-video ${inputPath} -> ${outputPath}`)
      const result = await compressVideo(inputPath, outputPath)
      console.log(`压缩成功: ${result}`)
      return result
    } catch (error) {
      console.error('视频压缩IPC错误:', error)
      throw error
    }
  })
}
