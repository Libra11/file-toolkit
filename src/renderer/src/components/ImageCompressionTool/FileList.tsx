import { useTranslation } from 'react-i18next'
import { Image as ImageIcon, X } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { EmptyState } from '@renderer/components/ui/states'
import { formatBytes } from './utils'

interface FileListProps {
  files: File[]
  onRemoveFile: (index: number) => void
}

export function FileList({ files, onRemoveFile }: FileListProps): JSX.Element {
  const { t } = useTranslation()

  if (files.length === 0) {
    return (
      <EmptyState
        icon={ImageIcon}
        title={t('noFileChosen')}
        description={t('selectFilesToCompress')}
        className="min-h-32"
      />
    )
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-foreground">
          {t('selectedFiles')} · {files.length}
        </span>
        <span className="text-muted-foreground">{formatBytes(totalSize)}</span>
      </div>
      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {files.map((file, index) => (
          <div
            key={`${file.name}-${file.lastModified}-${index}`}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
              <ImageIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground" title={file.name}>
                {file.name}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{formatBytes(file.size)}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 shrink-0 px-0"
              onClick={() => onRemoveFile(index)}
              aria-label={`${t('remove')} ${file.name}`}
              title={t('remove')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
