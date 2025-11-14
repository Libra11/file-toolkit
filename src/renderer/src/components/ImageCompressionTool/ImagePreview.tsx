import { File } from 'lucide-react'
import { ImageInfo } from './types'
import { formatBytes } from './utils'
import { useTranslation } from 'react-i18next'

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

  return (
    <div className="space-y-3 rounded-2xl border border-sky-100/70 bg-white/95 p-4 shadow-sm shadow-sky-900/5 dark:border-sky-500/30 dark:bg-slate-900/70">
      <h3 className="flex items-center text-sm font-semibold text-slate-800 dark:text-white">
        <File className="mr-2 h-4 w-4 text-sky-500 dark:text-sky-300" />
        <span className="truncate" title={fileName}>
          {fileName}
        </span>
      </h3>
      <div className="relative flex h-48 w-full items-center justify-center overflow-hidden rounded-xl border border-sky-100/60 bg-sky-50/60 dark:border-sky-500/30 dark:bg-slate-900/60">
        {imageUrl ? (
          <img src={imageUrl} alt="original" className="h-full w-full object-contain" />
        ) : (
          <File className="h-10 w-10 text-sky-400" />
        )}
      </div>
      <div className="grid gap-1 text-xs text-slate-600 dark:text-slate-300">
        <p className="flex items-center justify-between">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {t('originalSize')}:
          </span>
          <span>{formatBytes(fileSize)}</span>
        </p>
        {imageInfo.width && imageInfo.height && (
          <p className="flex items-center justify-between">
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {t('dimensions')}:
            </span>
            <span>
              {imageInfo.width} x {imageInfo.height} px
            </span>
          </p>
        )}
      </div>
    </div>
  )
}
