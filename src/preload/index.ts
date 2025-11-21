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
import { exam } from './api/exam'
import { m3u8Download } from './api/m3u8Download'
import { batchRename } from './api/batchRename'
import { gifExportAPI } from './api/gifExport'
import { hash } from './api/hash'

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('ffmpeg', ffmpeg)
    contextBridge.exposeInMainWorld('system', system)
    contextBridge.exposeInMainWorld('compression', compression)
    contextBridge.exposeInMainWorld('archiveCompression', archiveCompression)
    contextBridge.exposeInMainWorld('exam', exam)
    contextBridge.exposeInMainWorld('m3u8Download', m3u8Download)
    contextBridge.exposeInMainWorld('batchRename', batchRename)
    contextBridge.exposeInMainWorld('gifExport', gifExportAPI)
    contextBridge.exposeInMainWorld('hash', hash)
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
  // @ts-ignore (define in dts)
  window.exam = exam
  // @ts-ignore (define in dts)
  window.m3u8Download = m3u8Download
  // @ts-ignore (define in dts)
  window.batchRename = batchRename
  // @ts-ignore (define in dts)
  window.gifExport = gifExportAPI
  // @ts-ignore (define in dts)
  window.hash = hash
}
