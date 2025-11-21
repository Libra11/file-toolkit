/**
 * Author: Libra
 * Date: 2025-03-31 17:45:33
 * LastEditors: Libra
 * Description:
 */
import { useTranslation } from 'react-i18next'
import { X, Image as ImageIcon } from 'lucide-react'
import { formatBytes } from './utils'

interface FileListProps {
  files: File[]
  onRemoveFile: (index: number) => void
}

export function FileList({ files, onRemoveFile }: FileListProps): JSX.Element {
  const { t } = useTranslation()

  if (files.length === 0) {
    return <></>
  }

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium mb-2">
        {t('selectedFiles')}: {files.length}
      </h3>
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {files.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/50 rounded-lg p-2 border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center overflow-hidden">
              <ImageIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
              <div className="truncate">
                <p className="text-sm truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatBytes(file.size)}
                </p>
              </div>
            </div>
            <button
              className="ml-2 p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
              onClick={() => onRemoveFile(index)}
              title={t('remove')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
