import { useTranslation } from 'react-i18next'
import { CheckCircle2, Download, ImageIcon, ImagePlus } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
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

  return (
    <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
      <h3 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2 flex items-center">
        <CheckCircle2 className="h-4 w-4 mr-1" />
        {t('compressionSuccess')}
      </h3>
      <div className="relative w-full h-48 bg-slate-200 dark:bg-slate-900/50 rounded overflow-hidden flex items-center justify-center">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="压缩后图片"
            className="w-full h-full object-contain"
            onError={(e) => {
              console.error('图片加载失败:', previewUrl)
              ;(e.target as HTMLImageElement).src =
                'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWltYWdlIj48cmVjdCB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHg9IjMiIHk9IjMiIHJ4PSIyIiByeT0iMiIvPjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ii8+PHBvbHlsaW5lIHBvaW50cz0iMjEgMTUgMTYgMTAgNSAyMSIvPjwvc3ZnPg=='
              ;(e.target as HTMLImageElement).className = 'w-12 h-12 text-slate-400'
            }}
          />
        ) : (
          <div className="text-center p-4">
            <ImageIcon className="h-12 w-12 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('compressedImageSaved')}
            </p>
            <p className="text-xs text-slate-400 mt-1">{compressionResult.outputPath}</p>
          </div>
        )}
      </div>
      <div className="mt-2 space-y-1 text-xs">
        <p className="flex items-center text-slate-500 dark:text-slate-400">
          <span className="font-medium mr-1">{t('compressedSize')}:</span>
          {formatBytes(compressionResult.compressedSize || 0)}
        </p>
        <p className="flex items-center text-green-600 dark:text-green-400">
          <span className="font-medium mr-1">{t('compressionRatio')}:</span>
          {compressionResult.compressionRatio ? (
            <>
              {compressionResult.compressionRatio > 1
                ? compressionResult.compressionRatio.toFixed(2)
                : (1 / compressionResult.compressionRatio).toFixed(2)}
              x ({' '}
              {Math.round(
                (1 - compressionResult.compressedSize / compressionResult.originalSize) * 100
              )}
              % {t('saved')} )
            </>
          ) : (
            'N/A'
          )}
        </p>
        {compressionResult.newWidth && compressionResult.newHeight && (
          <p className="flex items-center text-slate-500 dark:text-slate-400">
            <span className="font-medium mr-1">{t('dimensions')}:</span>
            {compressionResult.newWidth} x {compressionResult.newHeight} px
          </p>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          onClick={() => {
            if (window.system && typeof window.system.openFileLocation === 'function') {
              window.system.openFileLocation(compressionResult.outputPath)
            } else {
              alert(`文件已保存至: ${compressionResult.outputPath}`)
            }
          }}
          className="w-full"
        >
          <Download className="h-4 w-4 mr-1" />
          {t('openFileLocation')}
        </Button>
        <Button size="sm" variant="outline" onClick={onReset}>
          <ImagePlus className="h-4 w-4 mr-1" />
          {t('compressAnother')}
        </Button>
      </div>
    </div>
  )
}
