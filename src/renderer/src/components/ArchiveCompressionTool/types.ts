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

// 文件对象
export interface ArchiveFiles {
  name: string
  path: string
  size: number
  type: string
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
