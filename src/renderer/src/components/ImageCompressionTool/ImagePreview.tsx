import { Image as ImageIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DataRow } from '@renderer/components/ui/panel'
import { EmptyState } from '@renderer/components/ui/states'
import { ImageInfo } from './types'
import { formatBytes } from './utils'

interface ImagePreviewProps {
  imageUrl: string | null
  fileName: string
  fileSize: number
  imageInfo: ImageInfo
}

export function ImagePreview({
  imageUrl,
  fileName,
  fileSize,
  imageInfo
}: ImagePreviewProps): JSX.Element {
  const { t } = useTranslation()
  const format = fileName.split('.').pop()?.toUpperCase() || '—'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 shrink-0 text-primary" />
        <h3 className="truncate text-xs font-medium text-foreground" title={fileName}>
          {fileName}
        </h3>
      </div>

      {imageUrl ? (
        <div className="flex aspect-[4/3] min-h-52 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/35 p-3">
          <img src={imageUrl} alt={fileName} className="max-h-full max-w-full object-contain" />
        </div>
      ) : (
        <EmptyState
          icon={ImageIcon}
          title={t('loadImage')}
          description={fileName}
          className="aspect-[4/3] min-h-52"
        />
      )}

      <dl className="divide-y divide-border border-y border-border">
        <DataRow label={t('fileSize')} value={formatBytes(fileSize)} />
        <DataRow label={t('format')} value={format} />
        <DataRow
          label={t('dimensions')}
          value={
            imageInfo.width && imageInfo.height
              ? `${imageInfo.width} × ${imageInfo.height} px`
              : '—'
          }
        />
      </dl>
    </div>
  )
}
