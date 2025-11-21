/*
 * @Author: Libra
 * @Date: 2025-05-15 17:33:37
 * @LastEditors: Libra
 * @Description:
 */
import { DownloadStatus } from '@shared/types'

export interface DownloadTask {
  id: string
  url: string
  fileName: string
  status: DownloadStatus
  progress: number
  speed: number
  estimatedTimeRemaining: number
  error?: string
  retries: number
  totalSegments: number
  downloadedSegments: number
  totalBytes: number
  downloadedBytes: number
  lastDownloadedBytes?: number
  startTime?: number
  lastUpdateTime?: number
  outputPath?: string
  totalDuration?: number
}

export interface DownloadOptions {
  maxRetries: number
  retryDelay: number
  maxConcurrent: number
  segmentTimeout: number
  continueOnError: boolean
}
