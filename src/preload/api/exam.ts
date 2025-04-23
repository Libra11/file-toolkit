/*
 * @Author: Libra
 * @Date: 2025-04-22 17:37:57
 * @LastEditors: Libra
 * @Description:
 */
import { ipcRenderer } from 'electron'
import type { Exam, LogMessage } from '../types/exam'
import { ExamConfig } from '@main/createExam/types'

export const exam: Exam = {
  // 获取默认配置
  getDefaultConfig: () => ipcRenderer.invoke('get-default-config'),
  // 创建考试
  createExam: () => ipcRenderer.invoke('create-exam'),
  // 设置默认配置
  setDefaultConfig: (config: ExamConfig) => ipcRenderer.invoke('set-default-config', config),
  // 监听日志消息
  onLog: (callback: (log: LogMessage) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, log: LogMessage): void => {
      callback(log)
    }

    ipcRenderer.on('exam:log', listener)

    // 返回取消监听的函数
    return () => {
      ipcRenderer.removeListener('exam:log', listener)
    }
  }
}
