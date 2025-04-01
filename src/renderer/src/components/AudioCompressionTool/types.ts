/*
 * @Author: Libra
 * @Date: 2025-04-01 09:48:41
 * @LastEditors: Libra
 * @Description:
 */
// 音频格式常量
export const AUDIO_FORMATS = {
  MP3: 'mp3',
  AAC: 'aac',
  OGG: 'ogg',
  WAV: 'wav'
} as const

// 音频质量预设常量
export const AUDIO_QUALITY_PRESETS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  CUSTOM: 'custom'
} as const

// 类型定义
export type AudioFormat = (typeof AUDIO_FORMATS)[keyof typeof AUDIO_FORMATS] | 'original'
export type AudioQualityPreset = (typeof AUDIO_QUALITY_PRESETS)[keyof typeof AUDIO_QUALITY_PRESETS]

// 音频压缩结果接口
export interface CompressionResult {
  originalSize: number
  compressedSize: number
  compressionRatio: number
  outputPath: string
  format: string
  duration?: number
}

// 音频信息接口
export interface AudioInfo {
  duration?: number
  bitrate?: number
  sampleRate?: number
  channels?: number
  format?: string
}

// 音频压缩选项接口
export interface CompressionOptions {
  bitrate?: string // 如 '128k', '192k', '320k'
  format?: 'mp3' | 'aac' | 'ogg' | 'wav'
  sampleRate?: number // 如 44100, 48000
  channels?: number // 单声道或立体声
}
