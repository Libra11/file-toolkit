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
    <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center">
        <File className="h-4 w-4 mr-1" />
        {fileName}
      </h3>
      <div className="relative w-full h-48 bg-slate-200 dark:bg-slate-900/50 rounded overflow-hidden">
        {imageUrl && <img src={imageUrl} alt="原始图片" className="w-full h-full object-contain" />}
      </div>
      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        <p className="flex items-center">
          <span className="font-medium mr-1">{t('originalSize')}:</span>
          {formatBytes(fileSize)}
        </p>
        {imageInfo.width && imageInfo.height && (
          <p className="flex items-center">
            <span className="font-medium mr-1">{t('dimensions')}:</span>
            {imageInfo.width} x {imageInfo.height} px
          </p>
        )}
      </div>
    </div>
  )
}
