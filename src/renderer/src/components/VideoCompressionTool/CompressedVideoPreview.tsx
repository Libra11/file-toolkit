/**
 * Author: Libra
 * Date: 2024-04-01
 * LastEditors: Libra
 * Description: 压缩后的视频预览组件
 */
import { useRef, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle, Download, ExternalLink, Clock, FileVideo, Play, Pause } from 'lucide-react'
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
    <div
      className={`space-y-3 rounded-2xl border border-violet-200/70 bg-white/95 p-4 shadow-sm shadow-violet-900/10 dark:border-violet-500/30 dark:bg-violet-900/30 ${className}`}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100/80 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300">
          <CheckCircle className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-violet-700 dark:text-violet-200">
          {t('compressedVideo')}
        </h3>
      </div>

      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-violet-100/60 bg-violet-50/60 dark:border-violet-500/30 dark:bg-slate-900/60">
        {previewUrl ? (
          <>
            <video
              ref={videoRef}
              src={previewUrl}
              className="h-full w-full object-contain"
              onClick={togglePlayPause}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
              <div className="flex items-center justify-between text-white text-xs">
                <span>
                  {formatTime(currentTime)} /{' '}
                  {formatTime(duration || compressionResult.duration || 0)}
                </span>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePlayPause()
                  }}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <FileVideo className="h-10 w-10 text-violet-400" />
        )}
      </div>

      <div className="grid gap-2 rounded-xl bg-violet-50/70 p-3 text-xs text-violet-700 dark:bg-violet-900/40 dark:text-violet-100">
        <div className="flex items-center justify-between">
          <span className="font-medium uppercase tracking-wide text-violet-600 dark:text-violet-300">
            {t('outputFormat')}
          </span>
          <span className="uppercase">{compressionResult.format}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium uppercase tracking-wide text-violet-600 dark:text-violet-300">
            {t('originalSize')}
          </span>
          <span>{formatFileSize(compressionResult.originalSize)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium uppercase tracking-wide text-violet-600 dark:text-violet-300">
            {t('compressedSize')}
          </span>
          <span>{formatFileSize(compressionResult.compressedSize)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium uppercase tracking-wide text-violet-600 dark:text-violet-300">
            {t('saved')}
          </span>
          <span className="text-sm font-semibold text-violet-600 dark:text-violet-300">
            {savedSpace} ({compressionPercentage}%)
          </span>
        </div>

        {compressionResult.duration && (
          <div className="flex items-center justify-between">
            <span className="font-medium uppercase tracking-wide text-violet-600 dark:text-violet-300 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {t('duration')}
            </span>
            <span>{formatTime(compressionResult.duration)}</span>
          </div>
        )}

        {compressionResult.width && compressionResult.height && (
          <div className="flex items-center justify-between">
            <span className="font-medium uppercase tracking-wide text-violet-600 dark:text-violet-300">
              {t('resolution')}
            </span>
            <span>
              {compressionResult.width} × {compressionResult.height} px
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          className="border-violet-200 text-violet-600 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-900/20 w-full"
          onClick={openFileLocation}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          {t('openFileLocation')}
        </Button>

        <Button className="bg-violet-500 hover:bg-violet-600 text-white w-full" onClick={onReset}>
          <Download className="h-4 w-4 mr-2" />
          {t('compressAnother')}
        </Button>
      </div>
    </div>
  )
}
