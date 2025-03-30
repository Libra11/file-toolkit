/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 对话框相关工具函数
 */
import { dialog, FileFilter } from 'electron'
import path from 'path'

/**
 * 选择目录
 * @returns 选择的目录路径
 */
export async function selectDirectory(): Promise<string | undefined> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  return result.filePaths.length > 0 ? result.filePaths[0] : undefined
}

/**
 * 保存文件对话框
 * @param filePath 默认文件路径
 * @returns 选择的文件保存路径
 */
export async function saveFileDialog(filePath: string): Promise<string | undefined> {
  // 获取文件扩展名作为过滤器
  const extension = path.extname(filePath).replace('.', '').toLowerCase()
  const filters: FileFilter[] = []

  // 根据扩展名添加相应的过滤器
  switch (extension) {
    case 'gif':
      filters.push({ name: 'GIF 图像', extensions: ['gif'] })
      break
    case 'jpg':
    case 'jpeg':
      filters.push({ name: 'JPEG 图像', extensions: ['jpg', 'jpeg'] })
      break
    case 'png':
      filters.push({ name: 'PNG 图像', extensions: ['png'] })
      break
    case 'mp4':
      filters.push({ name: 'MP4 视频', extensions: ['mp4'] })
      break
    case 'mp3':
      filters.push({ name: 'MP3 音频', extensions: ['mp3'] })
      break
    case 'wav':
      filters.push({ name: 'WAV 音频', extensions: ['wav'] })
      break
    default:
      filters.push({ name: '所有文件', extensions: ['*'] })
  }

  // 始终添加"所有文件"选项
  if (extension) {
    filters.push({ name: '所有文件', extensions: ['*'] })
  }

  console.log('打开保存对话框:', { defaultPath: filePath, filters })
  const result = await dialog.showSaveDialog({
    defaultPath: filePath,
    filters,
    properties: ['createDirectory']
  })

  console.log('保存对话框结果:', result)
  // 检查用户是否取消
  if (result.canceled || !result.filePath) {
    console.log('用户取消了保存对话框')
    return undefined
  }

  return result.filePath
}
