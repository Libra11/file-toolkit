/*
 * @Author: Libra
 * @Date: 2025-01-09
 * @LastEditors: Libra
 * @Description: 批量重命名API
 */
import { ipcRenderer } from 'electron'
import type {
  RenameRule,
  RenameTask,
  RenamePreviewResult
} from '../../main/handlers/batchRenameHandlers'

export const batchRename = {
  /**
   * 生成重命名预览
   */
  preview: (filePaths: string[], rules: RenameRule[]): Promise<RenamePreviewResult> => {
    return ipcRenderer.invoke('batch-rename:preview', filePaths, rules)
  },

  /**
   * 执行批量重命名
   */
  execute: (tasks: RenameTask[]): Promise<RenameTask[]> => {
    return ipcRenderer.invoke('batch-rename:execute', tasks)
  }
}
