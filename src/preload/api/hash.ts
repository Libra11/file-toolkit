/*
 * @Author: Libra
 * @Date: 2025-09-15
 * @LastEditors: Libra
 * @Description: 文件哈希预加载 API
 */
import { ipcRenderer } from 'electron'
export const hash: Window['hash'] = {
  getSupportedAlgorithms: async () =>
    await ipcRenderer.invoke('hash:get-supported-algorithms'),
  calculate: async (filePath: string, algorithms?: string[]) =>
    await ipcRenderer.invoke('hash:calculate', filePath, algorithms),
  calculateMultiple: async (filePaths: string[], algorithms?: string[]) =>
    await ipcRenderer.invoke('hash:calculate-multiple', filePaths, algorithms)
}
