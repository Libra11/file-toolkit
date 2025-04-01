/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 音频转换相关IPC处理程序
 */
import { ipcMain } from 'electron'
import {
  convertMp3ToWav,
  convertWavToMp3,
  convertFlacToMp3,
  convertMp3ToFlac,
  convertM4aToMp3
} from '../../converters/index'

/**
 * 注册音频转换相关的IPC处理程序
 */
export function registerAudioConversionHandlers(): void {
  // MP3转WAV
  ipcMain.handle('convert-mp3-to-wav', async (_, inputPath: string, outputPath: string) => {
    try {
      console.log(`IPC调用: convert-mp3-to-wav ${inputPath} -> ${outputPath}`)
      const result = await convertMp3ToWav(inputPath, outputPath)
      console.log(`转换成功: ${result}`)
      return result
    } catch (error) {
      console.error('MP3转WAV失败:', error)
      throw error
    }
  })

  // WAV转MP3
  ipcMain.handle('convert-wav-to-mp3', async (_, inputPath: string, outputPath: string) => {
    try {
      console.log(`IPC调用: convert-wav-to-mp3 ${inputPath} -> ${outputPath}`)
      const result = await convertWavToMp3(inputPath, outputPath)
      console.log(`转换成功: ${result}`)
      return result
    } catch (error) {
      console.error('WAV转MP3失败:', error)
      throw error
    }
  })

  // FLAC转MP3
  ipcMain.handle('convert-flac-to-mp3', async (_, inputPath: string, outputPath: string) => {
    try {
      console.log(`IPC调用: convert-flac-to-mp3 ${inputPath} -> ${outputPath}`)
      const result = await convertFlacToMp3(inputPath, outputPath)
      console.log(`转换成功: ${result}`)
      return result
    } catch (error) {
      console.error('FLAC转MP3失败:', error)
      throw error
    }
  })

  // MP3转FLAC
  ipcMain.handle('convert-mp3-to-flac', async (_, inputPath: string, outputPath: string) => {
    try {
      console.log(`IPC调用: convert-mp3-to-flac ${inputPath} -> ${outputPath}`)
      const result = await convertMp3ToFlac(inputPath, outputPath)
      console.log(`转换成功: ${result}`)
      return result
    } catch (error) {
      console.error('MP3转FLAC失败:', error)
      throw error
    }
  })

  // M4A转MP3
  ipcMain.handle('convert-m4a-to-mp3', async (_, inputPath: string, outputPath: string) => {
    try {
      console.log(`IPC调用: convert-m4a-to-mp3 ${inputPath} -> ${outputPath}`)
      const result = await convertM4aToMp3(inputPath, outputPath)
      console.log(`转换成功: ${result}`)
      return result
    } catch (error) {
      console.error('M4A转MP3失败:', error)
      throw error
    }
  })
}
