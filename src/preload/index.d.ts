/*
 * @Author: Libra
 * @Date: 2024-12-19 17:11:38
 * @LastEditors: Libra
 * @Description:
 */
import { ElectronAPI } from '@electron-toolkit/preload'
import type { Ffmpeg } from './types/ffmpeg'
import type { System } from './types/system'
import type { Exam } from './types/exam'

export type IpcListener = (event: IpcRendererEvent, ...args: unknown[]) => void
declare global {
  interface Window {
    electron: ElectronAPI
    ffmpeg: Ffmpeg
    system: System
    exam: Exam
  }
}
