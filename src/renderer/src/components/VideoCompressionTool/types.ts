/*
 * @Author: Libra
 * @Date: 2025-04-01
 * @LastEditors: Libra
 * @Description: 视频压缩工具类型定义
 */
// 视频格式常量
export const VIDEO_FORMATS = {
  MP4: 'mp4',
  MOV: 'mov',
  AVI: 'avi',
  MKV: 'mkv',
  WEBM: 'webm'
} as const

// 视频质量预设常量
export const VIDEO_QUALITY_PRESETS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  CUSTOM: 'custom'
} as const

// 编码器预设
export const VIDEO_ENCODERS = {
  H264: 'h264',
  H265: 'h265',
  VP9: 'vp9',
  AV1: 'av1'
} as const

// 类型定义
export type VideoFormat = (typeof VIDEO_FORMATS)[keyof typeof VIDEO_FORMATS] | 'original'
export type VideoQualityPreset = (typeof VIDEO_QUALITY_PRESETS)[keyof typeof VIDEO_QUALITY_PRESETS]
export type VideoEncoder = (typeof VIDEO_ENCODERS)[keyof typeof VIDEO_ENCODERS]

// 视频压缩结果接口
export interface CompressionResult {
  originalSize: number
  compressedSize: number
  compressionRatio: number
  outputPath: string
  format: string
  duration?: number
  width?: number
  height?: number
  fileName?: string // 文件名，用于批量处理

  // 批量处理相关字段
  batchResults?: CompressionResult[] // 批量压缩的每个结果
  totalOriginalSize?: number // 总原始大小
  totalCompressedSize?: number // 总压缩大小
  fileCount?: number // 处理的文件数量
}

// 视频信息接口
export interface VideoInfo {
  duration?: number
  width?: number
  height?: number
  bitrate?: number
  fps?: number
  codec?: string
  format?: string
}

// 视频压缩选项接口
export interface CompressionOptions {
  format?: 'mp4' | 'mov' | 'avi' | 'mkv' | 'webm'
  encoder?: VideoEncoder
  crf?: number // 恒定质量因子 (0-51，越低质量越好)
  preset?: string // 编码预设 (如 'ultrafast', 'medium', 'veryslow')
  bitrate?: string // 如 '1M', '5M'
  width?: number
  height?: number
  fps?: number // 帧率
  audioCodec?: string // 音频编码器
  audioBitrate?: string // 音频比特率
}
