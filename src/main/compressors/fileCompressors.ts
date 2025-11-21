/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 文件压缩功能
 */
import { ffmpegPath, execFileAsync, ffprobePath } from '../utils/ffmpegConfig'
import { checkFileExists } from '../utils/fileSystem'
import path from 'path'
import fs from 'fs/promises'
import { existsSync } from 'fs'

// 图片压缩设置接口
export interface ImageCompressionOptions {
  quality: number // 质量 (JPEG: 2-31, WebP: 0-100)
  width?: number // 宽度 (像素)
  height?: number // 高度 (像素)
  maintainAspectRatio?: boolean // 是否保持宽高比
  format?: 'jpg' | 'png' | 'webp' // 输出格式
  compressionLevel?: number // PNG压缩级别 (0-9)
  lossless?: boolean // WebP是否使用无损压缩
  preset?: 'default' | 'photo' | 'picture' | 'drawing' // WebP预设
}

// 默认图片压缩选项
const defaultImageOptions: ImageCompressionOptions = {
  quality: 5,
  maintainAspectRatio: true,
  compressionLevel: 9
}

/**
 * 获取文件大小 (字节)
 * @param filePath 文件路径
 * @returns 文件大小
 */
async function getFileSize(filePath: string): Promise<number> {
  const stats = await fs.stat(filePath)
  return stats.size
}

/**
 * 压缩图片文件
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @param options 压缩选项
 * @returns 压缩结果，包含输出路径和压缩信息
 */
export async function compressImage(
  inputPath: string,
  outputPath: string,
  options: Partial<ImageCompressionOptions> = {}
): Promise<{
  outputPath: string
  originalSize: number
  compressedSize: number
  compressionRatio: number
  originalWidth?: number
  originalHeight?: number
  newWidth?: number
  newHeight?: number
}> {
  // 合并选项
  const mergedOptions = { ...defaultImageOptions, ...options }
  const {
    quality,
    width,
    height,
    maintainAspectRatio,
    format,
    compressionLevel,
    lossless,
    preset
  } = mergedOptions

  console.log('压缩选项:', mergedOptions)

  // 确保输出目录存在
  const outputDir = path.dirname(outputPath)
  await fs.mkdir(outputDir, { recursive: true })

  // 检查输入文件是否存在
  try {
    await fs.access(inputPath)
  } catch (error) {
    throw new Error(`输入文件不存在: ${inputPath}`)
  }

  // 获取原始文件大小
  const originalSize = await getFileSize(inputPath)

  // 获取图片信息
  let originalWidth, originalHeight
  try {
    const probeArgs = [
      '-v',
      'error',
      '-print_format',
      'json',
      '-show_format',
      '-show_streams',
      inputPath
    ]
    const probeResult = await execFileAsync(ffprobePath, probeArgs)
    const info = JSON.parse(probeResult.stdout)
    if (info.streams && info.streams[0]) {
      originalWidth = info.streams[0].width
      originalHeight = info.streams[0].height
    }
  } catch (error) {
    console.warn('无法获取图片尺寸:', error)
  }

  // 构建ffmpeg参数
  const ffmpegArgs: string[] = ['-y', '-i', inputPath]

  // 设置输出格式和编码器
  if (format) {
    const extension = path.extname(outputPath).toLowerCase()
    let outputFormat = outputPath

    // 如果需要强制输出格式，重写输出路径
    if (
      (format === 'jpg' && !extension.includes('.jpg') && !extension.includes('.jpeg')) ||
      (format === 'png' && !extension.includes('.png')) ||
      (format === 'webp' && !extension.includes('.webp'))
    ) {
      outputFormat = outputPath.substring(0, outputPath.lastIndexOf('.')) + '.' + format
    }

    // 编码器设置
    switch (format) {
      case 'jpg':
        ffmpegArgs.push('-c:v', 'mjpeg')
        ffmpegArgs.push('-q:v', quality.toString())
        break
      case 'png':
        ffmpegArgs.push('-c:v', 'png')
        // PNG优化参数
        if (compressionLevel !== undefined) {
          ffmpegArgs.push('-compression_level', compressionLevel.toString())
          // 添加预设参数以获得更好的压缩效果
          ffmpegArgs.push('-pred', 'mixed') // 使用混合预测
          ffmpegArgs.push('-bits_per_raw_sample', '8') // 8位色深
        }
        break
      case 'webp':
        ffmpegArgs.push('-c:v', 'libwebp')
        if (lossless) {
          ffmpegArgs.push('-lossless', '1')
          if (compressionLevel !== undefined) {
            ffmpegArgs.push('-compression_level', compressionLevel.toString())
          }
        } else {
          ffmpegArgs.push('-q:v', quality.toString())
        }
        if (preset) {
          ffmpegArgs.push('-preset', preset)
        }
        break
    }

    outputPath = outputFormat
  } else {
    // 根据输出文件扩展名自动选择编码器
    const extension = path.extname(outputPath).toLowerCase()
    if (extension.includes('.jpg') || extension.includes('.jpeg')) {
      ffmpegArgs.push('-c:v', 'mjpeg')
      ffmpegArgs.push('-q:v', quality.toString())
    } else if (extension.includes('.png')) {
      ffmpegArgs.push('-c:v', 'png')
      if (compressionLevel !== undefined) {
        ffmpegArgs.push('-compression_level', compressionLevel.toString())
      }
    } else if (extension.includes('.webp')) {
      ffmpegArgs.push('-c:v', 'libwebp')
      if (lossless) {
        ffmpegArgs.push('-lossless', '1')
        if (compressionLevel !== undefined) {
          ffmpegArgs.push('-compression_level', compressionLevel.toString())
        }
      } else {
        ffmpegArgs.push('-q:v', quality.toString())
      }
      if (preset) {
        ffmpegArgs.push('-preset', preset || 'default')
      }
    }
  }

  // 设置尺寸调整
  let newWidth = width
  let newHeight = height

  if (width || height) {
    // 如果需要保持宽高比，并且提供了宽度和高度，则使用宽高比进行计算
    if (maintainAspectRatio && originalWidth && originalHeight) {
      if (width && height) {
        // 根据原图比例计算合适的尺寸
        const originalRatio = originalWidth / originalHeight
        const targetRatio = width / height

        if (originalRatio > targetRatio) {
          // 原图更宽，以宽度为准
          newWidth = width
          newHeight = Math.round(width / originalRatio)
        } else {
          // 原图更高，以高度为准
          newHeight = height
          newWidth = Math.round(height * originalRatio)
        }
      } else if (width) {
        // 只提供宽度，按比例计算高度
        newWidth = width
        newHeight = Math.round(width / (originalWidth / originalHeight))
      } else if (height) {
        // 只提供高度，按比例计算宽度
        newHeight = height
        newWidth = Math.round(height * (originalWidth / originalHeight))
      }
    } else {
      // 不保持宽高比或无法获取原始尺寸
      newWidth = width || originalWidth
      newHeight = height || originalHeight
    }

    // 设置缩放参数
    if (newWidth && newHeight) {
      ffmpegArgs.push('-vf', `scale=${newWidth}:${newHeight}:flags=lanczos`)
    }
  } else {
    // 没有提供新的宽高，使用原图尺寸
    newWidth = originalWidth
    newHeight = originalHeight
  }

  // 像素格式(可选)
  // ffmpegArgs.push('-pix_fmt', 'yuv420p')

  // 添加输出路径
  ffmpegArgs.push(outputPath)

  console.log('ffmpegArgs:', ffmpegArgs)

  // 执行压缩
  await execFileAsync(ffmpegPath, ffmpegArgs)

  // 获取压缩后文件大小
  const compressedSize = await getFileSize(outputPath)

  // 计算压缩比率
  const compressionRatio = originalSize > 0 ? originalSize / compressedSize : 1

  console.log('outputPath:', outputPath)
  console.log('originalSize:', originalSize)
  console.log('compressedSize:', compressedSize)
  console.log('compressionRatio:', compressionRatio)
  console.log('originalWidth:', originalWidth)
  console.log('originalHeight:', originalHeight)
  console.log('newWidth:', newWidth)
  console.log('newHeight:', newHeight)

  return {
    outputPath,
    originalSize,
    compressedSize,
    compressionRatio,
    originalWidth,
    originalHeight,
    newWidth: newWidth || originalWidth,
    newHeight: newHeight || originalHeight
  }
}

/**
 * 压缩视频文件
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @param crf 压缩率 (0-51, 越大压缩率越高但质量越低)
 * @param options 其他压缩选项
 * @returns 输出文件路径
 */
export async function compressVideo(
  inputPath: string,
  outputPath: string,
  crf: number = 23,
  options: {
    format?: string
    encoder?: string
    preset?: string
    width?: number
    height?: number
    fps?: number
    maintainAspectRatio?: boolean
  } = {}
): Promise<{
  outputPath: string
  originalSize: number
  compressedSize: number
}> {
  // 检查输入文件是否存在
  if (!existsSync(inputPath)) {
    throw new Error(`输入文件不存在: ${inputPath}`)
  }

  // 确保输出目录存在
  const outputDir = path.dirname(outputPath)
  await fs.mkdir(outputDir, { recursive: true })

  // 如果输出文件已存在，则删除
  checkFileExists(outputPath)

  // 确定编码器
  // const encoder = options.encoder || 'libx264' // 默认使用H.264

  // 确定预设
  const preset = options.preset || 'medium' // 默认使用medium预设

  // 基础ffmpeg参数
  const ffmpegArgs = ['-i', inputPath]

  // 如果指定了分辨率
  if (options.width || options.height) {
    let scaleFilter = 'scale='

    // 设置宽度，如果未指定则使用-1表示自动按比例计算
    scaleFilter += options.width ? options.width : '-1'

    // 添加分隔符
    scaleFilter += ':'

    // 设置高度，如果未指定则使用-1表示自动按比例计算
    scaleFilter += options.height ? options.height : '-1'

    // 添加过滤器选项
    ffmpegArgs.push('-vf', scaleFilter)
  }

  // 如果指定了帧率
  if (options.fps) {
    ffmpegArgs.push('-r', options.fps.toString())
  }

  // 视频编码器设置
  // ffmpegArgs.push('-c:v', encoder)

  // 质量控制
  ffmpegArgs.push('-crf', crf.toString())

  // 编码预设
  ffmpegArgs.push('-preset', preset)

  // 音频编码 (默认保持原始音频编码)
  ffmpegArgs.push('-c:a', 'copy')

  // 输出文件
  ffmpegArgs.push(outputPath)

  console.log('ffmpeg视频压缩命令:', ffmpegArgs.join(' '))

  // 执行ffmpeg命令
  await execFileAsync(ffmpegPath, ffmpegArgs)
  return {
    outputPath,
    originalSize: await getFileSize(inputPath),
    compressedSize: await getFileSize(outputPath)
  }
}

/**
 * 压缩音频文件
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @param bitrate 比特率 (如 '128k')
 * @param sampleRate 采样率 (如 44100)
 * @param channels 声道数 (如 2)
 * @param format 格式 (如 'mp3')
 * @returns 输出文件路径
 */
export async function compressAudio(
  inputPath: string,
  outputPath: string,
  bitrate: string = '128k',
  sampleRate?: number,
  channels?: number,
  format?: 'mp3' | 'aac' | 'ogg' | 'wav'
): Promise<{
  outputPath: string
  originalSize: number
  compressedSize: number
}> {
  checkFileExists(outputPath)

  // 根据输出路径确定格式
  if (!format) {
    const ext = outputPath.split('.').pop()?.toLowerCase()
    if (ext === 'mp3' || ext === 'aac' || ext === 'ogg' || ext === 'wav') {
      format = ext as 'mp3' | 'aac' | 'ogg' | 'wav'
    } else {
      format = 'aac' // 默认格式
    }
  }

  // 准备ffmpeg参数
  const ffmpegArgs: string[] = ['-i', inputPath]

  // 添加采样率设置
  if (sampleRate) {
    ffmpegArgs.push('-ar', sampleRate.toString())
  }

  // 添加声道数设置
  if (channels) {
    ffmpegArgs.push('-ac', channels.toString())
  }

  // 根据格式设置编码器和比特率
  switch (format) {
    case 'mp3':
      ffmpegArgs.push('-c:a', 'libmp3lame', '-b:a', bitrate)
      break
    case 'aac':
      ffmpegArgs.push('-c:a', 'aac', '-b:a', bitrate)
      break
    case 'ogg':
      ffmpegArgs.push('-c:a', 'libvorbis', '-b:a', bitrate)
      break
    case 'wav':
      ffmpegArgs.push('-c:a', 'pcm_s16le') // WAV格式不使用比特率
      break
    default:
      ffmpegArgs.push('-c:a', 'aac', '-b:a', bitrate)
  }

  // 添加输出路径
  ffmpegArgs.push(outputPath)
  console.log(ffmpegArgs)

  console.log('执行音频压缩命令:', ffmpegPath, ffmpegArgs.join(' '))

  try {
    await execFileAsync(ffmpegPath, ffmpegArgs)
    return {
      outputPath,
      originalSize: await getFileSize(inputPath),
      compressedSize: await getFileSize(outputPath)
    }
  } catch (error) {
    console.error('音频压缩失败:', error)
    throw error
  }
}

/**
 * 获取视频信息
 * @param videoPath 视频文件路径
 * @returns 视频信息对象
 */
export async function getVideoInfo(videoPath: string): Promise<{
  width?: number
  height?: number
  duration?: number
  bitrate?: number
  fps?: number
  codec?: string
  format?: string
}> {
  try {
    // 检查文件是否是视频文件
    const ext = path.extname(videoPath).toLowerCase()
    const validVideoExts = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.flv', '.wmv', '.m4v']
    if (!validVideoExts.includes(ext)) {
      throw new Error(`不支持的视频格式: ${ext}`)
    }

    // 使用ffprobe获取视频信息
    const args = [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=width,height,codec_name,r_frame_rate,bit_rate',
      '-show_entries',
      'format=duration,format_name,bit_rate',
      '-of',
      'json',
      videoPath
    ]

    const { stdout } = await execFileAsync(ffprobePath, args)
    const info = JSON.parse(stdout)

    // 处理帧率 (可能是"24/1"这样的格式)
    let fps
    if (info.streams && info.streams[0] && info.streams[0].r_frame_rate) {
      const fpsStr = info.streams[0].r_frame_rate
      if (fpsStr.includes('/')) {
        const [num, den] = fpsStr.split('/').map(Number)
        fps = Math.round((num / den) * 100) / 100 // 保留两位小数
      } else {
        fps = parseFloat(fpsStr)
      }
    }

    // 获取比特率
    let bitrate = 0
    if (info.streams && info.streams[0] && info.streams[0].bit_rate) {
      bitrate = parseInt(info.streams[0].bit_rate)
    } else if (info.format && info.format.bit_rate) {
      bitrate = parseInt(info.format.bit_rate)
    }

    return {
      width: info.streams?.[0]?.width,
      height: info.streams?.[0]?.height,
      duration: info.format?.duration ? parseFloat(info.format.duration) : undefined,
      bitrate,
      fps,
      codec: info.streams?.[0]?.codec_name,
      format: info.format?.format_name
    }
  } catch (error) {
    console.error('获取视频信息失败:', error)
    throw error
  }
}
