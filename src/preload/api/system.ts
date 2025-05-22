/*
 * @Author: Libra
 * @Date: 2024-12-20 10:12:53
 * @LastEditors: Libra
 * @Description:
 */
import { ipcRenderer } from 'electron'
import type { System } from '../types/system'
import type { IpcListener } from '../index.d'

const ipcRendererMap = new Map<string, IpcListener>()
export const system: System = {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  checkFileExists: (filePath) => ipcRenderer.invoke('check-file-exists', filePath),
  saveFile: (filePath) => ipcRenderer.invoke('save-file', filePath),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  openFileLocation: (filePath) => ipcRenderer.invoke('open-file-location', filePath),
  ipcRendererOn: (channel, listener) => {
    ipcRendererMap.set(channel, listener)
    return ipcRenderer.on(channel, listener)
  },
  ipcRendererOff: (channel) => {
    const listener = ipcRendererMap.get(channel)
    if (listener) {
      ipcRenderer.off(channel, listener)
      ipcRendererMap.delete(channel)
    }
    return ipcRenderer
  },
  getAppVersion: () => ipcRenderer.invoke('get-app-version')
}
