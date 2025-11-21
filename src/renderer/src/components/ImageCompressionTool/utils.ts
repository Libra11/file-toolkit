import { ImageQualityPreset, IMAGE_QUALITY_PRESETS, CompressionOptions } from './types'

// 格式化文件大小显示
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// 获取压缩质量配置
export function getQualityConfig(outputFormat: string): {
  min: number
  max: number
  step: number
  value: number
  compressionLevel?: number
} {
  if (outputFormat === 'png') {
    return { min: 0, max: 9, step: 1, value: 6 }
  } else if (outputFormat === 'jpg') {
    return { min: 0, max: 100, step: 1, value: 75 }
  } else {
    return { min: 0, max: 100, step: 1, value: 75 }
  }
}

// 根据预设获取压缩选项
export function getCompressionOptionsByPreset(
  preset: ImageQualityPreset,
  format: string
): CompressionOptions {
  const options: CompressionOptions = {}

  switch (preset) {
    case IMAGE_QUALITY_PRESETS.HIGH:
      if (format === 'png') {
        options.compressionLevel = 3
      } else {
        options.quality = 90
      }
      break
    case IMAGE_QUALITY_PRESETS.MEDIUM:
      if (format === 'png') {
        options.compressionLevel = 6
      } else {
        options.quality = 75
      }
      break
    case IMAGE_QUALITY_PRESETS.LOW:
      if (format === 'png') {
        options.compressionLevel = 9
      } else {
        options.quality = 50
      }
      break
  }

  return options
}

// 计算压缩比例
export function calculateCompressionRatio(
  originalSize: number,
  compressedSize: number
): {
  ratio: number
  percentage: number
} {
  const ratio = originalSize / compressedSize
  const percentage = Math.round((1 - compressedSize / originalSize) * 100)
  return { ratio, percentage }
}

// 估算压缩后的文件大小
export function estimateCompressedSize(originalSize: number, preset: ImageQualityPreset): number {
  let estimatedRatio = 0.8 // 默认80%的大小
  switch (preset) {
    case IMAGE_QUALITY_PRESETS.HIGH:
      estimatedRatio = 0.85
      break
    case IMAGE_QUALITY_PRESETS.MEDIUM:
      estimatedRatio = 0.65
      break
    case IMAGE_QUALITY_PRESETS.LOW:
      estimatedRatio = 0.45
      break
  }
  return Math.round(originalSize * estimatedRatio)
}
