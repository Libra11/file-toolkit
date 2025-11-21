/*
 * @Author: Libra
 * @Date: 2024-10-23
 * @LastEditors: Libra
 * @Description: 文件转换处理程序索引
 */
import { registerImageConversionHandlers } from './image'
import { registerVideoConversionHandlers } from './video'
import { registerAudioConversionHandlers } from './audio'

/**
 * 注册所有文件转换相关的IPC处理程序
 */
export function registerConversionHandlers(): void {
  // 注册媒体转换处理程序
  registerImageConversionHandlers()
  registerVideoConversionHandlers()
  registerAudioConversionHandlers()

  console.log('已注册所有文件转换IPC处理程序')
}
