import { ElectronAPI } from '@electron-toolkit/preload'
import { Ffmpeg } from './types/ffmpeg'
import { System } from './types/system'
import { Compression } from './types/compression'
import { ArchiveCompression } from './types/archiveCompression'

declare global {
  interface Window {
    electron: ElectronAPI
    ffmpeg: Ffmpeg
    system: System
    compression: Compression
    archiveCompression: ArchiveCompression
  }
}
