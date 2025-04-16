/*
 * @Author: Libra
 * @Date: 2024-10-23
 * @LastEditors: Libra
 * @Description: 文件归档压缩/解压功能
 */
import AdmZip from 'adm-zip'
import * as compressing from 'compressing'
import path from 'path'
import fs from 'fs/promises'
import { createWriteStream } from 'fs'

/**
 * 获取文件大小 (字节)
 * @param filePath 文件路径
 * @returns 文件大小
 */
async function getFileSize(filePath: string): Promise<number> {
  const stats = await fs.stat(filePath)
  return stats.size
}

// 支持的压缩格式
export enum ArchiveFormat {
  ZIP = 'zip',
  TAR = 'tar',
  GZIP = 'gzip',
  TGZ = 'tgz'
}

// 压缩选项接口
export interface ArchiveCompressionOptions {
  format: ArchiveFormat
  level?: number // 压缩级别 (0-9, 仅对ZIP有效)
  comment?: string // 注释 (仅对ZIP有效)
}

// 默认压缩选项
const defaultArchiveOptions: ArchiveCompressionOptions = {
  format: ArchiveFormat.ZIP,
  level: 5
}

// 递归计算目录大小
async function calculateDirSize(dirPath: string): Promise<number> {
  let size = 0
  try {
    const files = await fs.readdir(dirPath)
    for (const file of files) {
      const filePath = path.join(dirPath, file)
      try {
        const stats = await fs.stat(filePath)
        if (stats.isFile()) {
          size += stats.size
        } else if (stats.isDirectory()) {
          size += await calculateDirSize(filePath)
        }
      } catch (error) {
        console.error(`无法读取文件信息 ${filePath}:`, error)
      }
    }
  } catch (error) {
    console.error(`无法读取目录 ${dirPath}:`, error)
  }
  return size
}

/**
 * 压缩文件或目录
 * @param inputPaths 输入文件/目录路径数组
 * @param outputPath 输出压缩包路径
 * @param options 压缩选项
 * @returns 压缩结果
 */
export async function compressFiles(
  inputPaths: string[],
  outputPath: string,
  options: Partial<ArchiveCompressionOptions> = {}
): Promise<{
  outputPath: string
  originalSize: number
  compressedSize: number
  entryCount: number
}> {
  // 合并选项
  const mergedOptions = { ...defaultArchiveOptions, ...options }
  const { format, comment } = mergedOptions

  // 确保输出目录存在
  const outputDir = path.dirname(outputPath)
  await fs.mkdir(outputDir, { recursive: true })

  // 检查输入文件是否存在
  for (const inputPath of inputPaths) {
    try {
      await fs.access(inputPath)
    } catch (error) {
      throw new Error(`输入文件不存在: ${inputPath}`)
    }
  }

  // 计算原始总大小
  let originalSize = 0
  for (const inputPath of inputPaths) {
    const stats = await fs.stat(inputPath)
    if (stats.isFile()) {
      originalSize += stats.size
    } else if (stats.isDirectory()) {
      originalSize += await calculateDirSize(inputPath)
    }
  }

  let entryCount = 0

  // 根据格式选择压缩方法
  switch (format) {
    case ArchiveFormat.ZIP: {
      const zip = new AdmZip()
      zip.addFile('README.txt', Buffer.from('这个压缩包由文件工具包创建。\n'))

      for (const inputPath of inputPaths) {
        try {
          const stats = await fs.stat(inputPath)
          const baseName = path.basename(inputPath)

          if (stats.isFile()) {
            console.log(`添加文件: ${inputPath}`)
            zip.addLocalFile(inputPath)
            entryCount++
          } else if (stats.isDirectory()) {
            console.log(`添加目录: ${inputPath}`)
            try {
              // 递归处理目录
              const addFilesFromDir = async (
                dirPath: string,
                relativePath: string
              ): Promise<void> => {
                try {
                  const files = await fs.readdir(dirPath)
                  console.log(`读取目录: ${dirPath}, 文件数: ${files.length}`)

                  for (const file of files) {
                    try {
                      const filePath = path.join(dirPath, file)
                      const fileStats = await fs.stat(filePath)
                      const relativeFilePath = path.join(relativePath, file)

                      if (fileStats.isFile()) {
                        console.log(`添加子文件: ${filePath} -> ${relativeFilePath}`)
                        // 确保相对路径格式正确
                        const targetDir = path.dirname(relativeFilePath)
                        zip.addLocalFile(filePath, targetDir === '.' ? '' : targetDir)
                        entryCount++
                      } else if (fileStats.isDirectory()) {
                        console.log(`处理子目录: ${filePath}`)
                        await addFilesFromDir(filePath, relativeFilePath)
                      }
                    } catch (fileError) {
                      console.error(`处理文件 ${path.join(dirPath, file)} 失败:`, fileError)
                    }
                  }
                } catch (dirError) {
                  console.error(`读取目录 ${dirPath} 内容失败:`, dirError)
                }
              }

              await addFilesFromDir(inputPath, baseName)
            } catch (error) {
              console.error(`处理目录 ${inputPath} 失败:`, error)
            }
          }
        } catch (error) {
          console.error(`处理输入路径 ${inputPath} 失败:`, error)
        }
      }

      // 设置注释
      if (comment) {
        zip.addZipComment(comment)
      }

      try {
        console.log(`写入ZIP文件: ${outputPath}`)
        zip.writeZip(outputPath)
      } catch (error) {
        console.error(`写入ZIP文件失败:`, error)
        throw error
      }
      break
    }
    case ArchiveFormat.TAR: {
      const tarStream = new compressing.tar.Stream()
      for (const inputPath of inputPaths) {
        const stats = await fs.stat(inputPath)
        if (stats.isFile()) {
          tarStream.addEntry(inputPath)
          entryCount++
        } else if (stats.isDirectory()) {
          // 改进处理目录的方式
          try {
            // 递归添加目录中的文件
            const addFilesFromDir = async (
              dirPath: string,
              relativePath: string
            ): Promise<void> => {
              const files = await fs.readdir(dirPath)
              for (const file of files) {
                const filePath = path.join(dirPath, file)
                const fileStats = await fs.stat(filePath)
                const relativeFilePath = path.join(relativePath, file)

                if (fileStats.isFile()) {
                  tarStream.addEntry(filePath, { relativePath: relativeFilePath })
                  entryCount++
                } else if (fileStats.isDirectory()) {
                  await addFilesFromDir(filePath, relativeFilePath)
                }
              }
            }

            await addFilesFromDir(inputPath, path.basename(inputPath))
          } catch (error) {
            console.error(`处理目录 ${inputPath} 失败:`, error)
          }
        }
      }
      await new Promise<void>((resolve, reject) => {
        const writeStream = createWriteStream(outputPath)
        writeStream.on('finish', resolve)
        writeStream.on('error', reject)
        tarStream.pipe(writeStream)
      })
      break
    }
    case ArchiveFormat.GZIP: {
      // GZIP通常只能压缩单个文件
      if (inputPaths.length > 1) {
        throw new Error('GZIP格式只能压缩单个文件')
      }
      const inputPath = inputPaths[0]
      const stats = await fs.stat(inputPath)
      if (stats.isDirectory()) {
        throw new Error('GZIP格式不能直接压缩目录')
      }
      await compressing.gzip.compressFile(inputPath, outputPath)
      entryCount = 1
      break
    }
    case ArchiveFormat.TGZ: {
      // 先创建TAR，再用GZIP压缩
      const tempTarPath = `${outputPath}.tar`
      const tarStream = new compressing.tar.Stream()
      for (const inputPath of inputPaths) {
        const stats = await fs.stat(inputPath)
        if (stats.isFile()) {
          tarStream.addEntry(inputPath)
          entryCount++
        } else if (stats.isDirectory()) {
          // 改进处理目录的方式
          try {
            // 递归添加目录中的文件
            const addFilesFromDir = async (
              dirPath: string,
              relativePath: string
            ): Promise<void> => {
              const files = await fs.readdir(dirPath)
              for (const file of files) {
                const filePath = path.join(dirPath, file)
                const fileStats = await fs.stat(filePath)
                const relativeFilePath = path.join(relativePath, file)

                if (fileStats.isFile()) {
                  tarStream.addEntry(filePath, { relativePath: relativeFilePath })
                  entryCount++
                } else if (fileStats.isDirectory()) {
                  await addFilesFromDir(filePath, relativeFilePath)
                }
              }
            }

            await addFilesFromDir(inputPath, path.basename(inputPath))
          } catch (error) {
            console.error(`处理目录 ${inputPath} 失败:`, error)
          }
        }
      }
      await new Promise<void>((resolve, reject) => {
        const writeStream = createWriteStream(tempTarPath)
        writeStream.on('finish', resolve)
        writeStream.on('error', reject)
        tarStream.pipe(writeStream)
      })
      await compressing.gzip.compressFile(tempTarPath, outputPath)
      await fs.unlink(tempTarPath) // 删除临时文件
      break
    }
    default:
      throw new Error(`不支持的压缩格式: ${format}`)
  }

  // 获取压缩后的文件大小
  const compressedSize = await getFileSize(outputPath)

  return {
    outputPath,
    originalSize,
    compressedSize,
    entryCount
  }
}

/**
 * 解压文件
 * @param inputPath 输入压缩包路径
 * @param outputPath 输出目录路径
 * @param password 解压密码（如果需要）
 * @param createSubfolder 是否创建子文件夹（默认否）
 * @returns 解压结果
 */
export async function extractArchive(
  inputPath: string,
  outputPath: string,
  password?: string,
  createSubfolder = false
): Promise<{
  outputPath: string
  entryCount: number
}> {
  // 确保输入文件存在
  try {
    await fs.access(inputPath)
  } catch (error) {
    throw new Error(`输入文件不存在: ${inputPath}`)
  }

  // 确保输出目录存在
  await fs.mkdir(outputPath, { recursive: true })

  // 根据文件扩展名选择解压方法
  const ext = path.extname(inputPath).toLowerCase()
  let entryCount = 0

  if (ext === '.zip') {
    const zip = new AdmZip(inputPath)
    // adm-zip 的类型定义可能不完全，但库本身支持密码
    // @ts-ignore ignore
    zip.getEntries().forEach((entry) => {
      // @ts-ignore ignore
      if (entry.isEncrypted && password) {
        // @ts-ignore ignore
        entry.password = password
      }
    })

    if (createSubfolder) {
      // 创建子文件夹（默认行为）
      zip.extractAllTo(outputPath, true)
    } else {
      // 直接解压到指定目录，不创建子文件夹
      const entries = zip.getEntries()

      for (const entry of entries) {
        if (entry.isDirectory) {
          // 对于目录，创建对应的目录结构
          await fs.mkdir(path.join(outputPath, entry.entryName), { recursive: true })
        } else {
          // 获取文件父目录
          const entryDir = path.dirname(entry.entryName)

          // 如果父目录不是根，确保创建完整的目录结构
          if (entryDir && entryDir !== '.') {
            await fs.mkdir(path.join(outputPath, entryDir), { recursive: true })
          }

          // 提取文件到目标位置
          const targetPath = path.join(outputPath, entry.entryName)
          const content = entry.getData()
          await fs.writeFile(targetPath, content)
        }
      }
    }

    entryCount = zip.getEntries().length
  } else if (ext === '.tar') {
    await compressing.tar.uncompress(inputPath, outputPath)
    entryCount = 10 // 粗略估计
  } else if (ext === '.gz' || ext === '.gzip') {
    // GZIP通常是单个文件
    const fileName = path.basename(inputPath).replace(ext, '')
    const outputFilePath = path.join(outputPath, fileName)
    await compressing.gzip.uncompress(inputPath, outputFilePath)
    entryCount = 1
  } else if (ext === '.tgz') {
    await compressing.tgz.uncompress(inputPath, outputPath)
    entryCount = 10 // 粗略估计
  } else {
    throw new Error(`不支持的压缩格式: ${ext}`)
  }

  return {
    outputPath,
    entryCount
  }
}

/**
 * 获取压缩包内的文件列表
 * @param archivePath 压缩包路径
 * @param password 解压密码（如果需要）
 * @returns 文件列表
 */
export async function listArchiveContents(
  archivePath: string,
  password?: string
): Promise<{ name: string; size: number; isDirectory: boolean; date?: Date }[]> {
  // 确保输入文件存在
  try {
    await fs.access(archivePath)
  } catch (error) {
    throw new Error(`输入文件不存在: ${archivePath}`)
  }

  // 根据文件扩展名选择方法
  const ext = path.extname(archivePath).toLowerCase()
  const entries: { name: string; size: number; isDirectory: boolean; date?: Date }[] = []

  if (ext === '.zip') {
    const zip = new AdmZip(archivePath)
    // @ts-ignore ignore
    zip.getEntries().forEach((entry) => {
      // @ts-ignore ignore
      if (entry.isEncrypted && password) {
        // @ts-ignore ignore
        entry.password = password
      }

      entries.push({
        name: entry.entryName,
        size: entry.header.size,
        isDirectory: entry.isDirectory,
        date: entry.header.time ? new Date(entry.header.time) : undefined
      })
    })
  } else {
    // 其他格式暂不支持列出内容
    throw new Error(`暂不支持列出 ${ext} 格式的内容`)
  }

  return entries
}
