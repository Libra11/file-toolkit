/**
 * Author: Libra
 * Date: 2024-03-31
 * LastEditors: Libra
 * Description: 音频预览组件
 */
import { useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Music } from 'lucide-react'
import { AudioInfo } from './types'

interface AudioPreviewProps {
  audioUrl: string
  fileName?: string
  fileSize?: number
  audioInfo?: AudioInfo
  className?: string
}

export function AudioPreview({
  audioUrl,
  fileName,
  fileSize,
  audioInfo,
  className
}: AudioPreviewProps): JSX.Element {
  const { t } = useTranslation()
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    // 组件挂载时重置音频状态
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
  }, [audioUrl])

  return (
    <div className={`border rounded-lg p-4 shadow-sm ${className || ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Music className="w-5 h-5 text-blue-500 mr-2" />
          <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
            {fileName || t('audioPreview')}
          </h3>
        </div>
        {fileSize && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {(fileSize / 1024 / 1024).toFixed(2)} MB
          </span>
        )}
      </div>

      {/* 音频信息显示 */}
      {audioInfo && Object.keys(audioInfo).length > 0 && (
        <div className="grid grid-cols-2 gap-2 text-sm mb-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
          {audioInfo.duration && (
            <>
              <div className="text-slate-500">{t('duration')}:</div>
              <div className="text-slate-700 dark:text-slate-300">{audioInfo.duration}</div>
            </>
          )}
          {audioInfo.sampleRate && (
            <>
              <div className="text-slate-500">{t('sampleRate')}:</div>
              <div className="text-slate-700 dark:text-slate-300">{audioInfo.sampleRate} Hz</div>
            </>
          )}
          {audioInfo.channels && (
            <>
              <div className="text-slate-500">{t('channels')}:</div>
              <div className="text-slate-700 dark:text-slate-300">
                {audioInfo.channels === 1 ? t('mono') : t('stereo')}
              </div>
            </>
          )}
          {audioInfo.bitrate && (
            <>
              <div className="text-slate-500">{t('bitrate')}:</div>
              <div className="text-slate-700 dark:text-slate-300">{audioInfo.bitrate} kbps</div>
            </>
          )}
          {audioInfo.format && (
            <>
              <div className="text-slate-500">{t('format')}:</div>
              <div className="text-slate-700 dark:text-slate-300">{audioInfo.format}</div>
            </>
          )}
        </div>
      )}

      <audio ref={audioRef} src={audioUrl} controls className="w-full" controlsList="nodownload" />
    </div>
  )
}
