/**
 * Author: Libra
 * Date: 2024-03-31
 * LastEditors: Libra
 * Description: 压缩后的音频预览组件
 */
import { useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Music } from 'lucide-react'
import { CompressionResult } from './types'

interface CompressedAudioPreviewProps {
  compressionResult: CompressionResult
  previewUrl: string
  className?: string
}

export function CompressedAudioPreview({
  compressionResult,
  previewUrl,
  className
}: CompressedAudioPreviewProps): JSX.Element {
  const { t } = useTranslation()
  const audioRef = useRef<HTMLAudioElement>(null)

  const { originalSize, compressedSize, compressionRatio } = compressionResult

  useEffect(() => {
    // 组件挂载时重置音频状态
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
  }, [previewUrl])

  return (
    <div className={`border rounded-lg p-4 shadow-sm ${className || ''}`}>
      <div className="flex items-center mb-2">
        <Music className="w-5 h-5 text-green-500 mr-2" />
        <h3 className="font-medium text-slate-900 dark:text-slate-100">{t('compressedAudio')}</h3>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div className="text-slate-500">{t('originalSize')}:</div>
        <div className="text-slate-700 dark:text-slate-300">
          {(originalSize / 1024 / 1024).toFixed(2)} MB
        </div>
        <div className="text-slate-500">{t('compressedSize')}:</div>
        <div className="text-slate-700 dark:text-slate-300">
          {(compressedSize / 1024 / 1024).toFixed(2)} MB
        </div>
        <div className="text-slate-500">{t('compressionRatio')}:</div>
        <div className="text-slate-700 dark:text-slate-300">{compressionRatio.toFixed(2)}x</div>
        <div className="text-slate-500">{t('saved')}:</div>
        <div className="text-green-600 dark:text-green-400 font-medium">
          {Math.round(((originalSize - compressedSize) / originalSize) * 100)}%
        </div>
      </div>

      <audio
        ref={audioRef}
        src={previewUrl}
        controls
        className="w-full"
        controlsList="nodownload"
      />
    </div>
  )
}
