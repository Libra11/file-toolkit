/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 文件压缩类型定义
 */
export interface Compression {
  /**
   * 压缩图片
   * @param inputPath 输入路径
   * @param outputPath 输出路径
   * @returns 输出路径
   */
  compressImage: (inputPath: string, outputPath: string) => Promise<string>

  /**
   * 压缩视频
   * @param inputPath 输入路径
   * @param outputPath 输出路径
   * @returns 输出路径
   */
  compressVideo: (inputPath: string, outputPath: string) => Promise<string>

  /**
   * 压缩音频
   * @param inputPath 输入路径
   * @param outputPath 输出路径
   * @returns 输出路径
   */
  compressAudio: (inputPath: string, outputPath: string) => Promise<string>
}
