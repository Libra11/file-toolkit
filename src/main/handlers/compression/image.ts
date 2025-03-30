/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 图像压缩相关IPC处理程序
 */
import { ipcMain } from 'electron'
import { compressImage } from '../../compressors/fileCompressors'

/**
 * 注册图像压缩相关的IPC处理程序
 */
export function registerImageCompressionHandlers(): void {
  // 图片压缩
  ipcMain.handle('compress-image', async (_, inputPath: string, outputPath: string) => {
    try {
      console.log(`IPC调用: compress-image ${inputPath} -> ${outputPath}`)
      const result = await compressImage(inputPath, outputPath)
      console.log(`压缩成功: ${result}`)
      return result
    } catch (error) {
      console.error('图像压缩IPC错误:', error)
      throw error
    }
  })
}
