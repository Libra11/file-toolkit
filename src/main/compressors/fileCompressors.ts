/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 文件压缩功能
 */
import { ffmpegPath, execFileAsync } from '../utils/ffmpegConfig'
import { checkFileExists } from '../utils/fileSystem'

/**
 * 压缩图片文件
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @param quality 质量 (1-31, 越大压缩率越高但质量越低)
 * @returns 输出文件路径
 */
export async function compressImage(
  inputPath: string,
  outputPath: string,
  quality: number = 5
): Promise<string> {
  checkFileExists(outputPath)
  // 使用ffmpeg压缩图片
  const ffmpegArgs = ['-i', inputPath, '-q:v', quality.toString(), outputPath]

  await execFileAsync(ffmpegPath, ffmpegArgs)
  return outputPath
}

/**
 * 压缩视频文件
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @param crf 压缩率 (0-51, 越大压缩率越高但质量越低)
 * @returns 输出文件路径
 */
export async function compressVideo(
  inputPath: string,
  outputPath: string,
  crf: number = 23
): Promise<string> {
  checkFileExists(outputPath)
  // 使用ffmpeg压缩视频
  const ffmpegArgs = [
    '-i',
    inputPath,
    '-c:v',
    'libx264',
    '-crf',
    crf.toString(),
    '-preset',
    'medium',
    outputPath
  ]

  await execFileAsync(ffmpegPath, ffmpegArgs)
  return outputPath
}

/**
 * 压缩音频文件
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @param bitrate 比特率 (如 '128k')
 * @returns 输出文件路径
 */
export async function compressAudio(
  inputPath: string,
  outputPath: string,
  bitrate: string = '128k'
): Promise<string> {
  checkFileExists(outputPath)
  // 使用ffmpeg压缩音频
  const ffmpegArgs = ['-i', inputPath, '-c:a', 'aac', '-b:a', bitrate, outputPath]

  await execFileAsync(ffmpegPath, ffmpegArgs)
  return outputPath
}
