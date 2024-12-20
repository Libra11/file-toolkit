/*
 * @Author: Libra
 * @Date: 2024-12-20 10:12:14
 * @LastEditors: Libra
 * @Description:
 */
import { ipcRenderer } from 'electron'
import type { Ffmpeg } from '../types/ffmpeg'

export const ffmpeg: Ffmpeg = {
  convertMp4ToGif: (inputPath, outputPath, optionsStr) =>
    ipcRenderer.invoke('convert-mp4-to-gif', inputPath, outputPath, optionsStr),
  convertPngToJpg: (inputPath, outputPath, optionsStr) =>
    ipcRenderer.invoke('convert-png-to-jpg', inputPath, outputPath, optionsStr),
  convertJpgToPng: (inputPath, outputPath, optionsStr) =>
    ipcRenderer.invoke('convert-jpg-to-png', inputPath, outputPath, optionsStr),
  convertWebpToJpg: (inputPath, outputPath, optionsStr) =>
    ipcRenderer.invoke('convert-webp-to-jpg', inputPath, outputPath, optionsStr)
}
