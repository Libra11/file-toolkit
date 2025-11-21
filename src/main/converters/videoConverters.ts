/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 视频格式转换功能
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
 * 将MP4转换为GIF（带设置参数）
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @param settings GIF设置参数
 * @returns 输出文件路径
 */
export async function convertMp4ToGifWithSettings(
  inputPath: string,
  outputPath: string,
  settings: any
): Promise<string> {
  try {
    console.log(`开始转换MP4到GIF（带设置）: ${inputPath} -> ${outputPath}`, settings)

    // 检查输入文件是否存在
    if (!fs.existsSync(inputPath)) {
      throw new Error(`输入文件不存在: ${inputPath}`)
    }

    // 检查输出路径并删除已存在的文件
    checkFileExists(outputPath)

    // 根据设置构建缩放参数
    let scaleFilter = ''
    switch (settings.size) {
      case 'small':
        scaleFilter = 'scale=320:-1:flags=lanczos'
        break
      case 'medium':
        scaleFilter = 'scale=480:-1:flags=lanczos'
        break
      case 'large':
        scaleFilter = 'scale=720:-1:flags=lanczos'
        break
      case 'original':
        scaleFilter = 'scale=-1:-1:flags=lanczos'
        break
      default:
        scaleFilter = 'scale=480:-1:flags=lanczos' // 默认中等尺寸
    }

    // 根据质量设置调整色彩参数
    let paletteFilter = 'palettegen'
    let paletteUseFilter = 'paletteuse'

    switch (settings.quality) {
      case 'low':
        paletteFilter = 'palettegen=max_colors=64'
        paletteUseFilter = 'paletteuse=dither=none'
        break
      case 'normal':
        paletteFilter = 'palettegen=max_colors=128'
        paletteUseFilter = 'paletteuse=dither=bayer:bayer_scale=2'
        break
      case 'high':
        paletteFilter = 'palettegen=max_colors=256'
        paletteUseFilter = 'paletteuse=dither=bayer:bayer_scale=3'
        break
      default:
        paletteFilter = 'palettegen=max_colors=128'
        paletteUseFilter = 'paletteuse=dither=bayer:bayer_scale=2'
    }

    // 生成调色板文件
    const paletteFile = outputPath.replace('.gif', '_palette.png')
    const paletteArgs = [
      '-i',
      inputPath,
      '-vf',
      `fps=${settings.frameRate},${scaleFilter},${paletteFilter}`,
      '-y',
      paletteFile
    ]

    console.log(`生成调色板: ${ffmpegPath} ${paletteArgs.join(' ')}`)
    await execFileAsync(ffmpegPath, paletteArgs)

    // 使用调色板生成GIF
    const gifArgs = [
      '-i',
      inputPath,
      '-i',
      paletteFile,
      '-filter_complex',
      `fps=${settings.frameRate},${scaleFilter}[v];[v][1:v]${paletteUseFilter}`,
      '-y',
      outputPath
    ]

    console.log(`生成GIF: ${ffmpegPath} ${gifArgs.join(' ')}`)
    await execFileAsync(ffmpegPath, gifArgs)

    // 清理临时调色板文件
    if (fs.existsSync(paletteFile)) {
      fs.unlinkSync(paletteFile)
    }

    // 检查生成文件
    if (!fs.existsSync(outputPath)) {
      throw new Error(`转换失败，输出文件不存在: ${outputPath}`)
    }

    console.log(`MP4到GIF转换成功（带设置）: ${outputPath}`)
    return outputPath
  } catch (error) {
    console.error(`MP4到GIF转换错误（带设置）:`, error)
    throw error
  }
}

/**
 * 将AVI转换为MP4
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @returns 输出文件路径
 */
export async function convertAviToMp4(inputPath: string, outputPath: string): Promise<string> {
  try {
    console.log(`开始转换AVI到MP4: ${inputPath} -> ${outputPath}`)

    // 检查输入文件是否存在
    if (!fs.existsSync(inputPath)) {
      throw new Error(`输入文件不存在: ${inputPath}`)
    }

    // 检查输出路径并删除已存在的文件
    checkFileExists(outputPath)

    // 配置ffmpeg参数
    const ffmpegArgs = [
      '-i',
      inputPath,
      '-c:v',
      'libx264',
      '-c:a',
      'aac',
      '-strict',
      'experimental',
      outputPath
    ]

    // 执行ffmpeg转换
    console.log(`执行ffmpeg命令: ${ffmpegPath} ${ffmpegArgs.join(' ')}`)
    await execFileAsync(ffmpegPath, ffmpegArgs)

    // 检查生成文件
    if (!fs.existsSync(outputPath)) {
      throw new Error(`转换失败，输出文件不存在: ${outputPath}`)
    }

    console.log(`AVI到MP4转换成功: ${outputPath}`)
    return outputPath
  } catch (error) {
    console.error(`AVI到MP4转换错误:`, error)
    throw error
  }
}

/**
 * 将MOV转换为MP4
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @returns 输出文件路径
 */
export async function convertMovToMp4(inputPath: string, outputPath: string): Promise<string> {
  try {
    console.log(`开始转换MOV到MP4: ${inputPath} -> ${outputPath}`)

    // 检查输入文件是否存在
    if (!fs.existsSync(inputPath)) {
      throw new Error(`输入文件不存在: ${inputPath}`)
    }

    // 检查输出路径并删除已存在的文件
    checkFileExists(outputPath)

    // 配置ffmpeg参数
    const ffmpegArgs = [
      '-i',
      inputPath,
      '-c:v',
      'libx264',
      '-c:a',
      'aac',
      '-strict',
      'experimental',
      outputPath
    ]

    // 执行ffmpeg转换
    console.log(`执行ffmpeg命令: ${ffmpegPath} ${ffmpegArgs.join(' ')}`)
    await execFileAsync(ffmpegPath, ffmpegArgs)

    // 检查生成文件
    if (!fs.existsSync(outputPath)) {
      throw new Error(`转换失败，输出文件不存在: ${outputPath}`)
    }

    console.log(`MOV到MP4转换成功: ${outputPath}`)
    return outputPath
  } catch (error) {
    console.error(`MOV到MP4转换错误:`, error)
    throw error
  }
}

/**
 * 将WEBM转换为MP4
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @returns 输出文件路径
 */
export async function convertWebmToMp4(inputPath: string, outputPath: string): Promise<string> {
  try {
    console.log(`开始转换WEBM到MP4: ${inputPath} -> ${outputPath}`)

    // 检查输入文件是否存在
    if (!fs.existsSync(inputPath)) {
      throw new Error(`输入文件不存在: ${inputPath}`)
    }

    // 检查输出路径并删除已存在的文件
    checkFileExists(outputPath)

    // 配置ffmpeg参数
    const ffmpegArgs = [
      '-i',
      inputPath,
      '-c:v',
      'libx264',
      '-c:a',
      'aac',
      '-strict',
      'experimental',
      outputPath
    ]

    // 执行ffmpeg转换
    console.log(`执行ffmpeg命令: ${ffmpegPath} ${ffmpegArgs.join(' ')}`)
    await execFileAsync(ffmpegPath, ffmpegArgs)

    // 检查生成文件
    if (!fs.existsSync(outputPath)) {
      throw new Error(`转换失败，输出文件不存在: ${outputPath}`)
    }

    console.log(`WEBM到MP4转换成功: ${outputPath}`)
    return outputPath
  } catch (error) {
    console.error(`WEBM到MP4转换错误:`, error)
    throw error
  }
}
