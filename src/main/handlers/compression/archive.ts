/*
 * @Author: Libra
 * @Date: 2024-10-23
 * @LastEditors: Libra
 * @Description: 文件归档压缩/解压IPC处理程序
 */
import { ipcMain, dialog } from 'electron'
import path from 'path'
import {
  compressFiles,
  extractArchive,
  listArchiveContents,
  ArchiveFormat,
  ArchiveCompressionOptions
} from '../../compressors/archiveCompressors'

/**
 * 注册归档压缩与解压相关的IPC处理程序
 */
export function registerArchiveHandlers(): void {
  // 压缩文件/文件夹
  ipcMain.handle(
    'compress-files',
    async (
      _,
      inputPaths: string[],
      outputPath: string,
      options: Partial<ArchiveCompressionOptions>
    ) => {
      try {
        console.log(`IPC调用: compress-files [${inputPaths.join(', ')}] -> ${outputPath}`)
        const result = await compressFiles(inputPaths, outputPath, options)
        console.log(`压缩结果: ${JSON.stringify(result)}`)
        return result
      } catch (error) {
        console.error('压缩文件错误:', error)
        throw error
      }
    }
  )

  // 解压文件
  ipcMain.handle(
    'extract-archive',
    async (_, inputPath: string, outputPath: string, password?: string) => {
      try {
        console.log(`IPC调用: extract-archive ${inputPath} -> ${outputPath}`)
        const result = await extractArchive(inputPath, outputPath, password, false)
        console.log(`解压结果: ${JSON.stringify(result)}`)
        return result
      } catch (error) {
        console.error('解压文件错误:', error)
        throw error
      }
    }
  )

  // 列出压缩包内容
  ipcMain.handle('list-archive-contents', async (_, archivePath: string, password?: string) => {
    try {
      console.log(`IPC调用: list-archive-contents ${archivePath}`)
      const result = await listArchiveContents(archivePath, password)
      console.log(`列出压缩包内容结果: ${result.length} 个文件`)
      return result
    } catch (error) {
      console.error('列出压缩包内容错误:', error)
      throw error
    }
  })

  // 选择保存压缩文件的位置
  ipcMain.handle(
    'select-archive-save-path',
    async (_, defaultPath?: string, defaultName?: string) => {
      try {
        console.log('IPC调用: select-archive-save-path')
        const result = await dialog.showSaveDialog({
          title: '保存压缩文件',
          defaultPath: defaultPath ? path.join(defaultPath, defaultName || '压缩文件.zip') : '',
          filters: [
            { name: 'ZIP文件', extensions: ['zip'] },
            { name: 'TAR文件', extensions: ['tar'] },
            { name: 'GZIP文件', extensions: ['gz'] },
            { name: 'TGZ文件', extensions: ['tgz'] },
            { name: '所有文件', extensions: ['*'] }
          ]
        })
        console.log(`选择压缩文件保存路径结果: ${result.canceled ? '已取消' : result.filePath}`)
        return result.filePath
      } catch (error) {
        console.error('选择压缩文件保存路径错误:', error)
        throw error
      }
    }
  )

  // 获取支持的压缩格式
  ipcMain.handle('get-supported-archive-formats', () => {
    return Object.values(ArchiveFormat)
  })
}
