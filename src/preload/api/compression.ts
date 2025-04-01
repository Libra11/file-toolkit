/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 文件压缩预加载API
 */
import { ipcRenderer } from 'electron'
import type { Compression } from '../types/compression'

export const compression: Compression = {
  compressImage: async (inputPath, outputPath, options = {}) => {
    try {
      console.log(`预加载脚本: 调用compressImage, 输入:${inputPath}, 输出:${outputPath}`)
      console.log('压缩选项:', options)

      const result = await ipcRenderer.invoke('compress-image', inputPath, outputPath, options)

      console.log(`预加载脚本: compressImage成功, 结果:`, result)
      return result
    } catch (error) {
      console.error('预加载脚本: compressImage错误:', error)
      throw error
    }
  },

  estimateCompressedSize: async (inputPath, quality, scale = 1) => {
    try {
      console.log(
        `预加载脚本: 调用estimateCompressedSize, 输入:${inputPath}, 质量:${quality}, 缩放:${scale}`
      )

      const result = await ipcRenderer.invoke('estimate-compressed-size', inputPath, quality, scale)

      console.log(`预加载脚本: estimateCompressedSize成功, 结果:`, result)
      return result
    } catch (error) {
      console.error('预加载脚本: estimateCompressedSize错误:', error)
      throw error
    }
  },

  compressVideo: (inputPath, outputPath) =>
    ipcRenderer.invoke('compress-video', inputPath, outputPath),

  compressAudio: (
    inputPath: string,
    outputPath: string,
    bitrate?: string,
    sampleRate?: number,
    channels?: number,
    format?: 'mp3' | 'aac' | 'ogg' | 'wav'
  ) =>
    ipcRenderer.invoke(
      'compress-audio',
      inputPath,
      outputPath,
      bitrate,
      sampleRate,
      channels,
      format
    )
}
