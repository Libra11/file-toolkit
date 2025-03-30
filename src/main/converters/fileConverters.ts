/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 文件格式转换功能
 */
import { ffmpegPath, execFileAsync } from '../utils/ffmpegConfig'
import { checkFileExists } from '../utils/fileSystem'
import fs from 'fs'

/**
 * 将MP4转换为GIF
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @returns 输出文件路径
 */
export async function convertMp4ToGif(inputPath: string, outputPath: string): Promise<string> {
  try {
    console.log(`开始转换MP4到GIF: ${inputPath} -> ${outputPath}`)

    // 检查输入文件是否存在
    if (!fs.existsSync(inputPath)) {
      throw new Error(`输入文件不存在: ${inputPath}`)
    }

    // 检查输出路径并删除已存在的文件
    checkFileExists(outputPath)

    // 配置ffmpeg参数
    const ffmpegArgs = ['-i', inputPath, '-vf', 'fps=10,scale=320:-1:flags=lanczos', outputPath]

    // 执行ffmpeg转换
    console.log(`执行ffmpeg命令: ${ffmpegPath} ${ffmpegArgs.join(' ')}`)
    await execFileAsync(ffmpegPath, ffmpegArgs)

    // 检查生成文件
    if (!fs.existsSync(outputPath)) {
      throw new Error(`转换失败，输出文件不存在: ${outputPath}`)
    }

    console.log(`MP4到GIF转换成功: ${outputPath}`)
    return outputPath
  } catch (error) {
    console.error(`MP4到GIF转换错误:`, error)
    throw error
  }
}

/**
 * 将PNG转换为JPG
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @returns 输出文件路径
 */
export async function convertPngToJpg(inputPath: string, outputPath: string): Promise<string> {
  try {
    console.log(`开始转换PNG到JPG: ${inputPath} -> ${outputPath}`)

    // 检查输入文件是否存在
    if (!fs.existsSync(inputPath)) {
      throw new Error(`输入文件不存在: ${inputPath}`)
    }

    // 检查输出路径并删除已存在的文件
    checkFileExists(outputPath)

    // 配置ffmpeg参数 - 指定质量和格式
    const ffmpegArgs = ['-i', inputPath, '-q:v', '1', '-y', outputPath]

    // 执行ffmpeg转换
    console.log(`执行ffmpeg命令: ${ffmpegPath} ${ffmpegArgs.join(' ')}`)
    await execFileAsync(ffmpegPath, ffmpegArgs)

    // 检查生成文件
    if (!fs.existsSync(outputPath)) {
      throw new Error(`转换失败，输出文件不存在: ${outputPath}`)
    }

    console.log(`PNG到JPG转换成功: ${outputPath}`)
    return outputPath
  } catch (error) {
    console.error(`PNG到JPG转换错误:`, error)
    throw error
  }
}

/**
 * 将JPG转换为PNG
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @returns 输出文件路径
 */
export async function convertJpgToPng(inputPath: string, outputPath: string): Promise<string> {
  try {
    console.log(`开始转换JPG到PNG: ${inputPath} -> ${outputPath}`)

    // 检查输入文件是否存在
    if (!fs.existsSync(inputPath)) {
      throw new Error(`输入文件不存在: ${inputPath}`)
    }

    // 检查输出路径并删除已存在的文件
    checkFileExists(outputPath)

    // 配置ffmpeg参数
    const ffmpegArgs = ['-i', inputPath, outputPath]

    // 执行ffmpeg转换
    console.log(`执行ffmpeg命令: ${ffmpegPath} ${ffmpegArgs.join(' ')}`)
    await execFileAsync(ffmpegPath, ffmpegArgs)

    // 检查生成文件
    if (!fs.existsSync(outputPath)) {
      throw new Error(`转换失败，输出文件不存在: ${outputPath}`)
    }

    console.log(`JPG到PNG转换成功: ${outputPath}`)
    return outputPath
  } catch (error) {
    console.error(`JPG到PNG转换错误:`, error)
    throw error
  }
}

/**
 * 将WEBP转换为JPG
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @returns 输出文件路径
 */
export async function convertWebpToJpg(inputPath: string, outputPath: string): Promise<string> {
  try {
    console.log(`开始转换WEBP到JPG: ${inputPath} -> ${outputPath}`)

    // 检查输入文件是否存在
    if (!fs.existsSync(inputPath)) {
      throw new Error(`输入文件不存在: ${inputPath}`)
    }

    // 检查输出路径并删除已存在的文件
    checkFileExists(outputPath)

    // 配置ffmpeg参数
    const ffmpegArgs = ['-i', inputPath, '-q:v', '2', outputPath]

    // 执行ffmpeg转换
    console.log(`执行ffmpeg命令: ${ffmpegPath} ${ffmpegArgs.join(' ')}`)
    await execFileAsync(ffmpegPath, ffmpegArgs)

    // 检查生成文件
    if (!fs.existsSync(outputPath)) {
      throw new Error(`转换失败，输出文件不存在: ${outputPath}`)
    }

    console.log(`WEBP到JPG转换成功: ${outputPath}`)
    return outputPath
  } catch (error) {
    console.error(`WEBP到JPG转换错误:`, error)
    throw error
  }
}
