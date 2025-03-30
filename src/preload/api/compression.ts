/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 文件压缩预加载API
 */
import { ipcRenderer } from 'electron'
import type { Compression } from '../types/compression'

export const compression: Compression = {
  compressImage: (inputPath, outputPath) =>
    ipcRenderer.invoke('compress-image', inputPath, outputPath),
  compressVideo: (inputPath, outputPath) =>
    ipcRenderer.invoke('compress-video', inputPath, outputPath),
  compressAudio: (inputPath, outputPath) =>
    ipcRenderer.invoke('compress-audio', inputPath, outputPath)
}
