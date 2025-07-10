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
import type { IpcRendererEvent } from 'electron'
import type { batchRename } from './api/batchRename'
import type { RenameRule, RenameTask, RenamePreviewResult } from '../main/handlers/batchRenameHandlers'

export type IpcListener = (event: IpcRendererEvent, ...args: unknown[]) => void

// 图片整理工具API类型
export interface ImageOrganize {
  on(channel: string, callback: (...args: any[]) => void): void
  removeAllListeners(channel: string): void
  invoke(channel: string, ...args: any[]): Promise<any>
}

// 批量重命名API接口
export interface BatchRename {
  preview: (filePaths: string[], rules: RenameRule[]) => Promise<RenamePreviewResult>
  execute: (tasks: RenameTask[]) => Promise<RenameTask[]>
}

declare global {
  interface Window {
    electron: ElectronAPI
    ffmpeg: Ffmpeg
    system: System
    exam: Exam
    imageOrganize: ImageOrganize
    batchRename: BatchRename
  }
}
