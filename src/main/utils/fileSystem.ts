/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 文件系统相关工具函数
 */
import fs from 'fs'

/**
 * 检查文件是否存在，如果存在则删除
 * @param filePath 文件路径
 */
export function checkFileExists(filePath: string): void {
  if (fs.existsSync(filePath)) {
    console.log('文件已存在，正在删除...')
    fs.unlinkSync(filePath)
    console.log('已删除现有文件')
  }
}

/**
 * 检查文件是否存在
 * @param filePath 文件路径
 * @returns 是否存在
 */
export async function isFileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK)
    return true
  } catch {
    return false
  }
}
