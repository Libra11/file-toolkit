/*
 * @Author: Libra
 * @Date: 2024-10-23
 * @LastEditors: Libra
 * @Description: 归档压缩预加载API
 */
import { ipcRenderer } from 'electron'
import type { ArchiveCompression } from '../types/archiveCompression'

export const archiveCompression: ArchiveCompression = {
  /**
   * 获取支持的压缩格式
   * @returns 格式列表
   */
  getSupportedFormats: async () => {
    try {
      console.log('预加载脚本: 调用getSupportedFormats')
      const formats = await ipcRenderer.invoke('get-supported-archive-formats')
      console.log('预加载脚本: getSupportedFormats成功, 结果:', formats)
      return formats
    } catch (error) {
      console.error('预加载脚本: getSupportedFormats错误:', error)
      throw error
    }
  },

  /**
   * 压缩文件
   */
  compressFiles: async (filePaths, outputPath, options) => {
    try {
      console.log('预加载脚本: 调用compressFiles')
      console.log('输入文件:', filePaths)
      console.log('输出路径:', outputPath)
      console.log('压缩选项:', options)

      const result = await ipcRenderer.invoke('compress-files', filePaths, outputPath, options)
      console.log('预加载脚本: compressFiles成功, 结果:', result)
      return result
    } catch (error) {
      console.error('预加载脚本: compressFiles错误:', error)
      throw error
    }
  },

  /**
   * 解压文件
   */
  extractArchive: async (archivePath, outputPath, password) => {
    try {
      console.log('预加载脚本: 调用extractArchive')
      console.log('压缩包路径:', archivePath)
      console.log('输出路径:', outputPath)

      const result = await ipcRenderer.invoke('extract-archive', archivePath, outputPath, password)
      console.log('预加载脚本: extractArchive成功, 结果:', result)
      return result
    } catch (error) {
      console.error('预加载脚本: extractArchive错误:', error)
      throw error
    }
  },

  /**
   * 列出压缩包内容
   */
  listArchiveContents: async (archivePath, password) => {
    try {
      console.log('预加载脚本: 调用listArchiveContents')
      console.log('压缩包路径:', archivePath)

      const contents = await ipcRenderer.invoke('list-archive-contents', archivePath, password)
      console.log('预加载脚本: listArchiveContents成功, 结果:', contents)
      return contents
    } catch (error) {
      console.error('预加载脚本: listArchiveContents错误:', error)
      throw error
    }
  },

  /**
   * 打开文件位置
   */
  openFileLocation: async (path) => {
    try {
      console.log('预加载脚本: 调用openFileLocation')
      console.log('路径:', path)

      await ipcRenderer.invoke('open-file-location', path)
      console.log('预加载脚本: openFileLocation成功')
    } catch (error) {
      console.error('预加载脚本: openFileLocation错误:', error)
      throw error
    }
  }
}
