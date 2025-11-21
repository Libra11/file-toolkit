/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 视频压缩相关IPC处理程序
 */
import { ipcMain } from 'electron'
import fs from 'fs/promises'
import { compressVideo, getVideoInfo } from '../../compressors/fileCompressors'
import { ffprobePath, execFileAsync } from '../../utils/ffmpegConfig'

/**
 * 注册视频压缩相关的IPC处理程序
 */
export function registerVideoCompressionHandlers(): void {
  // 视频压缩
  ipcMain.handle(
    'compress-video',
    async (_, inputPath: string, outputPath: string, options = {}) => {
      try {
        console.log(`IPC调用: compress-video ${inputPath} -> ${outputPath}`)
        console.log('压缩选项:', options)

        // 获取原始文件大小
        const stats = await fs.stat(inputPath)
        const originalSize = stats.size

        // 执行视频压缩
        const compressedResult = await compressVideo(inputPath, outputPath, options.crf || 23)

        // 获取压缩后文件大小
        const compressedStats = await fs.stat(compressedResult.outputPath)
        const compressedSize = compressedStats.size

        // 计算压缩比
        const compressionRatio = originalSize / compressedSize

        // 获取视频信息
        let duration, width, height, format
        try {
          // 尝试通过ffprobe获取视频信息
          const args = [
            '-v',
            'error',
            '-select_streams',
            'v:0',
            '-show_entries',
            'stream=width,height,codec_name,duration',
            '-show_entries',
            'format=duration,format_name',
            '-of',
            'json',
            compressedResult.outputPath
          ]

          const { stdout } = await execFileAsync(ffprobePath, args)
          const info = JSON.parse(stdout)

          if (info.streams && info.streams[0]) {
            width = info.streams[0].width
            height = info.streams[0].height
            // 优先使用流的duration，如果没有则使用format的
            duration = parseFloat(info.streams[0].duration || info.format?.duration)
          }

          if (info.format) {
            format = info.format.format_name
          }
        } catch (error) {
          console.warn('无法获取视频信息:', error)
        }

        const result = {
          outputPath: compressedResult.outputPath,
          originalSize,
          compressedSize: compressedResult.compressedSize,
          compressionRatio,
          duration,
          width,
          height,
          format
        }

        console.log(`压缩成功:`, result)
        return result
      } catch (error) {
        console.error('视频压缩IPC错误:', error)
        throw error
      }
    }
  )

  // 获取视频信息
  ipcMain.handle('get-video-info', async (_, inputPath: string) => {
    try {
      console.log(`IPC调用: get-video-info ${inputPath}`)
      const info = await getVideoInfo(inputPath)
      console.log('获取视频信息成功:', info)
      return info
    } catch (error) {
      console.error('获取视频信息失败:', error)
      throw error
    }
  })
}
