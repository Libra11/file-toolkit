import { useTranslation } from 'react-i18next'
import { FileUp } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'

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

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files: File[] = []
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i]
        if (file.type.startsWith('image/')) {
          files.push(file)
        }
      }
      if (files.length > 0) {
        if (batchMode) {
          onFileSelect(files)
        } else {
          // 单文件模式只选第一个
          onFileSelect([files[0]])
        }
      }
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = []
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i]
        if (file.type.startsWith('image/')) {
          files.push(file)
        }
      }
      if (files.length > 0) {
        onFileSelect(files)
      }
    }
  }

  const openFileDialog = (): void => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="mt-4">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        multiple={batchMode}
        onChange={handleFileInputChange}
      />
      <div
        className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
        onClick={openFileDialog}
        onDrop={handleFileDrop}
        onDragOver={handleDragOver}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <FileUp className="h-10 w-10 text-slate-400 dark:text-slate-500" />
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">
            {batchMode ? t('dropFilesHere') : t('dragDropImage')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
            {t('supportedFormats')}: JPEG, PNG, WebP, GIF, TIFF
          </p>
          <Button className="mt-4" size="sm">
            {batchMode ? t('selectFiles') : t('selectImage')}
          </Button>
        </div>
      </div>
    </div>
  )
}
