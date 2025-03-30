/*
 * @Author: Libra
 * @Date: 2024-12-20 10:12:14
 * @LastEditors: Libra
 * @Description:
 */
import { ipcRenderer } from 'electron'
import type { Ffmpeg } from '../types/ffmpeg'

export const ffmpeg: Ffmpeg = {
  convertMp4ToGif: (inputPath, outputPath) =>
    ipcRenderer.invoke('convert-mp4-to-gif', inputPath, outputPath),
  convertPngToJpg: (inputPath, outputPath) =>
    ipcRenderer.invoke('convert-png-to-jpg', inputPath, outputPath),
  convertJpgToPng: (inputPath, outputPath) =>
    ipcRenderer.invoke('convert-jpg-to-png', inputPath, outputPath),
  convertWebpToJpg: (inputPath, outputPath) =>
    ipcRenderer.invoke('convert-webp-to-jpg', inputPath, outputPath)
}
