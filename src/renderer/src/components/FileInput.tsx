/**
 * Author: Libra
 * Date: 2024-10-07 01:16:22
 * LastEditors: Libra
 * Description:
 */
import React, { useRef, useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import { Upload, File, X, Check, AlertCircle } from 'lucide-react'
import { t } from 'i18next'
import { motion, AnimatePresence } from 'framer-motion'

interface FileInputProps {
  onFileSelect: (file: File | null) => void
}

const FileInput: React.FC<FileInputProps> = ({ onFileSelect }) => {
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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (): void => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      setSelectedFileName(file.name)
      onFileSelect(file)
    }
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".mp4, .png, .jpg, .jpeg, .gif, .webp"
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {!selectedFileName ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`
              border-2 border-dashed rounded-lg p-8
              ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-primary/5'
              }
              transition-colors duration-200 ease-in-out
              flex flex-col items-center justify-center space-y-4
              cursor-pointer
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleButtonClick}
          >
            <div className="relative">
              <div
                className={`
                absolute -inset-0.5 rounded-full blur-sm
                ${isDragging ? 'bg-primary opacity-20' : 'bg-primary/0'}
                transition-all duration-200
              `}
              ></div>
              <div
                className={`
                relative p-4 rounded-full 
                ${isDragging ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                transition-colors duration-200
              `}
              >
                <Upload size={24} />
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="font-medium text-primary">{t('selectFile')}</p>
              <p className="text-sm text-muted-foreground">{t('dropFileHere')}</p>
            </div>
            <Button variant="secondary" size="sm" className="mt-2">
              {t('browseFiles')}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card/70 backdrop-blur-sm border border-border/40 rounded-lg p-4 flex items-start justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 text-primary p-3 rounded-full">
                <File size={20} />
              </div>
              <div>
                <div className="flex items-center">
                  <h4 className="font-medium text-sm line-clamp-1 mr-2">{selectedFileName}</h4>
                  <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs px-2 py-0.5 rounded-full flex items-center">
                    <Check size={12} className="mr-1" />
                    {t('selected')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {t('readyForConversion')}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemoveFile}
              className="hover:bg-destructive/10 hover:text-destructive rounded-full h-8 w-8"
            >
              <X size={16} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FileInput
