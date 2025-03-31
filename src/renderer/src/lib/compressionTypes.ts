/*
 * @Author: Libra
 * @Date: 2024-03-31
 * @LastEditors: Libra
 * @Description: 文件压缩类型定义
 */
import { ImageIcon, Video, Music } from 'lucide-react'

// 图片压缩质量配置
export const IMAGE_QUALITY_PRESETS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  CUSTOM: 'custom'
} as const

export type ImageQualityPreset = (typeof IMAGE_QUALITY_PRESETS)[keyof typeof IMAGE_QUALITY_PRESETS]

// 图片格式
export const IMAGE_FORMATS = {
  JPG: 'jpg',
  PNG: 'png',
  WEBP: 'webp'
} as const

export type ImageFormat = (typeof IMAGE_FORMATS)[keyof typeof IMAGE_FORMATS]

// 图片压缩质量配置
export interface QualityConfig {
  jpegQuality: number // 2-31，越低越好
  pngCompression: number // 0-9，越高越好
  webpQuality: number // 0-100，越高越好
  webpLossless: boolean // 是否使用无损模式
}

// 预设质量配置
export const QUALITY_PRESETS: Record<Exclude<ImageQualityPreset, 'custom'>, QualityConfig> = {
  [IMAGE_QUALITY_PRESETS.HIGH]: {
    jpegQuality: 2,
    pngCompression: 9,
    webpQuality: 90,
    webpLossless: false
  },
  [IMAGE_QUALITY_PRESETS.MEDIUM]: {
    jpegQuality: 10,
    pngCompression: 7,
    webpQuality: 75,
    webpLossless: false
  },
  [IMAGE_QUALITY_PRESETS.LOW]: {
    jpegQuality: 20,
    pngCompression: 5,
    webpQuality: 60,
    webpLossless: false
  }
}

// 预设WebP配置名称
export const WEBP_PRESETS = {
  DEFAULT: 'default',
  PHOTO: 'photo',
  PICTURE: 'picture',
  DRAWING: 'drawing'
} as const

export type WebpPreset = (typeof WEBP_PRESETS)[keyof typeof WEBP_PRESETS]

// 压缩类别定义
export interface CompressionCategory {
  name: string
  icon: typeof ImageIcon | typeof Video | typeof Music
  description: string
  formats: string[]
}

// 压缩类别
export const compressionCategories: CompressionCategory[] = [
  {
    name: 'image',
    icon: ImageIcon,
    description: 'imageCompression',
    formats: ['.jpg', '.jpeg', '.png', '.webp', '.gif']
  },
  {
    name: 'video',
    icon: Video,
    description: 'videoCompression',
    formats: ['.mp4', '.avi', '.mov', '.webm']
  },
  {
    name: 'audio',
    icon: Music,
    description: 'audioCompression',
    formats: ['.mp3', '.wav', '.m4a', '.flac']
  }
]
