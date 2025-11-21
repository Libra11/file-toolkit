/**
 * Author: Libra
 * Date: 2024-04-01
 * LastEditors: Libra
 * Description: 视频上传组件
 */
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Video as VideoIcon, Upload } from 'lucide-react'

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

  // 处理文件拖放事件
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

    const files = Array.from(e.dataTransfer.files).filter((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      return ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)
    })

    if (files.length > 0) {
      onFileSelect(files)
    }
  }

  // 处理文件选择事件
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFileSelect(files)
    }
  }

  // 处理按钮点击事件
  const handleButtonClick = (): void => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".mp4,.mov,.avi,.mkv,.webm"
        className="hidden"
        multiple={batchMode}
      />

      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`
            border-2 border-dashed rounded-lg p-8
            ${
              isDragging
                ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                : 'border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50/50 dark:hover:bg-red-900/5'
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
              ${isDragging ? 'bg-red-500 opacity-20' : 'bg-red-500/0'}
              transition-all duration-200
            `}
            ></div>
            <div
              className={`
              relative p-4 rounded-full 
              ${isDragging ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}
              transition-colors duration-200
            `}
            >
              {isDragging ? <VideoIcon size={24} /> : <Upload size={24} />}
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="font-medium text-red-600 dark:text-red-400">
              {batchMode ? t('selectFiles') : t('selectVideo')}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('dropVideoHere')}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {t('supportedFormats')}: MP4, MOV, AVI, MKV, WEBM
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
