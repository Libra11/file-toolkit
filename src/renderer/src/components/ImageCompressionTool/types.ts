// 图片格式常量
export const IMAGE_FORMATS = {
  JPG: 'jpg',
  PNG: 'png',
  WEBP: 'webp'
} as const

// 图片质量预设常量
export const IMAGE_QUALITY_PRESETS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  CUSTOM: 'custom'
} as const

// WebP预设常量
export const WEBP_PRESETS = {
  DEFAULT: 'default',
  PHOTO: 'photo',
  PICTURE: 'picture',
  DRAWING: 'drawing'
} as const

// 类型定义
export type ImageFormat = (typeof IMAGE_FORMATS)[keyof typeof IMAGE_FORMATS] | 'original'
export type ImageQualityPreset = (typeof IMAGE_QUALITY_PRESETS)[keyof typeof IMAGE_QUALITY_PRESETS]
export type WebpPreset = (typeof WEBP_PRESETS)[keyof typeof WEBP_PRESETS]

// 压缩结果接口
export interface CompressionResult {
  originalSize: number
  compressedSize: number
  compressionRatio: number
  outputPath: string
  newWidth?: number
  newHeight?: number
  format: string
}

// 图片信息接口
export interface ImageInfo {
  width?: number
  height?: number
}

// 压缩选项接口
export interface CompressionOptions {
  quality?: number
  format?: 'jpg' | 'png' | 'webp'
  width?: number
  height?: number
  lossless?: boolean
  preset?: WebpPreset
  compressionLevel?: number
}
