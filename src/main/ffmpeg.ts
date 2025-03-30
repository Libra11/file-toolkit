/*
 * @Author: Libra
 * @Date: 2024-10-07 00:33:48
 * @LastEditors: Libra
 * @Description: 初始化FFmpeg相关功能
 */
import { registerFileConversionHandlers } from './handlers/fileHandlers'
import { registerFileCompressionHandlers } from './handlers/compressHandlers'

// 注册文件转换处理程序
registerFileConversionHandlers()

// 注册文件压缩处理程序
registerFileCompressionHandlers()

console.log('FFmpeg功能已初始化')
