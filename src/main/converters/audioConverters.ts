/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 音频格式转换功能
 */
import { ffmpegPath, execFileAsync } from '../utils/ffmpegConfig'
import { checkFileExists } from '../utils/fileSystem'
import fs from 'fs'

/**
 * 将MP3转换为WAV
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @returns 输出文件路径
 */
export async function convertMp3ToWav(inputPath: string, outputPath: string): Promise<string> {
  try {
    console.log(`开始转换MP3到WAV: ${inputPath} -> ${outputPath}`)

    // 检查输入文件是否存在
    if (!fs.existsSync(inputPath)) {
      throw new Error(`输入文件不存在: ${inputPath}`)
    }

    // 检查输出路径并删除已存在的文件
    checkFileExists(outputPath)

    // 配置ffmpeg参数 - 使用无损转换
    const ffmpegArgs = ['-i', inputPath, '-acodec', 'pcm_s16le', outputPath]

    // 执行ffmpeg转换
    console.log(`执行ffmpeg命令: ${ffmpegPath} ${ffmpegArgs.join(' ')}`)
    await execFileAsync(ffmpegPath, ffmpegArgs)

    // 检查生成文件
    if (!fs.existsSync(outputPath)) {
      throw new Error(`转换失败，输出文件不存在: ${outputPath}`)
    }

    console.log(`MP3到WAV转换成功: ${outputPath}`)
    return outputPath
  } catch (error) {
    console.error(`MP3到WAV转换错误:`, error)
    throw error
  }
}

/**
 * 将WAV转换为MP3
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @returns 输出文件路径
 */
export async function convertWavToMp3(inputPath: string, outputPath: string): Promise<string> {
  try {
    console.log(`开始转换WAV到MP3: ${inputPath} -> ${outputPath}`)

    // 检查输入文件是否存在
    if (!fs.existsSync(inputPath)) {
      throw new Error(`输入文件不存在: ${inputPath}`)
    }

    // 检查输出路径并删除已存在的文件
    checkFileExists(outputPath)

    // 配置ffmpeg参数 - 使用高质量转换
    const ffmpegArgs = [
      '-i',
      inputPath,
      '-c:a',
      'libmp3lame',
      '-b:a',
      '320k', // 使用320kbps的高比特率
      outputPath
    ]

    // 执行ffmpeg转换
    console.log(`执行ffmpeg命令: ${ffmpegPath} ${ffmpegArgs.join(' ')}`)
    await execFileAsync(ffmpegPath, ffmpegArgs)

    // 检查生成文件
    if (!fs.existsSync(outputPath)) {
      throw new Error(`转换失败，输出文件不存在: ${outputPath}`)
    }

    console.log(`WAV到MP3转换成功: ${outputPath}`)
    return outputPath
  } catch (error) {
    console.error(`WAV到MP3转换错误:`, error)
    throw error
  }
}

/**
 * 将M4A转换为MP3
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @returns 输出文件路径
 */
export async function convertM4aToMp3(inputPath: string, outputPath: string): Promise<string> {
  try {
    console.log(`开始转换M4A到MP3: ${inputPath} -> ${outputPath}`)

    // 检查输入文件是否存在
    if (!fs.existsSync(inputPath)) {
      throw new Error(`输入文件不存在: ${inputPath}`)
    }

    // 检查输出路径并删除已存在的文件
    checkFileExists(outputPath)

    // 配置ffmpeg参数 - 使用高质量转换
    const ffmpegArgs = ['-i', inputPath, '-c:a', 'libmp3lame', '-b:a', '320k', outputPath]

    // 执行ffmpeg转换
    console.log(`执行ffmpeg命令: ${ffmpegPath} ${ffmpegArgs.join(' ')}`)
    await execFileAsync(ffmpegPath, ffmpegArgs)

    // 检查生成文件
    if (!fs.existsSync(outputPath)) {
      throw new Error(`转换失败，输出文件不存在: ${outputPath}`)
    }

    console.log(`M4A到MP3转换成功: ${outputPath}`)
    return outputPath
  } catch (error) {
    console.error(`M4A到MP3转换错误:`, error)
    throw error
  }
}

/**
 * 将FLAC转换为MP3
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @returns 输出文件路径
 */
export async function convertFlacToMp3(inputPath: string, outputPath: string): Promise<string> {
  try {
    console.log(`开始转换FLAC到MP3: ${inputPath} -> ${outputPath}`)

    // 检查输入文件是否存在
    if (!fs.existsSync(inputPath)) {
      throw new Error(`输入文件不存在: ${inputPath}`)
    }

    // 检查输出路径并删除已存在的文件
    checkFileExists(outputPath)

    // 配置ffmpeg参数 - 使用高质量转换
    const ffmpegArgs = ['-i', inputPath, '-c:a', 'libmp3lame', '-b:a', '320k', outputPath]

    // 执行ffmpeg转换
    console.log(`执行ffmpeg命令: ${ffmpegPath} ${ffmpegArgs.join(' ')}`)
    await execFileAsync(ffmpegPath, ffmpegArgs)

    // 检查生成文件
    if (!fs.existsSync(outputPath)) {
      throw new Error(`转换失败，输出文件不存在: ${outputPath}`)
    }

    console.log(`FLAC到MP3转换成功: ${outputPath}`)
    return outputPath
  } catch (error) {
    console.error(`FLAC到MP3转换错误:`, error)
    throw error
  }
}

/**
 * 将MP3转换为FLAC
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @returns 输出文件路径
 */
export async function convertMp3ToFlac(inputPath: string, outputPath: string): Promise<string> {
  try {
    console.log(`开始转换MP3到FLAC: ${inputPath} -> ${outputPath}`)

    // 检查输入文件是否存在
    if (!fs.existsSync(inputPath)) {
      throw new Error(`输入文件不存在: ${inputPath}`)
    }

    // 检查输出路径并删除已存在的文件
    checkFileExists(outputPath)

    // 配置ffmpeg参数 - 使用无损转换
    const ffmpegArgs = [
      '-i',
      inputPath,
      '-c:a',
      'flac',
      '-compression_level',
      '12', // 最高压缩级别
      outputPath
    ]

    // 执行ffmpeg转换
    console.log(`执行ffmpeg命令: ${ffmpegPath} ${ffmpegArgs.join(' ')}`)
    await execFileAsync(ffmpegPath, ffmpegArgs)

    // 检查生成文件
    if (!fs.existsSync(outputPath)) {
      throw new Error(`转换失败，输出文件不存在: ${outputPath}`)
    }

    console.log(`MP3到FLAC转换成功: ${outputPath}`)
    return outputPath
  } catch (error) {
    console.error(`MP3到FLAC转换错误:`, error)
    throw error
  }
}
