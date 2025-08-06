/*
 * @Author: Libra
 * @Date: 2025-07-21 11:19:27
 * @LastEditors: Libra
 * @Description: GIF 导出 API
 */
import { ipcRenderer } from 'electron'
import type { GifExportOptions, CardInfo } from '../../shared/types'

export const gifExportAPI = {
  /**
   * 选择输出目录
   */
  selectOutputDir: (): Promise<string | null> => {
    return ipcRenderer.invoke('gif-export:select-output-dir')
  },

  /**
   * 导出所有卡片为 GIF
   */
  exportAll: (htmlString: string, options: GifExportOptions): Promise<string[]> => {
    return ipcRenderer.invoke('gif-export:export-all', htmlString, options)
  },

  /**
   * 导出单张卡片为 GIF
   */
  exportSingle: (
    htmlString: string,
    cardIndex: number,
    options: GifExportOptions
  ): Promise<string> => {
    return ipcRenderer.invoke('gif-export:export-single', htmlString, cardIndex, options)
  },

  /**
   * 获取卡片信息
   */
  getCardInfo: (htmlString: string): Promise<CardInfo[]> => {
    return ipcRenderer.invoke('gif-export:get-card-info', htmlString)
  },

  /**
   * 监听进度事件
   */
  onProgress: (callback: (progress: any) => void): void => {
    ipcRenderer.on('gif-export:progress', (_, progress) => callback(progress))
  },

  /**
   * 移除进度事件监听
   */
  removeProgressListener: (): void => {
    ipcRenderer.removeAllListeners('gif-export:progress')
  }
}
