/*
 * @Author: Libra
 * @Date: 2025-04-01
 * @LastEditors: Libra
 * @Description: 视频压缩工具辅助函数
 */
import { VideoQualityPreset, VIDEO_QUALITY_PRESETS } from './types'

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 计算压缩百分比
 * @param originalSize 原始大小
 * @param compressedSize 压缩后大小
 * @returns 压缩百分比
 */
export function calculateCompressionPercentage(
  originalSize: number,
  compressedSize: number
): number {
  if (originalSize === 0) return 0
  const percentage = ((originalSize - compressedSize) / originalSize) * 100
  return Math.round(percentage)
}

/**
 * 格式化时间
 * @param seconds 秒数
 * @returns 格式化后的时间字符串 (MM:SS)
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * 根据质量预设获取推荐的CRF值
 * @param preset 质量预设
 * @returns CRF值
 */
export function getCRFByPreset(preset: VideoQualityPreset): number {
  switch (preset) {
    case VIDEO_QUALITY_PRESETS.HIGH:
      return 18
    case VIDEO_QUALITY_PRESETS.MEDIUM:
      return 23
    case VIDEO_QUALITY_PRESETS.LOW:
      return 28
    default:
      return 23
  }
}

/**
 * 根据质量预设估计压缩后的文件大小
 * @param originalSize 原始文件大小
 * @param preset 质量预设
 * @returns 估计的压缩后大小
 */
export function estimateCompressedSize(originalSize: number, preset: VideoQualityPreset): number {
  switch (preset) {
    case VIDEO_QUALITY_PRESETS.HIGH:
      return Math.round(originalSize * 0.7)
    case VIDEO_QUALITY_PRESETS.MEDIUM:
      return Math.round(originalSize * 0.5)
    case VIDEO_QUALITY_PRESETS.LOW:
      return Math.round(originalSize * 0.3)
    default:
      return Math.round(originalSize * 0.5)
  }
}
