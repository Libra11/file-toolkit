/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 视频转换相关IPC处理程序
 */
import { ipcMain } from 'electron'
import { convertMp4ToGif } from '../../converters/index'

/**
 * 注册视频转换相关的IPC处理程序
 */
export function registerVideoConversionHandlers(): void {
  // MP4转GIF
  ipcMain.handle('mp4-to-gif', async (_, inputPath: string, outputPath: string) => {
    try {
      console.log(`IPC调用: mp4-to-gif ${inputPath} -> ${outputPath}`)
      const result = await convertMp4ToGif(inputPath, outputPath)
      console.log(`转换成功: ${result}`)
      return result
    } catch (error) {
      console.error('MP4转GIF失败:', error)
      throw error
    }
  })
}
