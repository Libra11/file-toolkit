import { CompressionOptions } from './types'

/**
 * 根据输入文件大小和压缩选项预估压缩后的文件大小
 * @param originalSize 原始文件大小（字节）
 * @param options 压缩选项
 * @returns 预估的压缩后文件大小（字节）
 */
export function estimateCompressedSize(originalSize: number, options: CompressionOptions): number {
  // 获取选择的比特率
  const bitrate = options.bitrate || '128k'
  const bitrateValue = parseInt(bitrate.replace('k', ''))

  // 基于比特率的简单估算
  // 原始值通常是无损的，比如WAV通常是1411kbps (CD质量)
  // 如果选择128k的比特率，大约是原始CD质量的1/11
  let compressionRatio = 1

  if (options.format === 'mp3') {
    if (bitrateValue <= 96)
      compressionRatio = 12 // 低比特率
    else if (bitrateValue <= 192)
      compressionRatio = 8 // 中等比特率
    else compressionRatio = 5 // 高比特率
  } else if (options.format === 'aac') {
    if (bitrateValue <= 96)
      compressionRatio = 15 // AAC在低比特率下效率更高
    else if (bitrateValue <= 192) compressionRatio = 10
    else compressionRatio = 6
  } else if (options.format === 'ogg') {
    if (bitrateValue <= 96) compressionRatio = 14
    else if (bitrateValue <= 192) compressionRatio = 9
    else compressionRatio = 5.5
  } else if (options.format === 'wav') {
    compressionRatio = 1 // WAV通常是无损的，不压缩
  }

  // 估算压缩后的大小
  const estimatedSize = Math.round(originalSize / compressionRatio)

  // 确保返回值合理
  return Math.max(estimatedSize, 1024) // 至少1KB
}
