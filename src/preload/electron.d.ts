/*
 * @Author: Libra
 * @Date: 2025-04-16 13:58:16
 * @LastEditors: Libra
 * @Description:
 */
import { ElectronAPI } from '@electron-toolkit/preload'
import { Ffmpeg } from './types/ffmpeg'
import { System } from './types/system'
import { Compression } from './types/compression'
import { ArchiveCompression } from './types/archiveCompression'
import { M3u8Download } from './types/m3u8Download'

declare global {
  interface Window {
    electron: ElectronAPI
    ffmpeg: Ffmpeg
    system: System
    compression: Compression
    archiveCompression: ArchiveCompression
    m3u8Download: M3u8Download
  }
}
