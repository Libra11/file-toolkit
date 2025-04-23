/*
 * @Author: Libra
 * @Date: 2025-04-22 17:38:12
 * @LastEditors: Libra
 * @Description:
 */
import { ExamConfig } from '../../main/createExam/types'

// 日志消息接口
export interface LogMessage {
  type: 'info' | 'success' | 'warn' | 'error'
  message: string
  timestamp: string
}

export interface Exam {
  /**
   * 获取默认配置
   * @returns 默认配置
   */
  getDefaultConfig: () => Promise<ExamConfig>
  /**
   * 创建考试
   * @param config 考试配置
   * @returns 考试ID
   */
  createExam: () => Promise<string>
  /**
   * 设置默认配置
   * @param config 考试配置
   */
  setDefaultConfig: (config: ExamConfig) => Promise<void>
  /**
   * 监听日志消息
   * @param callback 处理日志的回调函数
   * @returns 取消监听的函数
   */
  onLog: (callback: (log: LogMessage) => void) => () => void
}
