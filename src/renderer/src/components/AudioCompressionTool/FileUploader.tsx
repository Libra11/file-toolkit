/**
 * Author: Libra
 * Date: 2024-03-31
 * LastEditors: Libra
 * Description: 音频压缩工具的文件上传组件
 */
import { useTranslation } from 'react-i18next'
import { Music } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
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

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files: File[] = []
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i]
        if (file.type.startsWith('audio/')) {
          files.push(file)
        }
      }
      if (files.length > 0) {
        if (isBatchMode) {
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
        if (file.type.startsWith('audio/')) {
          files.push(file)
        }
      }
      if (files.length > 0) {
        onFileSelect(files)
      }
    }
  }

  const openFileDialog = (): void => {
    const input = document.getElementById('audio-file-input') as HTMLInputElement
    if (input) {
      input.click()
    }
  }

  return (
    <div className={cn('mt-4', className)}>
      <input
        type="file"
        id="audio-file-input"
        ref={fileInputRef}
        className="hidden"
        accept="audio/*"
        multiple={isBatchMode}
        onChange={handleFileInputChange}
      />
      <div
        className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
        onClick={openFileDialog}
        onDrop={handleFileDrop}
        onDragOver={handleDragOver}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <Music className="h-10 w-10 text-slate-400 dark:text-slate-500" />
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">
            {isBatchMode ? t('dropFilesHere') : t('dragDropAudio')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
            {t('supportedFormats')}: MP3, WAV, AAC, OGG, M4A, FLAC
          </p>
          <Button className="mt-4" size="sm">
            {isBatchMode ? t('selectFiles') : t('selectFile')}
          </Button>
        </div>
      </div>
    </div>
  )
}
