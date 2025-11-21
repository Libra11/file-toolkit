/*
 * @Author: Libra
 * @Date: 2024-11-10 16:30:00
 * @LastEditors: Libra
 * @Description: 图片整理工具的 API
 */
import { ipcRenderer } from 'electron'

// 图片整理工具的事件名
const validChannels = [
  'image-organize:progress-update',
  'image-organize:process-complete',
  'image-organize:process-error'
]

// 图片整理工具的可调用方法
const validInvokables = [
  'image-organize:select-root-dir',
  'image-organize:select-source-dir',
  'image-organize:select-excel-file',
  'image-organize:start-process'
]

export const imageOrganize = {
  // 监听事件
  on: (channel: string, callback: (...args: any[]) => void): void => {
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event, ...args) => callback(...args))
    }
  },

  // 移除事件监听
  removeAllListeners: (channel: string): void => {
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel)
    }
  },

  // 调用方法
  invoke: (channel: string, ...args: any[]): Promise<any> => {
    if (validInvokables.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args)
    }
    return Promise.reject(new Error(`不允许调用 "${channel}"`))
  }
}
