/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 图像压缩相关IPC处理程序
 */
import { ipcMain } from 'electron'
import { compressImage, ImageCompressionOptions } from '../../compressors/fileCompressors'
import sharp from 'sharp'
import fs from 'fs/promises'

/**
 * 注册图像压缩相关的IPC处理程序
 */
export function registerImageCompressionHandlers(): void {
  // 图片压缩
  ipcMain.handle(
    'compress-image',
    async (
      _,
      inputPath: string,
      outputPath: string,
      options: Partial<ImageCompressionOptions> = {}
    ) => {
      try {
        console.log(`IPC调用: compress-image ${inputPath} -> ${outputPath}`)
        console.log('压缩选项:', options)

        const result = await compressImage(inputPath, outputPath, options)

        console.log(`压缩成功: ${result.outputPath}`)
        console.log(`原始大小: ${result.originalSize} 字节, 压缩后: ${result.compressedSize} 字节`)
        console.log(`压缩比: ${result.compressionRatio.toFixed(2)}x`)

        if (result.originalWidth && result.originalHeight && result.newWidth && result.newHeight) {
          console.log(
            `原始尺寸: ${result.originalWidth}x${result.originalHeight}, 新尺寸: ${result.newWidth}x${result.newHeight}`
          )
        }

        return result
      } catch (error) {
        console.error('图像压缩IPC错误:', error)
        throw error
      }
    }
  )

  // 估算文件大小（使用 Sharp 优化性能）
  ipcMain.handle(
    'estimate-compressed-size',
    async (_, inputPath: string, quality: number, scale: number = 1) => {
      try {
        console.log(
          `IPC调用: estimate-compressed-size ${inputPath}, quality=${quality}, scale=${scale}`
        )

        // 使用 Sharp 快速获取图片信息
        const metadata = await sharp(inputPath).metadata()
        const originalWidth = metadata.width || 100
        const originalHeight = metadata.height || 100

        // 获取原图大小
        const stats = await fs.stat(inputPath)
        const originalSize = stats.size

        // 计算目标尺寸
        const finalWidth = Math.round(originalWidth * scale)
        const finalHeight = Math.round(originalHeight * scale)

        // 使用 Sharp 快速生成小样本估算压缩比
        // 创建一个 100x100 的小样本用于估算
        const sampleSize = 100
        const sampleWidth = Math.min(sampleSize, originalWidth)
        const sampleHeight = Math.min(sampleSize, originalHeight)

        // 生成样本到内存（不写磁盘，更快）
        const sampleBuffer = await sharp(inputPath)
          .resize(sampleWidth, sampleHeight, { fit: 'inside' })
          .jpeg({ quality: Math.round(((quality - 2) / 29) * 98 + 1), mozjpeg: true })
          .toBuffer()

        // 估算压缩比
        const sampleRatio = (sampleWidth * sampleHeight) / (originalWidth * originalHeight)
        const estimatedCompressedSize = Math.round(
          (sampleBuffer.length / sampleRatio) * scale * scale
        )

        return {
          estimatedSize: estimatedCompressedSize,
          compressionRatio: originalSize / estimatedCompressedSize,
          originalSize,
          originalWidth,
          originalHeight,
          newWidth: finalWidth,
          newHeight: finalHeight
        }
      } catch (error) {
        console.error('尺寸估算错误:', error)
        throw error
      }
    }
  )
}
