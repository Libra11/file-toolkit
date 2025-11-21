/**
 * Author: Libra
 * Date: 2024-04-01
 * LastEditors: Libra
 * Description: 视频预览组件
 */
import { useRef, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock, FileVideo, Play, Pause } from 'lucide-react'
import { VideoInfo } from './types'
import { formatFileSize, formatTime } from './utils'

interface VideoPreviewProps {
  videoUrl: string | null
  fileName: string
  fileSize: number
  videoInfo: VideoInfo
  className?: string
}

export function VideoPreview({
  videoUrl,
  fileName,
  fileSize,
  videoInfo,
  className = ''
}: VideoPreviewProps): JSX.Element {
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

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate)
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
      videoElement.removeEventListener('pause', handlePause)
      videoElement.removeEventListener('play', handlePlay)
    }
  }, [])

  return (
    <div
      className={`space-y-3 rounded-2xl border border-purple-100/70 bg-white/95 p-4 shadow-sm shadow-purple-900/5 dark:border-purple-500/30 dark:bg-slate-900/70 ${className}`}
    >
      <h3 className="flex items-center text-sm font-semibold text-slate-800 dark:text-white">
        <FileVideo className="mr-2 h-4 w-4 text-purple-500 dark:text-purple-300" />
        <span className="truncate" title={fileName}>
          {fileName}
        </span>
      </h3>

      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-purple-100/60 bg-purple-50/60 dark:border-purple-500/30 dark:bg-slate-900/60">
        {videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              className="h-full w-full object-contain"
              onClick={togglePlayPause}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
              <div className="flex items-center justify-between text-white text-xs">
                <span>
                  {formatTime(currentTime)} / {formatTime(duration || videoInfo.duration || 0)}
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
          <FileVideo className="h-10 w-10 text-purple-400" />
        )}
      </div>

      <div className="grid gap-1 text-xs text-slate-600 dark:text-slate-300">
        <p className="flex items-center justify-between">
          <span className="font-medium text-slate-700 dark:text-slate-200">{t('fileSize')}:</span>
          <span>{formatFileSize(fileSize)}</span>
        </p>

        {videoInfo.duration && (
          <p className="flex items-center justify-between">
            <span className="font-medium text-slate-700 dark:text-slate-200 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {t('duration')}:
            </span>
            <span>{formatTime(videoInfo.duration)}</span>
          </p>
        )}

        {videoInfo.width && videoInfo.height && (
          <p className="flex items-center justify-between">
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {t('resolution')}:
            </span>
            <span>
              {videoInfo.width} × {videoInfo.height} px
            </span>
          </p>
        )}

        {videoInfo.codec && (
          <p className="flex items-center justify-between">
            <span className="font-medium text-slate-700 dark:text-slate-200">{t('codec')}:</span>
            <span className="uppercase">{videoInfo.codec}</span>
          </p>
        )}
      </div>
    </div>
  )
}
