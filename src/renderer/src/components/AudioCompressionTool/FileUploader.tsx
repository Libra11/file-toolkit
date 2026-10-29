import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileUp, Music } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { EmptyState } from '@renderer/components/ui/states'
import { cn } from '@renderer/lib/utils'

interface FileUploaderProps {
  onFileSelect: (files: File[]) => void
  fileInputRef?: React.RefObject<HTMLInputElement>
  isBatchMode?: boolean
  className?: string
}

export function FileUploader({
  onFileSelect,
  fileInputRef,
  isBatchMode = false,
  className
}: FileUploaderProps): JSX.Element {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState(false)

  const selectAudios = (fileList: FileList): void => {
    const files = Array.from(fileList).filter((file) => file.type.startsWith('audio/'))
    if (files.length > 0) onFileSelect(isBatchMode ? files : files.slice(0, 1))
  }

  const openFileDialog = (): void => {
    if (fileInputRef?.current) {
      fileInputRef.current.click()
    } else {
      ;(document.getElementById('audio-file-input') as HTMLInputElement | null)?.click()
    }
  }

  return (
    <div
      className={cn(className)}
      onDrop={(event) => {
        event.preventDefault()
        setIsDragging(false)
        selectAudios(event.dataTransfer.files)
      }}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
    >
      <input
        type="file"
        id="audio-file-input"
        ref={fileInputRef}
        className="hidden"
        accept="audio/*"
        multiple={isBatchMode}
        onChange={(event) => {
          if (event.target.files) selectAudios(event.target.files)
        }}
      />
      <EmptyState
        icon={isDragging ? Music : FileUp}
        title={isBatchMode ? t('dropFilesHere') : t('dragDropAudio')}
        description={`${t('supportedFormats')}: MP3, WAV, AAC, OGG, M4A, FLAC`}
        className={cn(
          'min-h-48 bg-muted/20 px-4 py-6',
          isDragging && 'border-primary bg-primary/[0.05]'
        )}
        action={
          <Button type="button" size="sm" onClick={openFileDialog}>
            <FileUp className="mr-2 h-4 w-4" />
            {isBatchMode ? t('selectFiles') : t('selectFile')}
          </Button>
        }
      />
    </div>
  )
}
