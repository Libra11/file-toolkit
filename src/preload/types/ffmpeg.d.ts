/*
 * @Author: Libra
 * @Date: 2024-12-20 09:59:03
 * @LastEditors: Libra
 * @Description:
 */
export interface Ffmpeg {
  /**
   * 将mp4转换为gif
   * @param inputPath 输入路径
   * @param outputPath 输出路径
   * @returns 输出路径
   */
  convertMp4ToGif: (inputPath: string, outputPath: string) => Promise<string>
  /**
   * 将avi转换为mp4
   * @param inputPath 输入路径
   * @param outputPath 输出路径
   * @returns 输出路径
   */
  convertAviToMp4: (inputPath: string, outputPath: string) => Promise<string>
  /**
   * 将mov转换为mp4
   * @param inputPath 输入路径
   * @param outputPath 输出路径
   * @returns 输出路径
   */
  convertMovToMp4: (inputPath: string, outputPath: string) => Promise<string>
  /**
   * 将webm转换为mp4
   * @param inputPath 输入路径
   * @param outputPath 输出路径
   * @returns 输出路径
   */
  convertWebmToMp4: (inputPath: string, outputPath: string) => Promise<string>
  /**
   * 将png转换为jpg
   * @param inputPath 输入路径
   * @param outputPath 输出路径
   * @returns 输出路径
   */
  convertPngToJpg: (inputPath: string, outputPath: string) => Promise<string>
  /**
   * 将jpg转换为png
   * @param inputPath 输入路径
   * @param outputPath 输出路径
   * @returns 输出路径
   */
  convertJpgToPng: (inputPath: string, outputPath: string) => Promise<string>
  /**
   * 将webp转换为jpg
   * @param inputPath 输入路径
   * @param outputPath 输出路径
   * @returns 输出路径
   */
  convertWebpToJpg: (inputPath: string, outputPath: string) => Promise<string>
  /**
   * 将jpg转换为webp
   * @param inputPath 输入路径
   * @param outputPath 输出路径
   * @returns 输出路径
   */
  convertJpgToWebp: (inputPath: string, outputPath: string) => Promise<string>
  /**
   * 将png转换为webp
   * @param inputPath 输入路径
   * @param outputPath 输出路径
   * @returns 输出路径
   */
  convertPngToWebp: (inputPath: string, outputPath: string) => Promise<string>
  /**
   * 将webp转换为png
   * @param inputPath 输入路径
   * @param outputPath 输出路径
   * @returns 输出路径
   */
  convertWebpToPng: (inputPath: string, outputPath: string) => Promise<string>
}
