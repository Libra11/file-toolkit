/*
 * @Author: Libra
 * @Date: 2024-10-07 00:34:22
 * @LastEditors: Libra
 * @Description:
 */

interface BaseOptions {
  scale: '-1:-1' | '320:-1' | '480:-1' | '640:-1' | '800:-1' | '1024:-1'
}

interface FpsOption {
  fps?: 10 | 15 | 20 | 25 | 30
}

interface QualityOption {
  quality?: number // 2-31
}

export type Mp4ToGifOptions = BaseOptions & FpsOption
export type PngToJpgOptions = BaseOptions & QualityOption
export type JpgToPngOptions = BaseOptions
export type WebpToJpgOptions = BaseOptions & QualityOption

export type ConversionOptions = BaseOptions & Partial<FpsOption & QualityOption>

/**
 * 下载状态枚举
 */
export enum DownloadStatus {
  WAITING = 'waiting',
  DOWNLOADING = 'downloading',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}
