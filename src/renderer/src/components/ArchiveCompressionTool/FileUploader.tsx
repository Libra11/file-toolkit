import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { File, Upload } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { ArchiveFiles } from './types'

interface FileUploaderProps {
  multiple?: boolean
  accept?: string
  onFilesSelected: (files: ArchiveFiles[]) => void
}

export default function FileUploader({
  multiple = true,
  accept,
  onFilesSelected
}: FileUploaderProps): JSX.Element {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = event.target.files
      if (!fileList) return

      const files: ArchiveFiles[] = []
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        files.push({
          name: file.name,
          path: file.path,
          size: file.size,
          type: file.type
        })
      }
      onFilesSelected(files)

      // 重置文件输入以允许选择相同的文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [onFilesSelected]
  )

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setIsDragging(false)

      const fileList = event.dataTransfer.files
      if (!fileList.length) return

      const files: ArchiveFiles[] = []
      const maxFiles = multiple ? fileList.length : 1

      for (let i = 0; i < maxFiles; i++) {
        const file = fileList[i]
        files.push({
          name: file.name,
          path: file.path,
          size: file.size,
          type: file.type
        })
      }
      onFilesSelected(files)
    },
    [multiple, onFilesSelected]
  )

  const handleSelectFile = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [])

  return (
    <div
      className={cn(
        'rounded-lg border border-dashed px-4 py-5 transition-colors',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-input bg-muted/20 hover:border-primary/40 hover:bg-muted/40'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
        multiple={multiple}
        accept={accept}
      />

      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-primary">
          <Upload className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-foreground">{t('dragAndDropFiles')}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {multiple ? t('orSelectMultipleFiles') : t('orSelectFile')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={handleSelectFile}
          className="shrink-0"
        >
          <File className="mr-1.5 h-3.5 w-3.5" />
          {multiple ? t('selectFiles') : t('selectFile')}
        </Button>
      </div>
    </div>
  )
}
