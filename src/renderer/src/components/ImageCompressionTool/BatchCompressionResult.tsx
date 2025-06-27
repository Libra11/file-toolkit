/**
 * Author: Libra
 * Date: 2025-03-31 17:45:55
 * LastEditors: Libra
 * Description:
 */
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Folder, ImagePlus } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
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

  // 计算总压缩率
  const totalOriginalSize = results.reduce((sum, result) => sum + result.originalSize, 0)
  const totalCompressedSize = results.reduce((sum, result) => sum + result.compressedSize, 0)
  const totalSaved = totalOriginalSize - totalCompressedSize
  const compressionPercentage = Math.round((totalSaved / totalOriginalSize) * 100)

  // 获取输出目录路径
  const outputDir =
    results.length > 0
      ? results[0].outputPath.substring(0, results[0].outputPath.lastIndexOf('/'))
      : ''

  return (
    <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
      <h3 className="text-sm font-medium text-green-600 dark:text-green-400 mb-3 flex items-center">
        <CheckCircle2 className="h-4 w-4 mr-1" />
        {t('batchCompressionSuccess')}
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-4 text-center">
        <div className="bg-white dark:bg-slate-900/30 p-3 rounded-lg">
          <div className="text-sm text-slate-600 dark:text-slate-400">{t('successCount', { count: results.length, total: results.length })}</div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{results.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-900/30 p-3 rounded-lg">
          <div className="text-sm text-slate-600 dark:text-slate-400">{t('compressionRatio')}</div>
          <div className="text-xl font-bold text-green-600 dark:text-green-400">
            {compressionPercentage}%
          </div>
        </div>
      </div>

      <div className="mb-4 text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">{t('originalSize')}:</span>
          <span className="font-medium">{formatBytes(totalOriginalSize)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">{t('compressedSize')}:</span>
          <span className="font-medium">{formatBytes(totalCompressedSize)}</span>
        </div>
        <div className="flex justify-between text-green-600 dark:text-green-400">
          <span>{t('saved')}:</span>
          <span className="font-medium">{formatBytes(totalSaved)}</span>
        </div>
      </div>

      {outputDir && (
        <div
          className="mb-3 bg-slate-200 dark:bg-slate-700/50 p-2 rounded text-xs truncate"
          title={outputDir}
        >
          <span className="font-medium mr-1">{t('outputFolder')}:</span>
          {outputDir}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => {
            if (
              window.system &&
              typeof window.system.openFileLocation === 'function' &&
              outputDir
            ) {
              window.system.openFileLocation(outputDir)
            }
          }}
          className="w-full"
        >
          <Folder className="h-4 w-4 mr-1" />
          {t('openOutputFolder')}
        </Button>
        <Button size="sm" variant="outline" onClick={onReset}>
          <ImagePlus className="h-4 w-4 mr-1" />
          {t('compressOthers')}
        </Button>
      </div>
    </div>
  )
}
