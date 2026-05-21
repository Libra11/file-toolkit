import { ipcMain, dialog } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { ffmpegPath, ffprobePath } from '../utils/ffmpegConfig'

const execFileAsync = promisify(execFile)

interface VideoSpriteConfig {
  totalFrames: number  // 总共提取多少帧
  scale?: number
  columns: number
  rows?: number
  format?: 'png' | 'jpg'
}

interface SpriteGifConfig {
  fps: number
  frameWidth: number
  frameHeight: number
  rows: number
  columns: number
  totalFrames?: number
}

/**
 * 获取视频信息
 */
async function getVideoInfo(videoPath: string): Promise<{ duration: number; width: number; height: number; fps: number; frameCount: number }> {
  const { stdout } = await execFileAsync(ffprobePath, [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,r_frame_rate,duration,nb_frames',
    '-show_entries', 'format=duration',
    '-of', 'json',
    videoPath
  ])
  
  const info = JSON.parse(stdout)
  const stream = info.streams?.[0] || {}
  const format = info.format || {}
  
  // 解析帧率 (格式: "30/1" 或 "29.97")
  let fps = 30
  if (stream.r_frame_rate) {
    const parts = stream.r_frame_rate.split('/')
    fps = parts.length === 2 ? parseInt(parts[0]) / parseInt(parts[1]) : parseFloat(stream.r_frame_rate)
  }
  
  const duration = parseFloat(stream.duration || format.duration || '0')
  const frameCount = parseInt(stream.nb_frames) || Math.floor(duration * fps)
  
  return {
    duration,
    width: stream.width || 0,
    height: stream.height || 0,
    fps,
    frameCount
  }
}

/**
 * 视频转帧序列拼图
 */
async function videoToSprite(
  videoPath: string,
  outputDir: string,
  config: VideoSpriteConfig
): Promise<{ success: boolean; outputPath: string; error?: string }> {
  try {
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      await fs.promises.mkdir(outputDir, { recursive: true })
    }
    
    const videoInfo = await getVideoInfo(videoPath)
    
    // 用户指定的总帧数
    const totalFrames = config.totalFrames
    
    // 计算行数（如果未指定）
    const columns = config.columns
    const rows = config.rows || Math.ceil(totalFrames / columns)
    
    // 计算缩放
    const scale = config.scale || 1
    const frameWidth = Math.floor(videoInfo.width * scale)
    const frameHeight = Math.floor(videoInfo.height * scale)
    
    // 生成输出文件名
    const baseName = path.basename(videoPath, path.extname(videoPath))
    const format = config.format || 'png'
    const outputPath = path.join(outputDir, `${baseName}_sprite_${columns}x${rows}.${format}`)
    
    // 使用 select 滤镜均匀抽取帧
    // 计算需要每隔多少帧抽取一帧
    // select='not(mod(n,X))' 表示每 X 帧取一帧
    const frameInterval = Math.max(1, Math.floor(videoInfo.frameCount / totalFrames))
    
    // 使用 ffmpeg 的 select + tile 滤镜生成拼图
    // select='not(mod(n,interval))' 等间隔选帧
    // setpts='N/FRAME_RATE/TB' 重置时间戳
    const filterComplex = [
      `select='not(mod(n\\,${frameInterval}))'`,
      `scale=${frameWidth}:${frameHeight}`,
      `tile=${columns}x${rows}:nb_frames=${totalFrames}`
    ].join(',')
    
    await execFileAsync(ffmpegPath, [
      '-y',
      '-i', videoPath,
      '-vf', filterComplex,
      '-frames:v', '1',
      '-q:v', '2',
      '-vsync', 'vfr',
      outputPath
    ])
    
    return { success: true, outputPath }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('视频转拼图失败:', errorMessage)
    return { success: false, outputPath: '', error: errorMessage }
  }
}

/**
 * 帧序列拼图转 GIF
 */
async function spriteToGif(
  imagePath: string,
  outputDir: string,
  config: SpriteGifConfig
): Promise<{ success: boolean; outputPath: string; error?: string }> {
  try {
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      await fs.promises.mkdir(outputDir, { recursive: true })
    }
    
    const { frameWidth, frameHeight, rows, columns, fps } = config
    const totalFrames = config.totalFrames || (rows * columns)
    
    // 生成输出文件名
    const baseName = path.basename(imagePath, path.extname(imagePath))
    const outputPath = path.join(outputDir, `${baseName}.gif`)
    
    // 创建临时目录存放分割的帧
    const tempDir = path.join(outputDir, `.temp_${Date.now()}`)
    await fs.promises.mkdir(tempDir, { recursive: true })
    
    try {
      // 使用 ffmpeg 分割拼图为单帧
      // 使用 crop 滤镜逐帧提取
      const cropPromises: Promise<void>[] = []
      
      for (let i = 0; i < totalFrames; i++) {
        const row = Math.floor(i / columns)
        const col = i % columns
        const x = col * frameWidth
        const y = row * frameHeight
        
        const framePath = path.join(tempDir, `frame_${String(i).padStart(4, '0')}.png`)
        
        cropPromises.push(
          execFileAsync(ffmpegPath, [
            '-y',
            '-i', imagePath,
            '-vf', `crop=${frameWidth}:${frameHeight}:${x}:${y}`,
            '-frames:v', '1',
            framePath
          ]).then(() => {})
        )
      }
      
      await Promise.all(cropPromises)
      
      // 生成调色板
      const palettePath = path.join(tempDir, 'palette.png')
      const framePattern = path.join(tempDir, 'frame_%04d.png')
      
      await execFileAsync(ffmpegPath, [
        '-y',
        '-framerate', fps.toString(),
        '-i', framePattern,
        '-vf', 'palettegen=stats_mode=diff',
        palettePath
      ])
      
      // 生成 GIF
      await execFileAsync(ffmpegPath, [
        '-y',
        '-framerate', fps.toString(),
        '-i', framePattern,
        '-i', palettePath,
        '-lavfi', 'paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle',
        '-loop', '0',
        outputPath
      ])
      
      return { success: true, outputPath }
    } finally {
      // 清理临时文件
      try {
        const files = await fs.promises.readdir(tempDir)
        for (const file of files) {
          await fs.promises.unlink(path.join(tempDir, file))
        }
        await fs.promises.rmdir(tempDir)
      } catch {
        // 忽略清理错误
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('拼图转GIF失败:', errorMessage)
    return { success: false, outputPath: '', error: errorMessage }
  }
}

/**
 * 注册视频拼图相关的 IPC 处理程序
 */
export function registerVideoSpriteHandlers(): void {
  // 选择视频文件
  ipcMain.handle('video-sprite:select-video', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Video Files', extensions: ['mp4', 'webm', 'mov', 'avi', 'mkv', 'gif'] }
      ]
    })
    return result.canceled ? null : result.filePaths[0]
  })
  
  // 选择图片文件
  ipcMain.handle('video-sprite:select-image', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Image Files', extensions: ['png', 'jpg', 'jpeg', 'webp'] }
      ]
    })
    return result.canceled ? null : result.filePaths[0]
  })
  
  // 视频转拼图
  ipcMain.handle('video-sprite:video-to-sprite', async (_, params: {
    videoPath: string
    outputDir: string
    config: VideoSpriteConfig
  }) => {
    return videoToSprite(params.videoPath, params.outputDir, params.config)
  })
  
  // 拼图转GIF
  ipcMain.handle('video-sprite:sprite-to-gif', async (_, params: {
    imagePath: string
    outputDir: string
    config: SpriteGifConfig
  }) => {
    return spriteToGif(params.imagePath, params.outputDir, params.config)
  })
}
