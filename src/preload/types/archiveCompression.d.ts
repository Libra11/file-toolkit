/*
 * @Author: Libra
 * @Date: 2024-10-23
 * @LastEditors: Libra
 * @Description: 归档压缩工具类型定义
 */

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

// 压缩结果
export interface CompressionResult {
  outputPath: string
  originalSize: number
  compressedSize: number
  entryCount: number
}

// 解压结果
export interface ExtractionResult {
  outputPath: string
  entryCount: number
}

// 压缩包内容项
export interface ArchiveEntry {
  name: string
  size: number
  isDirectory: boolean
  date?: Date
}

// 归档压缩接口
export interface ArchiveCompression {
  /**
   * 获取支持的压缩格式
   * @returns 格式列表
   */
  getSupportedFormats: () => Promise<string[]>

  /**
   * 压缩文件
   * @param filePaths 文件路径列表
   * @param outputPath 输出路径
   * @param options 压缩选项
   * @returns 压缩结果
   */
  compressFiles: (
    filePaths: string[],
    outputPath: string,
    options: ArchiveCompressionOptions
  ) => Promise<CompressionResult>

  /**
   * 解压文件
   * @param archivePath 压缩包路径
   * @param outputPath 输出路径
   * @param password 密码（可选）
   * @returns 解压结果
   */
  extractArchive: (
    archivePath: string,
    outputPath: string,
    password?: string
  ) => Promise<ExtractionResult>

  /**
   * 列出压缩包内容
   * @param archivePath 压缩包路径
   * @param password 密码（可选）
   * @returns 内容列表
   */
  listArchiveContents: (archivePath: string, password?: string) => Promise<ArchiveEntry[]>

  /**
   * 打开文件位置
   * @param path 文件或目录路径
   */
  openFileLocation: (path: string) => Promise<void>
}
