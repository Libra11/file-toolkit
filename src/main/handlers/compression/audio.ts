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
  ipcMain.handle(
    'compress-audio',
    async (
      _,
      inputPath: string,
      outputPath: string,
      bitrate: string = '128k',
      sampleRate?: number,
      channels?: number,
      format?: 'mp3' | 'aac' | 'ogg' | 'wav'
    ) => {
      try {
        console.log(`IPC调用: compress-audio ${inputPath} -> ${outputPath}`)
        console.log('参数:', { bitrate, sampleRate, channels, format })

        const result = await compressAudio(
          inputPath,
          outputPath,
          bitrate,
          sampleRate,
          channels,
          format
        )

        console.log(`压缩成功: ${result.outputPath}`)
        console.log(`原始大小: ${result.originalSize} 字节`)
        console.log(`压缩后大小: ${result.compressedSize} 字节`)

        return result
      } catch (error) {
        console.error('音频压缩IPC错误:', error)
        throw error
      }
    }
  )
}
