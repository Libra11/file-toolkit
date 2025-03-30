/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 文件压缩相关IPC处理程序
 */
import { ipcMain } from 'electron'
import { compressImage, compressVideo, compressAudio } from '../compressors/fileCompressors'

/**
 * 注册文件压缩相关的IPC处理程序
 */
export function registerFileCompressionHandlers(): void {
  // 图片压缩
  ipcMain.handle('compress-image', async (_, inputPath: string, outputPath: string) => {
    return await compressImage(inputPath, outputPath)
  })

  // 视频压缩
  ipcMain.handle('compress-video', async (_, inputPath: string, outputPath: string) => {
    return await compressVideo(inputPath, outputPath)
  })

  // 音频压缩
  ipcMain.handle('compress-audio', async (_, inputPath: string, outputPath: string) => {
    return await compressAudio(inputPath, outputPath)
  })
}
