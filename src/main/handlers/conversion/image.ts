/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 图像转换相关IPC处理程序
 */
import { ipcMain } from 'electron'
import {
  convertPngToJpg,
  convertJpgToPng,
  convertPngToWebp,
  convertWebpToPng,
  convertWebpToJpg,
  convertJpgToWebp
} from '../../converters/index'

/**
 * 注册图像转换相关的IPC处理程序
 */
export function registerImageConversionHandlers(): void {
  // PNG转JPG
  ipcMain.handle('convert-png-to-jpg', async (_, inputPath: string, outputPath: string) => {
    try {
      console.log(`IPC调用: convert-png-to-jpg ${inputPath} -> ${outputPath}`)
      const result = await convertPngToJpg(inputPath, outputPath)
      console.log(`转换成功: ${result}`)
      return result
    } catch (error) {
      console.error('PNG转JPG失败:', error)
      throw error
    }
  })

  // JPG转PNG
  ipcMain.handle('convert-jpg-to-png', async (_, inputPath: string, outputPath: string) => {
    try {
      console.log(`IPC调用: convert-jpg-to-png ${inputPath} -> ${outputPath}`)
      const result = await convertJpgToPng(inputPath, outputPath)
      console.log(`转换成功: ${result}`)
      return result
    } catch (error) {
      console.error('JPG转PNG失败:', error)
      throw error
    }
  })

  // PNG转WEBP
  ipcMain.handle('convert-png-to-webp', async (_, inputPath: string, outputPath: string) => {
    try {
      console.log(`IPC调用: convert-png-to-webp ${inputPath} -> ${outputPath}`)
      const result = await convertPngToWebp(inputPath, outputPath)
      console.log(`转换成功: ${result}`)
      return result
    } catch (error) {
      console.error('PNG转WEBP失败:', error)
      throw error
    }
  })

  // JPG转WEBP
  ipcMain.handle('convert-jpg-to-webp', async (_, inputPath: string, outputPath: string) => {
    try {
      console.log(`IPC调用: convert-jpg-to-webp ${inputPath} -> ${outputPath}`)
      const result = await convertJpgToWebp(inputPath, outputPath)
      console.log(`转换成功: ${result}`)
      return result
    } catch (error) {
      console.error('JPG转WEBP失败:', error)
      throw error
    }
  })

  // WEBP转PNG
  ipcMain.handle('convert-webp-to-png', async (_, inputPath: string, outputPath: string) => {
    try {
      console.log(`IPC调用: convert-webp-to-png ${inputPath} -> ${outputPath}`)
      const result = await convertWebpToPng(inputPath, outputPath)
      console.log(`转换成功: ${result}`)
      return result
    } catch (error) {
      console.error('WEBP转PNG失败:', error)
      throw error
    }
  })

  // WEBP转JPG
  ipcMain.handle('convert-webp-to-jpg', async (_, inputPath: string, outputPath: string) => {
    try {
      console.log(`IPC调用: convert-webp-to-jpg ${inputPath} -> ${outputPath}`)
      const result = await convertWebpToJpg(inputPath, outputPath)
      console.log(`转换成功: ${result}`)
      return result
    } catch (error) {
      console.error('WEBP转JPG失败:', error)
      throw error
    }
  })
}
