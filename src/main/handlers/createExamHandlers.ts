/*
 * @Author: Libra
 * @Date: 2025-04-22 17:37:07
 * @LastEditors: Libra
 * @Description:
 */
import { ipcMain } from 'electron'
import store from '@main/createExam/config'
import { createExam } from '@main/createExam/exam'
import { ExamConfig } from '@main/createExam/types'

export function registerCreateExamHandlers(): void {
  // 获取默认配置
  ipcMain.handle('get-default-config', async () => {
    try {
      return store.all
    } catch (error) {
      console.error('获取默认配置失败:', error)
      throw error
    }
  })
  // 设置默认配置
  ipcMain.handle('set-default-config', async (_, config: ExamConfig) => {
    try {
      store.setAll(config)
    } catch (error) {
      console.error('设置默认配置失败:', error)
      throw error
    }
  })
  // 创建考试
  ipcMain.handle('create-exam', async () => {
    try {
      return createExam()
    } catch (error) {
      console.error('创建考试失败:', error)
      throw error
    }
  })
}
