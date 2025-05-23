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
 * @Description: 主进程IPC处理程序注册
 */
import { registerFileSystemHandlers } from './fileSystemHandlers'
import { registerImageCompressionHandlers } from './compression/image'
import { registerVideoCompressionHandlers } from './compression/video'
import { registerAudioCompressionHandlers } from './compression/audio'
import { registerConversionHandlers } from './conversion'
import { registerArchiveHandlers } from './compression/archive'
import { registerCreateExamHandlers } from './createExamHandlers'
import { registerImageOrganizeHandlers } from './imageOrganizeHandlers'
import { registerM3u8DownloadHandlers } from './m3u8DownloadHandlers'
/**
 * 注册所有IPC处理程序
 */
export function registerAllHandlers(): void {
  // 初始化基本的文件系统处理程序
  registerFileSystemHandlers()

  // 注册转换处理程序
  registerConversionHandlers()

  // 注册图像压缩处理程序
  registerImageCompressionHandlers()

  // 注册视频压缩处理程序
  registerVideoCompressionHandlers()

  // 注册音频压缩处理程序
  registerAudioCompressionHandlers()

  // 注册归档压缩/解压处理程序
  registerArchiveHandlers()

  // 注册考试创建处理程序
  registerCreateExamHandlers()

  // 注册图片整理工具处理程序
  registerImageOrganizeHandlers()

  // 注册m3u8下载处理程序
  registerM3u8DownloadHandlers()
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

// 考试创建处理程序
export * from './createExamHandlers'

// 图片整理工具处理程序
export * from './imageOrganizeHandlers'

// m3u8下载处理程序
export * from './m3u8DownloadHandlers'
