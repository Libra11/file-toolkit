/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 图像格式转换功能（使用 Sharp 优化性能）
 */
import sharp from 'sharp'
import fs from 'fs/promises'
import { existsSync } from 'fs'

/**
 * 通用图片格式转换函数
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @param format 输出格式
 * @param options 转换选项
 * @returns 输出文件路径
 */
async function convertImage(
  inputPath: string,
  outputPath: string,
  format: 'jpeg' | 'png' | 'webp',
  options?: {
    quality?: number
    compressionLevel?: number
    lossless?: boolean
  }
): Promise<string> {
  try {
    console.log(`开始转换图片: ${inputPath} -> ${outputPath} (格式: ${format})`)

    // 检查输入文件是否存在
    if (!existsSync(inputPath)) {
      throw new Error(`输入文件不存在: ${inputPath}`)
    }

    // 删除已存在的输出文件
    if (existsSync(outputPath)) {
      await fs.unlink(outputPath)
    }

    // 使用 Sharp 进行转换
    let sharpInstance = sharp(inputPath)

    // 根据格式设置参数
    switch (format) {
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({
          quality: options?.quality || 90,
          mozjpeg: true
        })
        break
      case 'png':
        sharpInstance = sharpInstance.png({
          compressionLevel: options?.compressionLevel || 9,
          quality: options?.quality || 100
        })
        break
      case 'webp':
        if (options?.lossless) {
          sharpInstance = sharpInstance.webp({
            lossless: true,
            effort: options?.compressionLevel || 6
          })
        } else {
          sharpInstance = sharpInstance.webp({
            quality: options?.quality || 90,
            effort: 6
          })
        }
        break
    }

    // 执行转换并保存
    await sharpInstance.toFile(outputPath)

    // 检查生成文件
    if (!existsSync(outputPath)) {
      throw new Error(`转换失败，输出文件不存在: ${outputPath}`)
    }

    console.log(`图片转换成功: ${outputPath}`)
    return outputPath
  } catch (error) {
    console.error(`图片转换错误:`, error)
    throw error
  }
}

/**
 * 将PNG转换为JPG
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @returns 输出文件路径
 */
export async function convertPngToJpg(inputPath: string, outputPath: string): Promise<string> {
  return convertImage(inputPath, outputPath, 'jpeg', { quality: 95 })
}

/**
 * 将JPG转换为PNG
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @returns 输出文件路径
 */
export async function convertJpgToPng(inputPath: string, outputPath: string): Promise<string> {
  return convertImage(inputPath, outputPath, 'png', { quality: 100 })
}

/**
 * 将WEBP转换为JPG
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @returns 输出文件路径
 */
export async function convertWebpToJpg(inputPath: string, outputPath: string): Promise<string> {
  return convertImage(inputPath, outputPath, 'jpeg', { quality: 95 })
}

/**
 * 将JPG转换为WEBP
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @returns 输出文件路径
 */
export async function convertJpgToWebp(inputPath: string, outputPath: string): Promise<string> {
  return convertImage(inputPath, outputPath, 'webp', { lossless: true, compressionLevel: 6 })
}

/**
 * 将PNG转换为WEBP
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @returns 输出文件路径
 */
export async function convertPngToWebp(inputPath: string, outputPath: string): Promise<string> {
  return convertImage(inputPath, outputPath, 'webp', { lossless: true, compressionLevel: 6 })
}

/**
 * 将WEBP转换为PNG
 * @param inputPath 输入路径
 * @param outputPath 输出路径
 * @returns 输出文件路径
 */
export async function convertWebpToPng(inputPath: string, outputPath: string): Promise<string> {
  return convertImage(inputPath, outputPath, 'png', { quality: 100 })
}
