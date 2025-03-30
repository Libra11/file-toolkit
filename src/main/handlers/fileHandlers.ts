/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 文件相关IPC处理程序
 */
import { ipcMain } from 'electron'
import {
  convertMp4ToGif,
  convertPngToJpg,
  convertJpgToPng,
  convertWebpToJpg
} from '../converters/fileConverters'
import { selectDirectory, saveFileDialog } from '../utils/dialogs'
import { isFileExists } from '../utils/fileSystem'

/**
 * 注册文件转换相关的IPC处理程序
 */
export function registerFileConversionHandlers(): void {
  // 文件转换处理程序
  ipcMain.handle('convert-mp4-to-gif', async (_, inputPath: string, outputPath: string) => {
    return await convertMp4ToGif(inputPath, outputPath)
  })

  ipcMain.handle('convert-png-to-jpg', async (_, inputPath: string, outputPath: string) => {
    return await convertPngToJpg(inputPath, outputPath)
  })

  ipcMain.handle('convert-jpg-to-png', async (_, inputPath: string, outputPath: string) => {
    return await convertJpgToPng(inputPath, outputPath)
  })

  ipcMain.handle('convert-webp-to-jpg', async (_, inputPath: string, outputPath: string) => {
    return await convertWebpToJpg(inputPath, outputPath)
  })

  // 文件对话框处理程序
  ipcMain.handle('select-directory', async () => {
    return await selectDirectory()
  })

  ipcMain.handle('save-file', async (_, filePath: string) => {
    return await saveFileDialog(filePath)
  })

  // 文件系统操作处理程序
  ipcMain.handle('check-file-exists', async (_, filePath: string) => {
    return await isFileExists(filePath)
  })
}
