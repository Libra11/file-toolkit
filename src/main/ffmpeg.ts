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
import { JpgToPngOptions, Mp4ToGifOptions, PngToJpgOptions, WebpToJpgOptions } from '@shared/types'

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

function checkFileExists(filePath: string): void {
  if (fs.existsSync(filePath)) {
    console.log('File already exists, deleting...')
    fs.unlinkSync(filePath)
    console.log('Existing file deleted')
  }
}

ipcMain.handle(
  'convert-mp4-to-gif',
  async (_, inputPath: string, outputPath: string, optionsStr: string) => {
    const options: Mp4ToGifOptions = JSON.parse(optionsStr)
    checkFileExists(outputPath)
    const ffmpegArgs =
      options.scale === '-1:-1'
        ? ['-i', inputPath, '-vf', `fps=${options.fps}`, '-c:v', 'gif', outputPath]
        : [
            '-i',
            inputPath,
            '-vf',
            `fps=${options.fps},scale=${options.scale}:flags=lanczos`,
            '-c:v',
            'gif',
            outputPath
          ]

    await execFileAsync(ffmpegPath, ffmpegArgs)
    return outputPath
  }
)

ipcMain.handle(
  'convert-png-to-jpg',
  async (_, inputPath: string, outputPath: string, optionsStr: string) => {
    const options: PngToJpgOptions = JSON.parse(optionsStr)
    checkFileExists(outputPath)

    const ffmpegArgs =
      options.scale === '-1:-1'
        ? ['-i', inputPath, '-qscale:v', options.quality!.toString(), outputPath]
        : [
            '-i',
            inputPath,
            '-qscale:v',
            options.quality!.toString(),
            '-vf',
            `scale=${options.scale}`,
            outputPath
          ]

    await execFileAsync(ffmpegPath, ffmpegArgs)
    return outputPath
  }
)

ipcMain.handle(
  'convert-jpg-to-png',
  async (_, inputPath: string, outputPath: string, optionsStr: string) => {
    const options: JpgToPngOptions = JSON.parse(optionsStr)
    checkFileExists(outputPath)
    const ffmpegArgs =
      options.scale === '-1:-1'
        ? ['-i', inputPath, outputPath]
        : ['-i', inputPath, '-vf', `scale=${options.scale}`, outputPath]

    await execFileAsync(ffmpegPath, ffmpegArgs)
    return outputPath
  }
)

ipcMain.handle(
  'convert-webp-to-jpg',
  async (_, inputPath: string, outputPath: string, optionsStr: string) => {
    const options: WebpToJpgOptions = JSON.parse(optionsStr)
    checkFileExists(outputPath)
    const ffmpegArgs =
      options.scale === '-1:-1'
        ? ['-i', inputPath, '-qscale:v', options.quality!.toString(), outputPath]
        : [
            '-i',
            inputPath,
            '-qscale:v',
            options.quality!.toString(),
            '-vf',
            `scale=${options.scale}`,
            outputPath
          ]

    await execFileAsync(ffmpegPath, ffmpegArgs)
    return outputPath
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
