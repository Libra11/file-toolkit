/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 文件格式转换功能
 */
import { ffmpegPath, execFileAsync } from '../utils/ffmpegConfig'
import { checkFileExists } from '../utils/fileSystem'

/**
 * 将MP4转换为GIF
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @returns 输出文件路径
 */
export async function convertMp4ToGif(inputPath: string, outputPath: string): Promise<string> {
  checkFileExists(outputPath)
  // 直接使用ffmpeg自动转换
  const ffmpegArgs = ['-i', inputPath, outputPath]

  await execFileAsync(ffmpegPath, ffmpegArgs)
  return outputPath
}

/**
 * 将PNG转换为JPG
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @returns 输出文件路径
 */
export async function convertPngToJpg(inputPath: string, outputPath: string): Promise<string> {
  checkFileExists(outputPath)
  // 直接使用ffmpeg自动转换
  const ffmpegArgs = ['-i', inputPath, outputPath]

  await execFileAsync(ffmpegPath, ffmpegArgs)
  return outputPath
}

/**
 * 将JPG转换为PNG
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @returns 输出文件路径
 */
export async function convertJpgToPng(inputPath: string, outputPath: string): Promise<string> {
  checkFileExists(outputPath)
  // 直接使用ffmpeg自动转换
  const ffmpegArgs = ['-i', inputPath, outputPath]

  await execFileAsync(ffmpegPath, ffmpegArgs)
  return outputPath
}

/**
 * 将WEBP转换为JPG
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @returns 输出文件路径
 */
export async function convertWebpToJpg(inputPath: string, outputPath: string): Promise<string> {
  checkFileExists(outputPath)
  // 直接使用ffmpeg自动转换
  const ffmpegArgs = ['-i', inputPath, outputPath]

  await execFileAsync(ffmpegPath, ffmpegArgs)
  return outputPath
}
