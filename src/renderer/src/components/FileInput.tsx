/**
 * Author: Libra
 * Date: 2024-10-07 01:16:22
 * LastEditors: Libra
 * Description:
 */
import React, { useRef, useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import { Upload } from 'lucide-react'
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

  return (
    <div className="flex items-center">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".mp4" // 根据您支持的文件类型进行调整
        className="hidden"
      />
      <Button onClick={handleButtonClick} variant="default" className="mr-4">
        <Upload className="mr-2 h-4 w-4" />
        {t('selectFile')}
      </Button>
      {selectedFileName && <span className="text-sm text-gray-600">{selectedFileName}</span>}
    </div>
  )
}

export default FileInput
