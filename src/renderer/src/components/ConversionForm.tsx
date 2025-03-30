/**
 * Author: Libra
 * Date: 2024-10-07 01:16:09
 * LastEditors: Libra
 * Description:
 */
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Loader2, CheckCircle2, Zap, FileUp, Download } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import CategorySelect from '@renderer/components/CategorySelect'
import ConversionTypeSelect from '@renderer/components/ConversionTypeSelect'
import FileInput from '@renderer/components/FileInput'
import {
  CONVERSION_TYPES,
  ConversionCategory,
  ConversionType,
  getDefaultOutputExtension
} from '@renderer/lib/conversionTypes'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@renderer/components/ui/tooltip'
import { Badge } from '@renderer/components/ui/badge'
import { cn } from '@renderer/lib/utils'

interface ConversionFormProps {
  categories: ConversionCategory[]
}

export default function ConversionForm({ categories }: ConversionFormProps): JSX.Element {
  const { t } = useTranslation()
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedConversion, setSelectedConversion] = useState<ConversionType | ''>('')
  const [isConverting, setIsConverting] = useState(false)
  const [convertedFilePath, setConvertedFilePath] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const saveOutputFile = async (conversionType: ConversionType): Promise<string> => {
    const extension = getDefaultOutputExtension(conversionType)
    const defaultFileName = `output.${extension}`
    const outputPath = await window.system.saveFile(defaultFileName)
    if (!outputPath) {
      throw new Error('No output file selected')
    }
    return outputPath
  }

  const convertMp4ToGif = async (inputPath: string, outputPath: string): Promise<string> => {
    return await window.ffmpeg.convertMp4ToGif(inputPath, outputPath)
  }

  const convertPngToJpg = async (inputPath: string, outputPath: string): Promise<string> => {
    return await window.ffmpeg.convertPngToJpg(inputPath, outputPath)
  }

  const convertJpgToPng = async (inputPath: string, outputPath: string): Promise<string> => {
    return await window.ffmpeg.convertJpgToPng(inputPath, outputPath)
  }

  const convertWebpToJpg = async (inputPath: string, outputPath: string): Promise<string> => {
    return await window.ffmpeg.convertWebpToJpg(inputPath, outputPath)
  }

  const openFileLocation = async (filePath: string): Promise<boolean> => {
    return await window.system.openFileLocation(filePath)
  }

  const performConversion = async (
    conversionType: ConversionType,
    inputPath: string,
    outputPath: string
  ): Promise<string> => {
    switch (conversionType) {
      case CONVERSION_TYPES.MP4_TO_GIF:
        return await convertMp4ToGif(inputPath, outputPath)
      case CONVERSION_TYPES.PNG_TO_JPG:
        return await convertPngToJpg(inputPath, outputPath)
      case CONVERSION_TYPES.JPG_TO_PNG:
        return await convertJpgToPng(inputPath, outputPath)
      case CONVERSION_TYPES.WEBP_TO_JPG:
        return await convertWebpToJpg(inputPath, outputPath)
      default:
        throw new Error(`Unsupported conversion type: ${conversionType}`)
    }
  }

  const handleConvert = async (): Promise<void> => {
    console.log(selectedFile, selectedConversion)
    if (!selectedFile || !selectedConversion) return

    setIsConverting(true)
    setConvertedFilePath(null)

    try {
      const inputPath = selectedFile.path

      // 检查输入文件是否存在
      const fileExists = await window.system.checkFileExists(inputPath)
      if (!fileExists) {
        console.error('输入文件不存在:', inputPath)
        throw new Error('输入文件不存在')
      }

      // 保存文件对话框
      const outputPath = await saveOutputFile(selectedConversion)

      // 确保用户没有取消保存对话框
      if (!outputPath) {
        console.log('用户取消了保存对话框')
        setIsConverting(false)
        return
      }

      console.log('开始转换文件:', inputPath, '->', outputPath, selectedConversion)
      const convertedPath = await performConversion(selectedConversion, inputPath, outputPath)
      console.log('转换完成:', convertedPath)
      // 移除路径中可能存在的引号
      const cleanedPath = convertedPath.replace(/["']/g, '')
      setConvertedFilePath(cleanedPath)
    } catch (error) {
      console.error('Conversion error:', error)
      // Handle error (e.g., show error message to user)
    } finally {
      setIsConverting(false)
    }
  }

  const handleConversionChange = (conversion: ConversionType | ''): void => {
    setSelectedConversion(conversion)
    setConvertedFilePath(null)
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 border border-blue-100/50 dark:border-blue-800/30 shadow-sm"
      >
        <div className="flex items-center space-x-3 mb-3">
          <div className="bg-blue-500 text-white p-2 rounded-lg shadow-md">
            <Zap className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-blue-800 dark:text-blue-300">{t('convertYourFile')}</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 pl-10">
          {t('fileConversionDescription')}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-100 dark:border-slate-700 p-4 hover:shadow-lg transition-all duration-300"
        >
          <CategorySelect
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={(category) => {
              setSelectedCategory(category)
              setSelectedConversion('')
              setConvertedFilePath(null)
            }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-100 dark:border-slate-700 p-4 hover:shadow-lg transition-all duration-300"
        >
          <ConversionTypeSelect
            categories={categories}
            selectedCategory={selectedCategory}
            selectedConversion={selectedConversion}
            onConversionChange={handleConversionChange}
          />
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {selectedConversion && (
          <motion.div
            key="conversion-details"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <motion.div
              className="rounded-xl border border-indigo-100 dark:border-indigo-800/30 overflow-hidden bg-white dark:bg-slate-800 shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-3 border-b border-indigo-100/80 dark:border-indigo-800/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-indigo-500 text-white h-7 w-7 rounded-full flex items-center justify-center shadow-sm mr-3">
                      <FileUp className="h-4 w-4" />
                    </div>
                    <h3 className="font-medium text-indigo-800 dark:text-indigo-300">
                      {t('selectSourceFile')}
                    </h3>
                  </div>

                  {selectedConversion && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-none shadow-sm">
                            {t(selectedConversion)}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {t('conversionType')}: {t(selectedConversion)}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
              <div className="p-4">
                <FileInput onFileSelect={setSelectedFile} />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur-md opacity-20 -z-10 group-hover:opacity-30 transition-opacity" />
              <Button
                className={cn(
                  'w-full h-14 relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-md rounded-xl border-none',
                  isConverting && 'from-indigo-500 to-indigo-700',
                  !selectedFile && 'opacity-80'
                )}
                onClick={handleConvert}
                disabled={isConverting || !selectedFile}
              >
                <span
                  className="absolute inset-0 w-full h-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] group-hover:animate-shimmer"
                  style={{ transform: 'translateX(-100%)' }}
                ></span>
                <span className="relative z-10 flex items-center justify-center w-full h-full font-medium text-lg">
                  {isConverting ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      <span>{t('converting')}</span>
                      <span className="ml-1 animate-pulse">...</span>
                    </>
                  ) : (
                    <>
                      <Download className="mr-3 h-6 w-6" />
                      {t('convertFile')}
                    </>
                  )}
                </span>
              </Button>
            </motion.div>

            <AnimatePresence>
              {convertedFilePath && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="rounded-xl border-2 border-green-200 dark:border-green-800/30 overflow-hidden bg-white dark:bg-slate-800 shadow-lg"
                >
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-4 border-b border-green-200 dark:border-green-800/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-500 text-white p-2 rounded-lg shadow-sm mr-3">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <h3 className="font-medium text-green-800 dark:text-green-300 text-lg">
                          {t('conversionSuccess')}
                        </h3>
                      </div>
                      <div className="text-xs px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-800/40 text-green-800 dark:text-green-300 font-medium border border-green-200 dark:border-green-700/30">
                        {selectedConversion ? t(selectedConversion) : ''}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="w-full md:w-32 h-32 bg-slate-100 dark:bg-slate-700/30 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
                        <img
                          src={`myapp:///${convertedFilePath}`}
                          alt="Preview"
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            console.error('图片加载失败:', convertedFilePath)
                            ;(e.target as HTMLImageElement).src =
                              'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWltYWdlIj48cmVjdCB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHg9IjMiIHk9IjMiIHJ4PSIyIiByeT0iMiIvPjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ii8+PHBvbHlsaW5lIHBvaW50cz0iMjEgMTUgMTYgMTAgNSAyMSIvPjwvc3ZnPg=='
                          }}
                        />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-800/80 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                          <div className="text-sm font-medium flex items-center text-green-700 dark:text-green-400 mb-1.5">
                            <ArrowRight className="h-4 w-4 mr-1.5" />
                            {t('outputFile')}
                          </div>
                          <div className="text-xs bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-300 mt-1 break-all p-2 rounded border border-slate-200 dark:border-slate-700 font-mono">
                            {convertedFilePath}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50 hover:border-green-300 dark:hover:border-green-700 transition-all duration-200"
                            onClick={async () => {
                              if (convertedFilePath) {
                                console.log('打开文件位置:', convertedFilePath)
                                // 使用electron.shell.showItemInFolder API
                                try {
                                  await openFileLocation(convertedFilePath)
                                } catch (error) {
                                  console.error('打开文件位置失败:', error)
                                }
                              }
                            }}
                          >
                            <Download className="mr-1.5 h-4 w-4" />
                            {t('openFileLocation')}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={() => {
                              // 保留转换类型，但清除文件选择
                              setSelectedFile(null)
                              setConvertedFilePath(null)

                              // 重新聚焦到文件输入框，提示用户选择新文件
                              const fileInput = document.querySelector(
                                'input[type="file"]'
                              ) as HTMLInputElement | null
                              if (fileInput) {
                                fileInput.click()
                              }
                            }}
                          >
                            {t('convertAnother')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
