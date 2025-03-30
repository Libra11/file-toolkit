/**
 * Author: Libra
 * Date: 2025-03-30 11:37:05
 * LastEditors: Libra
 * Description:
 */
/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 应用主页
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { FileType2, FileArchive, Sparkles } from 'lucide-react'
import ToolCard from './ui/card/ToolCard'
import FileConversionTool from './FileConversionTool'

enum ActiveTool {
  None,
  Conversion,
  Compression
}

export default function HomePage(): JSX.Element {
  const { t } = useTranslation()
  const [activeTool, setActiveTool] = useState<ActiveTool>(ActiveTool.None)

  // 动画变体
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  return (
    <div className="space-y-12">
      {activeTool === ActiveTool.None ? (
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="text-center mb-12">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 mb-4">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {t('newFeatures')}
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
              {t('powerfulFileTools')}
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              {t('homeDescription')}
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ToolCard
              icon={<FileType2 className="w-6 h-6" />}
              title={t('fileConversion')}
              description={t('fileConversionDescription')}
              onClick={() => setActiveTool(ActiveTool.Conversion)}
              iconColor="text-blue-500"
            />

            <ToolCard
              icon={<FileArchive className="w-6 h-6" />}
              title={t('fileCompression')}
              description={t('fileCompressionDescription')}
              onClick={() => setActiveTool(ActiveTool.Compression)}
              iconColor="text-violet-500"
              badge={t('comingSoon')}
            />
          </motion.div>
        </motion.div>
      ) : activeTool === ActiveTool.Conversion ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center">
              <FileType2 className="mr-2 h-5 w-5 text-blue-500" />
              {t('fileConversion')}
            </h2>
            <button
              onClick={() => setActiveTool(ActiveTool.None)}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/40 rounded-full transition-colors"
            >
              <svg
                className="w-3.5 h-3.5 mr-1.5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19 12H5M5 12L12 19M5 12L12 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {t('backToHome')}
            </button>
          </div>
          <FileConversionTool />
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center">
              <FileArchive className="mr-2 h-5 w-5 text-violet-500" />
              {t('fileCompression')}
            </h2>
            <button
              onClick={() => setActiveTool(ActiveTool.None)}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/40 rounded-full transition-colors"
            >
              <svg
                className="w-3.5 h-3.5 mr-1.5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19 12H5M5 12L12 19M5 12L12 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {t('backToHome')}
            </button>
          </div>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 blur opacity-40"></div>
              <div className="relative bg-white dark:bg-slate-800 rounded-full p-6">
                <Sparkles className="h-12 w-12 text-violet-500 animate-pulse" />
              </div>
            </div>
            <h3 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
              {t('comingSoon')}
            </h3>
            <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-md">
              {t('compressionToolComingSoon')}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
