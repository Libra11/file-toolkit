/**
 * Author: Libra
 * Date: 2024-04-01
 * LastEditors: Libra
 * Description: 压缩后的视频预览组件
 */
import { useRef, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle, Download, ExternalLink, Clock, FileVideo } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { CompressionResult } from './types'
import { formatFileSize, formatTime, calculateCompressionPercentage } from './utils'

interface CompressedVideoPreviewProps {
  compressionResult: CompressionResult
  previewUrl: string | null
  onReset: () => void
  className?: string
}

export function CompressedVideoPreview({
  compressionResult,
  previewUrl,
  onReset,
  className = ''
}: CompressedVideoPreviewProps): JSX.Element {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // 处理播放状态改变
  const togglePlayPause = (): void => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // 监听视频加载和时间更新
  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const handleTimeUpdate = (): void => {
      setCurrentTime(videoElement.currentTime)
    }

    const handleLoadedMetadata = (): void => {
      setDuration(videoElement.duration)
    }

    const handlePause = (): void => {
      setIsPlaying(false)
    }

    const handlePlay = (): void => {
      setIsPlaying(true)
    }

    videoElement.addEventListener('timeupdate', handleTimeUpdate)
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata)
    videoElement.addEventListener('pause', handlePause)
    videoElement.addEventListener('play', handlePlay)

    return (): void => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate)
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
      videoElement.removeEventListener('pause', handlePause)
      videoElement.removeEventListener('play', handlePlay)
    }
  }, [])

  // 打开文件所在目录
  const openFileLocation = (): void => {
    if (compressionResult.outputPath) {
      window.electron.ipcRenderer.invoke('open-file-location', compressionResult.outputPath)
    }
  }

  // 计算压缩率和节省的空间
  const compressionPercentage = calculateCompressionPercentage(
    compressionResult.originalSize,
    compressionResult.compressedSize
  )
  const savedSpace = formatFileSize(
    compressionResult.originalSize - compressionResult.compressedSize
  )

  return (
    <div className={`bg-slate-100 dark:bg-slate-800/50 rounded-lg overflow-hidden ${className}`}>
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">{t('compressionResult')}</h3>
          <div className="flex items-center bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
            <CheckCircle className="h-3 w-3 mr-1 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              {t('compressed')}
            </span>
          </div>
        </div>

        <div className="rounded-md overflow-hidden bg-black mb-3 aspect-video relative">
          {previewUrl ? (
            <video
              ref={videoRef}
              src={previewUrl}
              className="w-full h-full object-contain"
              onClick={togglePlayPause}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <FileVideo className="w-12 h-12 text-slate-600 dark:text-slate-400" />
            </div>
          )}

          {previewUrl && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-white text-xs flex justify-between items-center">
              <span>
                {formatTime(currentTime)} /{' '}
                {formatTime(duration || compressionResult.duration || 0)}
              </span>
              <button
                className="p-1 rounded-full hover:bg-white/20 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  togglePlayPause()
                }}
              >
                {isPlaying ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex flex-col text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span>{t('outputFormat')}</span>
              <span className="font-medium uppercase">{compressionResult.format}</span>
            </div>

            <div className="flex items-center justify-between">
              <span>{t('originalSize')}</span>
              <span className="font-medium">{formatFileSize(compressionResult.originalSize)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span>{t('compressedSize')}</span>
              <span className="font-medium">
                {formatFileSize(compressionResult.compressedSize)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>{t('saved')}</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {savedSpace} ({compressionPercentage}%)
              </span>
            </div>

            {compressionResult.duration && (
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {t('duration')}
                </span>
                <span className="font-medium">{formatTime(compressionResult.duration)}</span>
              </div>
            )}

            {compressionResult.width && compressionResult.height && (
              <div className="flex items-center justify-between">
                <span>{t('resolution')}</span>
                <span className="font-medium">
                  {compressionResult.width} × {compressionResult.height}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 w-full"
              onClick={openFileLocation}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {t('openFileLocation')}
            </Button>

            <Button className="bg-red-500 hover:bg-red-600 w-full" onClick={onReset}>
              <Download className="h-4 w-4 mr-2" />
              {t('compressAnother')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
