/**
 * Author: Libra
 * Date: 2024-04-01
 * LastEditors: Libra
 * Description: 视频预览组件
 */
import { useRef, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock, FileVideo } from 'lucide-react'
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
    <div className={`bg-slate-100 dark:bg-slate-800/50 rounded-lg overflow-hidden ${className}`}>
      <div className="p-3">
        <h3 className="text-sm font-medium mb-2">{t('originalVideo')}</h3>
        <div className="rounded-md overflow-hidden bg-black mb-3 aspect-video relative">
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              onClick={togglePlayPause}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <FileVideo className="w-12 h-12 text-slate-600 dark:text-slate-400" />
            </div>
          )}

          {videoUrl && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-white text-xs flex justify-between items-center">
              <span>
                {formatTime(currentTime)} / {formatTime(duration || videoInfo.duration || 0)}
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

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium truncate">{fileName}</p>
          </div>
          <div className="flex flex-col text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span>{t('fileSize')}</span>
              <span className="font-medium">{formatFileSize(fileSize)}</span>
            </div>

            {videoInfo.duration && (
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {t('duration')}
                </span>
                <span className="font-medium">{formatTime(videoInfo.duration)}</span>
              </div>
            )}

            {videoInfo.width && videoInfo.height && (
              <div className="flex items-center justify-between">
                <span>{t('resolution')}</span>
                <span className="font-medium">
                  {videoInfo.width} × {videoInfo.height}
                </span>
              </div>
            )}

            {videoInfo.codec && (
              <div className="flex items-center justify-between">
                <span>{t('codec')}</span>
                <span className="font-medium">{videoInfo.codec}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
