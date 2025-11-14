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
    <div
      className={`space-y-3 rounded-2xl border border-emerald-200/70 bg-white/95 p-4 shadow-sm shadow-emerald-900/10 dark:border-emerald-500/30 dark:bg-emerald-900/30 ${className || ''}`}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
          <Music className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">
          {t('compressedAudio')}
        </h3>
      </div>

      <div className="grid gap-2 rounded-xl bg-emerald-50/70 p-3 text-xs text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100">
        <div className="flex items-center justify-between">
          <span className="font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
            {t('originalSize')}
          </span>
          <span>{(originalSize / 1024 / 1024).toFixed(2)} MB</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
            {t('compressedSize')}
          </span>
          <span>{(compressedSize / 1024 / 1024).toFixed(2)} MB</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
            {t('compressionRatio')}
          </span>
          <span>{compressionRatio.toFixed(2)}x</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
            {t('saved')}
          </span>
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">
            {Math.round(((originalSize - compressedSize) / originalSize) * 100)}%
          </span>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={previewUrl}
        controls
        className="w-full rounded-lg border border-emerald-100/60 bg-white/90 p-2 text-slate-700 shadow-inner dark:border-emerald-500/30 dark:bg-emerald-900/40 dark:text-emerald-100"
        controlsList="nodownload"
      />
    </div>
  )
}
