/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 对话框相关工具函数
 */
import { dialog } from 'electron'

/**
 * 选择目录
 * @returns 选择的目录路径
 */
export async function selectDirectory(): Promise<string | undefined> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  return result.filePaths[0]
}

/**
 * 保存文件对话框
 * @param filePath 默认文件路径
 * @returns 选择的文件保存路径
 */
export async function saveFileDialog(filePath: string): Promise<string | undefined> {
  const result = await dialog.showSaveDialog({
    defaultPath: filePath
  })
  return result.filePath
}
