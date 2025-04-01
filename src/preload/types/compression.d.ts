/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 文件压缩类型定义
 */

// 图片压缩选项
export interface ImageCompressionOptions {
  quality?: number // 质量 (JPEG: 2-31, WebP: 0-100)
  width?: number // 宽度 (像素)
  height?: number // 高度 (像素)
  maintainAspectRatio?: boolean // 是否保持宽高比
  format?: 'jpg' | 'png' | 'webp' // 输出格式
  compressionLevel?: number // PNG压缩级别 (0-9)
  lossless?: boolean // WebP是否使用无损压缩
  preset?: 'default' | 'photo' | 'picture' | 'drawing' // WebP预设
}

// 图片压缩结果
export interface ImageCompressionResult {
  outputPath: string
  originalSize: number
  compressedSize: number
  compressionRatio: number
  originalWidth?: number
  originalHeight?: number
  newWidth?: number
  newHeight?: number
}

// 压缩尺寸估算结果
export interface SizeEstimationResult {
  estimatedSize: number
  compressionRatio: number
  originalSize: number
  originalWidth?: number
  originalHeight?: number
  newWidth?: number
  newHeight?: number
}

// 视频压缩选项
export interface VideoCompressionOptions {
  format?: string // 输出格式
  encoder?: string // 视频编码器
  crf?: number // 质量因子 (0-51)
  preset?: string // 编码预设
  width?: number
  height?: number
  fps?: number
  maintainAspectRatio?: boolean
}

// 视频压缩结果
export interface VideoCompressionResult {
  outputPath: string
  originalSize: number
  compressedSize: number
  compressionRatio: number
  duration?: number
  width?: number
  height?: number
  format?: string
}

export interface Compression {
  /**
   * 压缩图片
   * @param inputPath 输入路径
   * @param outputPath 输出路径
   * @param options 压缩选项
   * @returns 压缩结果
   */
  compressImage: (
    inputPath: string,
    outputPath: string,
    options?: Partial<ImageCompressionOptions>
  ) => Promise<ImageCompressionResult>

  /**
   * 估算压缩后的文件大小
   * @param inputPath 输入路径
   * @param quality 质量值
   * @param scale 尺寸缩放比例
   * @returns 估算结果
   */
  estimateCompressedSize: (
    inputPath: string,
    quality: number,
    scale?: number
  ) => Promise<SizeEstimationResult>

  /**
   * 压缩视频
   * @param inputPath 输入路径
   * @param outputPath 输出路径
   * @param options 压缩选项
   * @returns 压缩结果
   */
  compressVideo: (
    inputPath: string,
    outputPath: string,
    options?: Partial<VideoCompressionOptions>
  ) => Promise<VideoCompressionResult>

  /**
   * 压缩音频
   * @param inputPath 输入路径
   * @param outputPath 输出路径
   * @returns 输出路径
   */
  compressAudio: (inputPath: string, outputPath: string) => Promise<string>

  /**
   * 获取视频信息
   * @param inputPath 输入路径
   * @returns 视频信息对象
   */
  getVideoInfo: (inputPath: string) => Promise<{
    width?: number
    height?: number
    duration?: number
    bitrate?: number
    fps?: number
    codec?: string
    format?: string
  }>
}
