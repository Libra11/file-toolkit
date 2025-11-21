/*
 * @Author: Libra
 * @Date: 2025-09-15
 * @LastEditors: Libra
 * @Description: 文件哈希类型定义
 */

export interface HashResult {
  filePath: string
  fileName: string
  size: number
  modifiedAt: number
  hashes: Record<string, string>
}

export interface FileHash {
  /**
   * 获取支持的哈希算法列表
   */
  getSupportedAlgorithms: () => Promise<string[]>

  /**
   * 计算单个文件的哈希
   * @param filePath 文件路径
   * @param algorithms 可选的算法数组
   */
  calculate: (filePath: string, algorithms?: string[]) => Promise<HashResult>

  /**
   * 批量计算文件哈希
   * @param filePaths 文件路径数组
   * @param algorithms 可选的算法数组
   */
  calculateMultiple: (filePaths: string[], algorithms?: string[]) => Promise<HashResult[]>
}
