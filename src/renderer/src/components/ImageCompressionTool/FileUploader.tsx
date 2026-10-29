import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileUp, Image as ImageIcon } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { EmptyState } from '@renderer/components/ui/states'
import { cn } from '@renderer/lib/utils'

interface FileUploaderProps {
  onFileSelect: (files: File[]) => void
  fileInputRef: React.RefObject<HTMLInputElement>
  batchMode?: boolean
}

export function FileUploader({
  onFileSelect,
  fileInputRef,
  batchMode = false
}: FileUploaderProps): JSX.Element {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState(false)

  const selectImages = (fileList: FileList): void => {
    const files = Array.from(fileList).filter((file) => file.type.startsWith('image/'))
    if (files.length > 0) {
      onFileSelect(batchMode ? files : files.slice(0, 1))
    }
  }

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault()
    setIsDragging(false)
    selectImages(event.dataTransfer.files)
  }

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    if (event.target.files) selectImages(event.target.files)
  }

  return (
    <div
      onDrop={handleFileDrop}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        multiple={batchMode}
        onChange={handleFileInputChange}
      />
      <EmptyState
        icon={isDragging ? ImageIcon : FileUp}
        title={batchMode ? t('dropFilesHere') : t('dragDropImage')}
        description={`${t('supportedFormats')}: JPEG, PNG, WebP`}
        className={cn(
          'min-h-48 bg-muted/20 px-4 py-6',
          isDragging && 'border-primary bg-primary/[0.05]'
        )}
        action={
          <Button type="button" size="sm" onClick={() => fileInputRef.current?.click()}>
            <FileUp className="mr-2 h-4 w-4" />
            {batchMode ? t('selectFiles') : t('selectImage')}
          </Button>
        }
      />
    </div>
  )
}
