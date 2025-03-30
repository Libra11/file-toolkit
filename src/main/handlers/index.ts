/*
 * @Author: Libra
 * @Date: 2025-03-30 14:48:05
 * @LastEditors: Libra
 * @Description:
 */
/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 处理程序导出
 */

// 导入媒体转换处理程序
import { registerImageConversionHandlers } from './conversion/image'
import { registerVideoConversionHandlers } from './conversion/video'
import { registerAudioConversionHandlers } from './conversion/audio'

// 导入媒体压缩处理程序
import { registerImageCompressionHandlers } from './compression/image'
import { registerVideoCompressionHandlers } from './compression/video'
import { registerAudioCompressionHandlers } from './compression/audio'

// 导入文件系统处理程序
import { registerFileSystemHandlers } from './fileSystemHandlers'

/**
 * 注册所有IPC处理程序
 */
export function registerAllHandlers(): void {
  // 注册媒体转换处理程序
  registerImageConversionHandlers()
  registerVideoConversionHandlers()
  registerAudioConversionHandlers()

  // 注册媒体压缩处理程序
  registerImageCompressionHandlers()
  registerVideoCompressionHandlers()
  registerAudioCompressionHandlers()

  // 注册文件系统处理程序
  registerFileSystemHandlers()

  console.log('已注册所有IPC处理程序')
}

// 导出所有处理程序
// 媒体转换处理程序
export * from './conversion/image'
export * from './conversion/video'
export * from './conversion/audio'

// 媒体压缩处理程序
export * from './compression/image'
export * from './compression/video'
export * from './compression/audio'

// 文件系统处理程序
export * from './fileSystemHandlers'
