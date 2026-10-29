import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileUp, FileVideo } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { EmptyState } from '@renderer/components/ui/states'
import { cn } from '@renderer/lib/utils'

interface FileUploaderProps {
  onFileSelect: (files: File[]) => void
  fileInputRef: React.RefObject<HTMLInputElement>
  batchMode?: boolean
}

const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'mkv', 'webm']

export function FileUploader({
  onFileSelect,
  fileInputRef,
  batchMode = false
}: FileUploaderProps): JSX.Element {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState(false)

  const selectVideos = (fileList: FileList): void => {
    const files = Array.from(fileList).filter((file) => {
      const extension = file.name.split('.').pop()?.toLowerCase() || ''
      return VIDEO_EXTENSIONS.includes(extension)
    })
    if (files.length > 0) onFileSelect(batchMode ? files : files.slice(0, 1))
  }

  return (
    <div
      onDrop={(event) => {
        event.preventDefault()
        setIsDragging(false)
        selectVideos(event.dataTransfer.files)
      }}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept=".mp4,.mov,.avi,.mkv,.webm"
        className="hidden"
        multiple={batchMode}
        onChange={(event) => {
          if (event.target.files) selectVideos(event.target.files)
        }}
      />
      <EmptyState
        icon={isDragging ? FileVideo : FileUp}
        title={batchMode ? t('dropFilesHere') : t('dropVideoHere')}
        description={`${t('supportedFormats')}: MP4, MOV, AVI, MKV, WEBM`}
        className={cn(
          'min-h-48 bg-muted/20 px-4 py-6',
          isDragging && 'border-primary bg-primary/[0.05]'
        )}
        action={
          <Button type="button" size="sm" onClick={() => fileInputRef.current?.click()}>
            <FileUp className="mr-2 h-4 w-4" />
            {batchMode ? t('selectFiles') : t('selectVideo')}
          </Button>
        }
      />
    </div>
  )
}
