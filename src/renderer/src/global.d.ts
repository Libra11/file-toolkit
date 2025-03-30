import { ElectronAPI } from '@electron-toolkit/preload'
import { Ffmpeg } from '../../preload/types/ffmpeg'
import { System } from '../../preload/types/system'
import { Compression } from '../../preload/types/compression'

declare global {
  interface Window {
    electron: ElectronAPI
    ffmpeg: Ffmpeg
    system: System
    compression: Compression
  }
}
