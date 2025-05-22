/*
 * @Author: Libra
 * @Date: 2024-12-20 10:00:06
 * @LastEditors: Libra
 * @Description:
 */
import { IpcListener } from '../index'
export interface System {
  /**
   * 选择目录
   * @returns 目录路径
   */
  selectDirectory: () => Promise<string | undefined>
  /**
   * 检查文件是否存在
   * @param filePath 文件路径
   * @returns 是否存在
   */
  checkFileExists: (filePath: string) => Promise<boolean>
  /**
   * 保存文件
   * @param filePath 文件路径
   * @returns 文件路径
   */
  saveFile: (filePath: string) => Promise<string>
  /**
   * 最小化窗口
   * @returns 无
   */
  minimizeWindow: () => Promise<void>
  /**
   * 关闭窗口
   * @returns 无
   */
  closeWindow: () => Promise<void>
  /**
   * 打开文件位置
   * @param filePath 文件路径
   * @returns 是否成功
   */
  openFileLocation: (filePath: string) => Promise<boolean>
  /**
   * 监听ipc消息
   * @param channel 通道
   * @param listener 监听器
   * @returns 无
   */
  ipcRendererOn: (channel: string, listener: IpcListener) => void
  /**
   * 取消监听ipc消息
   * @param channel 通道
   * @returns 无
   */
  ipcRendererOff: (channel: string) => void
  /**
   * 获取应用版本号
   * @returns 版本号
   */
  getAppVersion: () => Promise<string>
}
