/*
 * @Author: Libra
 * @Date: 2024-10-07 00:28:07
 * @LastEditors: Libra
 * @Description:
 */
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  convertMp4ToGif: (inputPath: string, outputPath: string, optionsStr: string): Promise<unknown> =>
    ipcRenderer.invoke('convert-mp4-to-gif', inputPath, outputPath, optionsStr),
  convertPngToJpg: (inputPath: string, outputPath: string, optionsStr: string): Promise<unknown> =>
    ipcRenderer.invoke('convert-png-to-jpg', inputPath, outputPath, optionsStr),
  convertJpgToPng: (inputPath: string, outputPath: string, optionsStr: string): Promise<unknown> =>
    ipcRenderer.invoke('convert-jpg-to-png', inputPath, outputPath, optionsStr),
  selectDirectory: (): Promise<unknown> => ipcRenderer.invoke('select-directory'),
  checkFileExists: (filePath: string): Promise<unknown> =>
    ipcRenderer.invoke('check-file-exists', filePath),
  saveFile: (filePath: string): Promise<unknown> => ipcRenderer.invoke('save-file', filePath),
  minimizeWindow: (): Promise<unknown> => ipcRenderer.invoke('minimize-window'),
  closeWindow: (): Promise<unknown> => ipcRenderer.invoke('close-window')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
