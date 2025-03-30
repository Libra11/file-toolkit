/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 音频压缩相关IPC处理程序
 */
import { ipcMain } from 'electron'
import { compressAudio } from '../../compressors/fileCompressors'

/**
 * 注册音频压缩相关的IPC处理程序
 */
export function registerAudioCompressionHandlers(): void {
  // 音频压缩
  ipcMain.handle('compress-audio', async (_, inputPath: string, outputPath: string) => {
    try {
      console.log(`IPC调用: compress-audio ${inputPath} -> ${outputPath}`)
      const result = await compressAudio(inputPath, outputPath)
      console.log(`压缩成功: ${result}`)
      return result
    } catch (error) {
      console.error('音频压缩IPC错误:', error)
      throw error
    }
  })
}
