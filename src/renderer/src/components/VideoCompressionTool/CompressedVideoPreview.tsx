import { useTranslation } from 'react-i18next'
import { ExternalLink, FileVideo, RotateCcw } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { DataRow } from '@renderer/components/ui/panel'
import { EmptyState, Notice } from '@renderer/components/ui/states'
import { cn } from '@renderer/lib/utils'
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
  className
}: CompressedVideoPreviewProps): JSX.Element {
  const { t } = useTranslation()
  const compressionPercentage = calculateCompressionPercentage(
    compressionResult.originalSize,
    compressionResult.compressedSize
  )
  const savedSpace = formatFileSize(
    compressionResult.originalSize - compressionResult.compressedSize
  )

  const openFileLocation = (): void => {
    if (compressionResult.outputPath) {
      window.electron.ipcRenderer.invoke('open-file-location', compressionResult.outputPath)
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Notice
        tone="success"
        title={t('compressedVideo')}
        description={compressionResult.outputPath}
      />

      {previewUrl ? (
        <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/35">
          <video src={previewUrl} controls className="h-full w-full object-contain">
            <track kind="captions" />
          </video>
        </div>
      ) : (
        <EmptyState
          icon={FileVideo}
          title={t('compressedVideo')}
          description={compressionResult.outputPath}
          className="aspect-video min-h-52"
        />
      )}

      <dl className="divide-y divide-border border-y border-border">
        <DataRow label={t('outputFormat')} value={compressionResult.format.toUpperCase()} />
        <DataRow label={t('originalSize')} value={formatFileSize(compressionResult.originalSize)} />
        <DataRow
          label={t('compressedSize')}
          value={formatFileSize(compressionResult.compressedSize)}
        />
        <DataRow
          label={t('saved')}
          value={
            <span className="text-primary">
              {savedSpace} · {compressionPercentage}%
            </span>
          }
        />
        <DataRow
          label={t('duration')}
          value={compressionResult.duration ? formatTime(compressionResult.duration) : '—'}
        />
        <DataRow
          label={t('resolution')}
          value={
            compressionResult.width && compressionResult.height
              ? `${compressionResult.width} × ${compressionResult.height} px`
              : '—'
          }
        />
      </dl>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" size="sm" className="flex-1" onClick={openFileLocation}>
          <ExternalLink className="mr-2 h-4 w-4" />
          {t('openFileLocation')}
        </Button>
        <Button type="button" size="sm" variant="outline" className="flex-1" onClick={onReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          {t('compressAnother')}
        </Button>
      </div>
    </div>
  )
}
