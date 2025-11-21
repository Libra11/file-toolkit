/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: FFmpeg配置工具
 */
import { app } from 'electron'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'

// 创建可Promise化的execFile
export const execFileAsync = promisify(execFile)

/**
 * 获取FFmpeg可执行文件路径
 */
export const ffmpegPath = app.isPackaged
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

console.log('ffmpegPath', __dirname)
// 初始化时打印FFmpeg路径
console.log('FFmpeg路径:', ffmpegPath)

export const ffprobePath = app.isPackaged
  ? path.join(
      process.resourcesPath,
      'resources',
      'ffprobe',
      process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe'
    )
  : path.join(
      __dirname,
      '..',
      '..',
      'resources',
      'ffprobe',
      process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe'
    )

console.log('ffprobePath', __dirname)
// 初始化时打印FFmpeg路径
console.log('FFmpeg路径:', ffprobePath)
