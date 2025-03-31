/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 图像压缩相关IPC处理程序
 */
import { ipcMain } from 'electron'
import { compressImage, ImageCompressionOptions } from '../../compressors/fileCompressors'

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

  // 估算文件大小
  ipcMain.handle(
    'estimate-compressed-size',
    async (_, inputPath: string, quality: number, scale: number = 1) => {
      try {
        console.log(
          `IPC调用: estimate-compressed-size ${inputPath}, quality=${quality}, scale=${scale}`
        )

        // 获取原图大小和尺寸
        const originalInfo = await compressImage(
          inputPath,
          inputPath + '.probe.jpg', // 临时文件
          { quality: 100 } // 高质量获取信息
        )

        // 创建样本
        const sampleOptions = {
          quality,
          width: Math.round((originalInfo.originalWidth || 100) * 0.1), // 10%尺寸样本
          height: Math.round((originalInfo.originalHeight || 100) * 0.1),
          maintainAspectRatio: true
        }

        // 生成样本并计算压缩比
        const sampleResult = await compressImage(
          inputPath,
          inputPath + '.sample.jpg',
          sampleOptions
        )

        // 估算最终大小
        const finalWidth = Math.round((originalInfo.originalWidth || 100) * scale)
        const finalHeight = Math.round((originalInfo.originalHeight || 100) * scale)
        const estimatedSize = Math.round(
          (sampleResult.compressedSize * (finalWidth * finalHeight)) /
            (sampleResult.newWidth! * sampleResult.newHeight!)
        )

        return {
          estimatedSize,
          compressionRatio: originalInfo.originalSize / estimatedSize,
          originalSize: originalInfo.originalSize,
          originalWidth: originalInfo.originalWidth,
          originalHeight: originalInfo.originalHeight,
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
