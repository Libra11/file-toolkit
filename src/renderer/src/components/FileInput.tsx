/**
 * Author: Libra
 * Date: 2024-10-07 01:16:22
 * LastEditors: Libra
 * Description:
 */
import React, { useRef, useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import { Upload, File, X } from 'lucide-react'
import { t } from 'i18next'

interface FileInputProps {
  onFileSelect: (file: File | null) => void
}

const FileInput: React.FC<FileInputProps> = ({ onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)

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

  return (
    <div className="flex items-center">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".mp4, .png, .jpg, .jpeg, .gif"
        className="hidden"
      />
      <Button onClick={handleButtonClick} variant="outline" className="border-dashed">
        <Upload className="mr-2 h-4 w-4" />
        {t('selectFile')}
      </Button>
      {selectedFileName && (
        <div className="ml-4 flex items-center bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md px-3 py-1.5 border border-blue-200 dark:border-blue-700">
          <File className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">{selectedFileName}</span>
          <button
            onClick={handleRemoveFile}
            className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export default FileInput
