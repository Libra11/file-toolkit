/*
 * @Author: Libra
 * @Date: 2024-10-07 00:28:07
 * @LastEditors: Libra
 * @Description:
 */
import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { ffmpeg } from './api/ffmpeg'
import { system } from './api/system'
import { compression } from './api/compression'
import { archiveCompression } from './api/archiveCompression'

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('ffmpeg', ffmpeg)
    contextBridge.exposeInMainWorld('system', system)
    contextBridge.exposeInMainWorld('compression', compression)
    contextBridge.exposeInMainWorld('archiveCompression', archiveCompression)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.ffmpeg = ffmpeg
  // @ts-ignore (define in dts)
  window.system = system
  // @ts-ignore (define in dts)
  window.compression = compression
  // @ts-ignore (define in dts)
  window.archiveCompression = archiveCompression
}
