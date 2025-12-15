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
import type {
  RenameRule,
  RenameTask,
  RenamePreviewResult
} from '../main/handlers/batchRenameHandlers'
import type { gifExportAPI } from './api/gifExport'
import type { GifExportOptions, CardInfo } from '../shared/types'
import type { FileHash } from './types/hash'

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

// GIF 导出API接口
export interface GifExport {
  selectOutputDir: () => Promise<string | null>
  exportAll: (htmlString: string, options: GifExportOptions) => Promise<string[]>
  exportSingle: (
    htmlString: string,
    cardIndex: number,
    options: GifExportOptions
  ) => Promise<string>
  getCardInfo: (htmlString: string, options?: GifExportOptions) => Promise<CardInfo[]>
  onProgress: (callback: (progress: any) => void) => void
  removeProgressListener: () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    ffmpeg: Ffmpeg
    system: System
    exam: Exam
    imageOrganize: ImageOrganize
    batchRename: BatchRename
    gifExport: GifExport
    hash: FileHash
    decryption: {
      decryptCandidateAnswer: (
        filePath: string
      ) => Promise<{ success: boolean; content?: string; error?: string }>
    }
    excelMatch: {
      selectFolder: () => Promise<string | null>
      scanFolder: (path: string) => Promise<string[]>
      readExcel: () => Promise<{ path: string; headers: string[]; data: any[] } | null>
      execute: (args: {
        tasks: { originalPath: string; newFilename: string }[]
        targetDir?: string
        overwrite?: boolean
      }) => Promise<{ success: number; fail: number; errors: string[] }>
    }
  }
}
