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
  convertM4aToMp3,
  batchConvertMp3ToWav,
  batchConvertWavToMp3,
  batchConvertFlacToMp3,
  batchConvertMp3ToFlac,
  batchConvertM4aToMp3
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

  // 批量MP3转WAV
  ipcMain.handle('convert-batch-mp3-to-wav', async (_, inputPaths: string[], outputDir: string) => {
    try {
      console.log(`IPC调用: 批量mp3-to-wav, 文件数: ${inputPaths.length}, 输出目录: ${outputDir}`)
      const results = await batchConvertMp3ToWav(inputPaths, outputDir)
      console.log(`批量转换成功, 成功数量: ${results.length}`)
      return results
    } catch (error) {
      console.error('批量MP3转WAV失败:', error)
      throw error
    }
  })

  // 批量WAV转MP3
  ipcMain.handle('convert-batch-wav-to-mp3', async (_, inputPaths: string[], outputDir: string) => {
    try {
      console.log(`IPC调用: 批量wav-to-mp3, 文件数: ${inputPaths.length}, 输出目录: ${outputDir}`)
      const results = await batchConvertWavToMp3(inputPaths, outputDir)
      console.log(`批量转换成功, 成功数量: ${results.length}`)
      return results
    } catch (error) {
      console.error('批量WAV转MP3失败:', error)
      throw error
    }
  })

  // 批量FLAC转MP3
  ipcMain.handle(
    'convert-batch-flac-to-mp3',
    async (_, inputPaths: string[], outputDir: string) => {
      try {
        console.log(
          `IPC调用: 批量flac-to-mp3, 文件数: ${inputPaths.length}, 输出目录: ${outputDir}`
        )
        const results = await batchConvertFlacToMp3(inputPaths, outputDir)
        console.log(`批量转换成功, 成功数量: ${results.length}`)
        return results
      } catch (error) {
        console.error('批量FLAC转MP3失败:', error)
        throw error
      }
    }
  )

  // 批量MP3转FLAC
  ipcMain.handle('batch-mp3-to-flac', async (_, inputPaths: string[], outputDir: string) => {
    try {
      console.log(`IPC调用: 批量mp3-to-flac, 文件数: ${inputPaths.length}, 输出目录: ${outputDir}`)
      const results = await batchConvertMp3ToFlac(inputPaths, outputDir)
      console.log(`批量转换成功, 成功数量: ${results.length}`)
      return results
    } catch (error) {
      console.error('批量MP3转FLAC失败:', error)
      throw error
    }
  })

  // 批量M4A转MP3
  ipcMain.handle('convert-batch-m4a-to-mp3', async (_, inputPaths: string[], outputDir: string) => {
    try {
      console.log(`IPC调用: 批量m4a-to-mp3, 文件数: ${inputPaths.length}, 输出目录: ${outputDir}`)
      const results = await batchConvertM4aToMp3(inputPaths, outputDir)
      console.log(`批量转换成功, 成功数量: ${results.length}`)
      return results
    } catch (error) {
      console.error('批量M4A转MP3失败:', error)
      throw error
    }
  })
}
