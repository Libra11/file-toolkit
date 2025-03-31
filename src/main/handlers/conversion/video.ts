/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 视频转换相关IPC处理程序
 */
import { ipcMain } from 'electron'
import {
  convertAviToMp4,
  convertMovToMp4,
  convertMp4ToGif,
  convertWebmToMp4
} from '../../converters/index'

/**
 * 注册视频转换相关的IPC处理程序
 */
export function registerVideoConversionHandlers(): void {
  // MP4转GIF
  ipcMain.handle('convert-mp4-to-gif', async (_, inputPath: string, outputPath: string) => {
    try {
      console.log(`IPC调用: convert-mp4-to-gif ${inputPath} -> ${outputPath}`)
      const result = await convertMp4ToGif(inputPath, outputPath)
      console.log(`转换成功: ${result}`)
      return result
    } catch (error) {
      console.error('MP4转GIF失败:', error)
      throw error
    }
  })

  // AVI转MP4
  ipcMain.handle('convert-avi-to-mp4', async (_, inputPath: string, outputPath: string) => {
    try {
      console.log(`IPC调用: convert-avi-to-mp4 ${inputPath} -> ${outputPath}`)
      const result = await convertAviToMp4(inputPath, outputPath)
      console.log(`转换成功: ${result}`)
      return result
    } catch (error) {
      console.error('AVI转MP4失败:', error)
      throw error
    }
  })

  // MOV转MP4
  ipcMain.handle('convert-mov-to-mp4', async (_, inputPath: string, outputPath: string) => {
    try {
      console.log(`IPC调用: convert-mov-to-mp4 ${inputPath} -> ${outputPath}`)
      const result = await convertMovToMp4(inputPath, outputPath)
      console.log(`转换成功: ${result}`)
      return result
    } catch (error) {
      console.error('MOV转MP4失败:', error)
      throw error
    }
  })

  // WEBM转MP4
  ipcMain.handle('convert-webm-to-mp4', async (_, inputPath: string, outputPath: string) => {
    try {
      console.log(`IPC调用: convert-webm-to-mp4 ${inputPath} -> ${outputPath}`)
      const result = await convertWebmToMp4(inputPath, outputPath)
      console.log(`转换成功: ${result}`)
      return result
    } catch (error) {
      console.error('WEBM转MP4失败:', error)
      throw error
    }
  })
}
