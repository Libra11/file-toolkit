/**
 * Author: Libra
 * Date: 2025-04-15 17:56:04
 * LastEditors: Libra
 * Description:
 */
/*
 * @Author: Libra
 * @Date: 2024-10-23
 * @LastEditors: Libra
 * @Description: 文件上传组件
 */
import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, File } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
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
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files
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

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const fileList = e.dataTransfer.files
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
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragging
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
          : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 文件选择输入 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
        multiple={multiple}
        accept={accept}
      />

      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="flex flex-col items-center">
          <Upload className="w-12 h-12 text-slate-400 mb-4" />
          <h3 className="font-medium text-slate-700 dark:text-slate-300">
            {t('dragAndDropFiles')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {multiple ? t('orSelectMultipleFiles') : t('orSelectFile')}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant="outline"
            type="button"
            onClick={handleSelectFile}
            className="flex items-center"
          >
            <File className="w-4 h-4 mr-2" />
            {multiple ? t('selectFiles') : t('selectFile')}
          </Button>
        </div>
      </div>
    </div>
  )
}
