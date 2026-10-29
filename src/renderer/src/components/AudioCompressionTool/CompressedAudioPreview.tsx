import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Music } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { DataRow } from '@renderer/components/ui/panel'
import { Notice } from '@renderer/components/ui/states'
import { cn } from '@renderer/lib/utils'
import { CompressionResult } from './types'

interface CompressedAudioPreviewProps {
  compressionResult: CompressionResult
  previewUrl: string
  className?: string
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(2)} ${units[index]}`
}

export function CompressedAudioPreview({
  compressionResult,
  previewUrl,
  className
}: CompressedAudioPreviewProps): JSX.Element {
  const { t } = useTranslation()
  const audioRef = useRef<HTMLAudioElement>(null)
  const { originalSize, compressedSize, compressionRatio, outputPath } = compressionResult
  const savedPercent = originalSize
    ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
    : 0

  useEffect(() => {
    if (audioRef.current) audioRef.current.currentTime = 0
  }, [previewUrl])

  return (
    <div className={cn('space-y-4', className)}>
      <Notice tone="success" title={t('compressedAudio')} description={outputPath} />

      <div className="rounded-lg border border-border bg-muted/30 p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-primary">
            <Music className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">{t('compressedAudio')}</p>
            <p className="mt-1 text-[11px] uppercase text-muted-foreground">
              {compressionResult.format}
            </p>
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

      <dl className="divide-y divide-border border-y border-border">
        <DataRow label={t('originalSize')} value={formatSize(originalSize)} />
        <DataRow label={t('compressedSize')} value={formatSize(compressedSize)} />
        <DataRow label={t('compressionRatio')} value={`${compressionRatio.toFixed(2)}×`} />
        <DataRow
          label={t('saved')}
          value={
            <span className="text-primary">
              {savedPercent}% · {formatSize(originalSize - compressedSize)}
            </span>
          }
        />
      </dl>

      <Button
        type="button"
        size="sm"
        className="w-full"
        onClick={() => {
          if (window.system && typeof window.system.openFileLocation === 'function') {
            window.system.openFileLocation(outputPath)
          } else {
            window.electron.ipcRenderer.invoke('open-file-location', outputPath)
          }
        }}
      >
        <FolderOpen className="mr-2 h-4 w-4" />
        {t('openFileLocation')}
      </Button>
    </div>
  )
}
