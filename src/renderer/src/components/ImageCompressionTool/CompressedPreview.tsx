import { useTranslation } from 'react-i18next'
import { FolderOpen, Image as ImageIcon, ImagePlus } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { DataRow } from '@renderer/components/ui/panel'
import { EmptyState, Notice } from '@renderer/components/ui/states'
import { CompressionResult } from './types'
import { formatBytes } from './utils'

interface CompressedPreviewProps {
  compressionResult: CompressionResult
  previewUrl: string | null
  onReset: () => void
}

export function CompressedPreview({
  compressionResult,
  previewUrl,
  onReset
}: CompressedPreviewProps): JSX.Element {
  const { t } = useTranslation()
  const { originalSize, compressedSize, compressionRatio } = compressionResult
  const savedPercent = originalSize
    ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
    : 0

  const openFileLocation = (): void => {
    if (window.system && typeof window.system.openFileLocation === 'function') {
      window.system.openFileLocation(compressionResult.outputPath)
    } else {
      alert(`${t('compressedImageSaved')}: ${compressionResult.outputPath}`)
    }
  }

  return (
    <div className="space-y-4">
      <Notice
        tone="success"
        title={t('compressionSuccess')}
        description={compressionResult.outputPath}
      />

      {previewUrl ? (
        <div className="flex aspect-[4/3] min-h-52 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/35 p-3">
          <img
            src={previewUrl}
            alt={t('compressedImageSaved')}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      ) : (
        <EmptyState
          icon={ImageIcon}
          title={t('compressedImageSaved')}
          description={compressionResult.outputPath}
          className="aspect-[4/3] min-h-52"
        />
      )}

      <dl className="divide-y divide-border border-y border-border">
        <DataRow label={t('originalSize')} value={formatBytes(originalSize)} />
        <DataRow label={t('compressedSize')} value={formatBytes(compressedSize || 0)} />
        <DataRow
          label={t('saved')}
          value={
            <span className="text-primary">{`${savedPercent}% · ${formatBytes(originalSize - compressedSize)}`}</span>
          }
        />
        <DataRow
          label={t('compressionRatio')}
          value={compressionRatio ? `${compressionRatio.toFixed(2)}×` : '—'}
        />
        <DataRow label={t('outputFormat')} value={compressionResult.format.toUpperCase()} />
        {compressionResult.newWidth && compressionResult.newHeight && (
          <DataRow
            label={t('dimensions')}
            value={`${compressionResult.newWidth} × ${compressionResult.newHeight} px`}
          />
        )}
      </dl>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" size="sm" className="flex-1" onClick={openFileLocation}>
          <FolderOpen className="mr-2 h-4 w-4" />
          {t('openFileLocation')}
        </Button>
        <Button type="button" size="sm" variant="outline" className="flex-1" onClick={onReset}>
          <ImagePlus className="mr-2 h-4 w-4" />
          {t('compressAnother')}
        </Button>
      </div>
    </div>
  )
}
