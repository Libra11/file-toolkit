/*
 * @Author: Libra
 * @Date: 2025-04-24 10:30:42
 * @LastEditors: Libra
 * @Description:
 */
import { processImages } from '@main/imageOrganize'
import { NameRule } from '@main/imageOrganize/path'
import { BrowserWindow, ipcMain, dialog } from 'electron'

// 定义事件名称
export const IMAGE_ORGANIZE_EVENTS = {
  START_PROCESS: 'image-organize:start-process',
  SELECT_ROOT_DIR: 'image-organize:select-root-dir',
  SELECT_SOURCE_DIR: 'image-organize:select-source-dir',
  SELECT_EXCEL_FILE: 'image-organize:select-excel-file',
  PROGRESS_UPDATE: 'image-organize:progress-update',
  PROCESS_COMPLETE: 'image-organize:process-complete',
  PROCESS_ERROR: 'image-organize:process-error'
}
let isProcessing = false

/**
 * 注册 IPC 事件处理程序
 */
export function registerImageOrganizeHandlers(): void {
  // 选择根目录
  ipcMain.handle(IMAGE_ORGANIZE_EVENTS.SELECT_ROOT_DIR, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: '选择结果保存目录'
    })
    return canceled ? null : filePaths[0]
  })

  // 选择源文件目录
  ipcMain.handle(IMAGE_ORGANIZE_EVENTS.SELECT_SOURCE_DIR, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '选择图片源目录'
    })
    return canceled ? null : filePaths[0]
  })

  // 选择 Excel 文件
  ipcMain.handle(IMAGE_ORGANIZE_EVENTS.SELECT_EXCEL_FILE, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      title: '选择学生信息 Excel 文件',
      filters: [
        { name: 'Excel 文件', extensions: ['xlsx', 'xls'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    })
    return canceled ? null : filePaths[0]
  })

  // 开始处理流程
  ipcMain.handle(
    IMAGE_ORGANIZE_EVENTS.START_PROCESS,
    async (
      event,
      {
        rootDir,
        sourceDir,
        excelPath,
        nameRule
      }: {
        rootDir: string
        sourceDir: string
        excelPath: string
        nameRule: NameRule
      }
    ) => {
      if (isProcessing) {
        return { success: false, message: '正在处理中，请等待处理完成' }
      }

      try {
        isProcessing = true
        const sender = BrowserWindow.fromWebContents(event.sender)

        if (!sender) {
          throw new Error('无法获取窗口实例')
        }

        // 创建进度更新回调
        const updateProgress = (status: string, percentage?: number): void => {
          sender.webContents.send(IMAGE_ORGANIZE_EVENTS.PROGRESS_UPDATE, { status, percentage })
        }

        // 执行处理流程
        await processImages({
          rootDir,
          sourceDir,
          excelPath,
          nameRule,
          updateProgress
        })

        sender.webContents.send(IMAGE_ORGANIZE_EVENTS.PROCESS_COMPLETE)
        isProcessing = false
        return { success: true }
      } catch (error) {
        isProcessing = false
        const errorMessage = error instanceof Error ? error.message : String(error)
        BrowserWindow.fromWebContents(event.sender)?.webContents.send(
          IMAGE_ORGANIZE_EVENTS.PROCESS_ERROR,
          errorMessage
        )
        return { success: false, message: errorMessage }
      }
    }
  )
}
