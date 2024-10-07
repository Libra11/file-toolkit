/*
 * @Author: Libra
 * @Date: 2024-10-07 00:33:48
 * @LastEditors: Libra
 * @Description:
 */
import { app, dialog, ipcMain } from 'electron'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import { Mp4ToGifOptions } from '@shared/types'

const execFileAsync = promisify(execFile)

// Get the path to the FFmpeg executable
const ffmpegPath = app.isPackaged
  ? path.join(
      process.resourcesPath,
      'resources',
      'ffmpeg',
      process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
    )
  : path.join(
      __dirname,
      '..',
      '..',
      'resources',
      'ffmpeg',
      process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
    )

ipcMain.handle(
  'convert-mp4-to-gif',
  async (_, inputPath: string, outputPath: string, optionsStr: string) => {
    try {
      const options: Mp4ToGifOptions = JSON.parse(optionsStr)
      console.log(options)

      if (fs.existsSync(outputPath)) {
        console.log('File already exists, deleting...')
        fs.unlinkSync(outputPath)
        console.log('Existing file deleted')
      }

      console.log('Starting conversion...')

      const ffmpegArgs = [
        '-i',
        inputPath,
        '-vf',
        `fps=${options.fps},scale=${options.scale}:flags=lanczos`,
        '-c:v',
        'gif',
        outputPath
      ]

      await execFileAsync(ffmpegPath, ffmpegArgs)

      console.log('Conversion completed')
      console.log('File exists:', fs.existsSync(outputPath))
      return outputPath
    } catch (error) {
      console.error('Error during conversion:', error)
      throw error
    }
  }
)

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  return result.filePaths[0]
})

ipcMain.handle('save-file', async (_, filePath: string) => {
  const result = await dialog.showSaveDialog({
    defaultPath: filePath
  })
  return result.filePath
})

ipcMain.handle('check-file-exists', async (_, filePath: string) => {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK)
    return true
  } catch {
    return false
  }
})

// ... 其他代码
