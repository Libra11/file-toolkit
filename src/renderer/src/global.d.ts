import { ElectronAPI } from '@electron-toolkit/preload'
import { Ffmpeg } from '../../preload/types/ffmpeg'
import { System } from '../../preload/types/system'
import { Compression } from '../../preload/types/compression'
import { M3u8Download } from '../../preload/types/m3u8Download'

declare global {
  interface Window {
    electron: ElectronAPI
    ffmpeg: Ffmpeg
    system: System
    compression: Compression
    m3u8Download: M3u8Download
  }
}
