import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/button'
import { Upload, File, X, Check } from 'lucide-react'
import { cn } from '@renderer/lib/utils'

interface FileInputProps {
  onFileSelect: (file: File | null) => void
  accept?: string
  placeholder?: string
}

const FileInput: React.FC<FileInputProps> = ({ onFileSelect, accept, placeholder }) => {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files ? event.target.files[0] : null
    if (file) {
      setSelectedFileName(file.name)
    } else {
      setSelectedFileName(null)
    }
    onFileSelect(file)
  }

  const handleButtonClick = (): void => {
    fileInputRef.current?.click()
  }

  const handleRemoveFile = (): void => {
    setSelectedFileName(null)
    onFileSelect(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLButtonElement>): void => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (): void => {
    setIsDragging(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>): void => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) {
      setSelectedFileName(file.name)
      onFileSelect(file)
    }
  }

  return (
    <div className="min-w-0">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={
          accept ||
          '.mp4, .png, .jpg, .jpeg, .gif, .webp, .mp3, .wav, .m4a, .flac, .avi, .mov, .webm'
        }
        className="hidden"
      />

      {!selectedFileName ? (
        <button
          type="button"
          className={cn(
            'flex min-h-32 w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-5 py-5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-input bg-muted/20 hover:border-primary/40 hover:bg-muted/40'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <span
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-md border',
              isDragging
                ? 'border-primary/25 bg-primary/10 text-primary'
                : 'border-border bg-card text-muted-foreground'
            )}
          >
            <Upload className="h-4 w-4" />
          </span>
          <span className="space-y-1">
            <span className="block text-xs font-medium text-foreground">
              {placeholder || t('selectFile')}
            </span>
            <span className="block text-[11px] text-muted-foreground">{t('dropFileHere')}</span>
          </span>
        </button>
      ) : (
        <div className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card px-3 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <File className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground" title={selectedFileName}>
              {selectedFileName}
            </p>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Check className="h-3 w-3 text-primary" />
              {t('selected')} · {t('readyForConversion')}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemoveFile}
            className="h-8 w-8 shrink-0 rounded-md hover:bg-destructive/10 hover:text-destructive"
            aria-label={t('remove')}
            title={t('remove')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

export default FileInput
