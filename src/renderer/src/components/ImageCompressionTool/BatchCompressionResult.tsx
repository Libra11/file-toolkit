import { useTranslation } from 'react-i18next'
import { FolderOpen, ImagePlus } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { DataRow } from '@renderer/components/ui/panel'
import { EmptyState, Notice } from '@renderer/components/ui/states'
import { CompressionResult } from './types'
import { formatBytes } from './utils'

interface BatchCompressionResultProps {
  results: CompressionResult[]
  onReset: () => void
}

export function BatchCompressionResult({
  results,
  onReset
}: BatchCompressionResultProps): JSX.Element {
  const { t } = useTranslation()

  if (results.length === 0) {
    return (
      <EmptyState
        title={t('compressionResult')}
        description={t('selectFilesToCompress')}
        className="min-h-56"
      />
    )
  }

  const totalOriginalSize = results.reduce((sum, result) => sum + result.originalSize, 0)
  const totalCompressedSize = results.reduce((sum, result) => sum + result.compressedSize, 0)
  const totalSaved = totalOriginalSize - totalCompressedSize
  const compressionPercentage = totalOriginalSize
    ? Math.round((totalSaved / totalOriginalSize) * 100)
    : 0
  const firstPath = results[0].outputPath
  const pathSeparator = Math.max(firstPath.lastIndexOf('/'), firstPath.lastIndexOf('\\'))
  const outputDir = pathSeparator >= 0 ? firstPath.substring(0, pathSeparator) : ''

  return (
    <div className="space-y-4">
      <Notice
        tone="success"
        title={t('batchCompressionSuccess')}
        description={t('successCount', { count: results.length, total: results.length })}
      />

      <dl className="grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-muted/25 py-3">
        <div className="px-3">
          <dt className="text-[11px] text-muted-foreground">{t('fileCount')}</dt>
          <dd className="mt-1 text-lg font-semibold text-foreground">{results.length}</dd>
        </div>
        <div className="px-3">
          <dt className="text-[11px] text-muted-foreground">{t('saved')}</dt>
          <dd className="mt-1 text-lg font-semibold text-primary">{compressionPercentage}%</dd>
        </div>
        <div className="px-3">
          <dt className="text-[11px] text-muted-foreground">{t('compressedSize')}</dt>
          <dd
            className="mt-1 truncate text-sm font-semibold text-foreground"
            title={formatBytes(totalCompressedSize)}
          >
            {formatBytes(totalCompressedSize)}
          </dd>
        </div>
      </dl>

      <dl className="divide-y divide-border border-y border-border">
        <DataRow label={t('originalSize')} value={formatBytes(totalOriginalSize)} />
        <DataRow label={t('compressedSize')} value={formatBytes(totalCompressedSize)} />
        <DataRow
          label={t('saved')}
          value={<span className="text-primary">{formatBytes(totalSaved)}</span>}
        />
        {outputDir && <DataRow label={t('outputFolder')} value={outputDir} />}
      </dl>

      <div className="max-h-56 divide-y divide-border overflow-y-auto border-y border-border">
        {results.map((result, index) => (
          <div
            key={`${result.outputPath}-${index}`}
            className="flex items-center gap-3 py-2.5 text-xs"
          >
            <span
              className="min-w-0 flex-1 truncate font-medium text-foreground"
              title={result.outputPath}
            >
              {result.outputPath.split(/[\\/]/).pop() || `${t('image')} ${index + 1}`}
            </span>
            <span className="shrink-0 text-muted-foreground">
              {formatBytes(result.originalSize)} → {formatBytes(result.compressedSize)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          size="sm"
          className="flex-1"
          disabled={!outputDir}
          onClick={() => {
            if (
              outputDir &&
              window.system &&
              typeof window.system.openFileLocation === 'function'
            ) {
              window.system.openFileLocation(outputDir)
            }
          }}
        >
          <FolderOpen className="mr-2 h-4 w-4" />
          {t('openOutputFolder')}
        </Button>
        <Button type="button" size="sm" variant="outline" className="flex-1" onClick={onReset}>
          <ImagePlus className="mr-2 h-4 w-4" />
          {t('compressOthers')}
        </Button>
      </div>
    </div>
  )
}
