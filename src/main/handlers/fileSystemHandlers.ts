/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 文件系统相关IPC处理程序
 */
import { ipcMain, shell } from 'electron'
import { selectDirectory, saveFileDialog } from '../utils/dialogs'
import { isFileExists } from '../utils/fileSystem'
/**
 * 注册文件系统相关的IPC处理程序
 */
export function registerFileSystemHandlers(): void {
  // 文件对话框处理程序
  ipcMain.handle('select-directory', async () => {
    try {
      const result = await selectDirectory()
      console.log(`选择目录: ${result}`)
      return result
    } catch (error) {
      console.error('选择目录错误:', error)
      throw error
    }
  })

  ipcMain.handle('save-file', async (_, filePath: string) => {
    try {
      console.log(`IPC调用: save-file ${filePath}`)
      const result = await saveFileDialog(filePath)
      console.log(`保存文件对话框结果: ${result}`)
      return result
    } catch (error) {
      console.error('保存文件对话框错误:', error)
      throw error
    }
  })

  // 文件系统操作处理程序
  ipcMain.handle('check-file-exists', async (_, filePath: string) => {
    try {
      console.log(`IPC调用: check-file-exists ${filePath}`)
      const result = await isFileExists(filePath)
      console.log(`文件存在检查结果: ${result}`)
      return result
    } catch (error) {
      console.error('文件存在检查错误:', error)
      throw error
    }
  })

  // 打开文件位置
  ipcMain.handle('open-file-location', async (_, filePath: string) => {
    try {
      console.log(`IPC调用: open-file-location ${filePath}`)
      const cleanPath = filePath.replace(/^"|"$/g, '') // 去除可能的引号
      const success = await shell.showItemInFolder(cleanPath)
      console.log(`打开文件位置结果: ${success}`)
      return success
    } catch (error) {
      console.error('打开文件位置错误:', error)
      throw error
    }
  })
}
