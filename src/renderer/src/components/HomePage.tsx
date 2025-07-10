/**
 * Author: Libra
 * Date: 2025-03-30 11:37:05
 * LastEditors: Libra
 * Description:
 */
/*
 * @Author: Libra
 * @Date: 2024-10-07 01:16:28
 * @LastEditors: Libra
 * @Description:
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  FileType2,
  Sparkles,
  FileDown,
  ImageIcon,
  Video,
  Music,
  Archive,
  School,
  Images,
  FileText,
  Download,
  Edit3,
  Star,
  Wrench,
  Target
} from 'lucide-react'
import ToolCard from '@renderer/components/ui/card/ToolCard'
import CompactToolCard from '@renderer/components/ui/card/CompactToolCard'
import FileConversionTool from '@renderer/components/FileConversionTool'
import ImageCompressionTool from '@renderer/components/ImageCompressionTool'
import AudioCompressionTool from '@renderer/components/AudioCompressionTool'
import VideoCompressionTool from '@renderer/components/VideoCompressionTool'
import ArchiveCompressionTool from '@renderer/components/ArchiveCompressionTool'
import ExamCreationTool from '@renderer/components/ExamCreationTool'
import ImageOrganizeTool from '@renderer/components/ImageOrganizeTool'
import WordToExcelTool from '@renderer/components/WordToExcelTool/index'
import M3u8DownloadTool from '@renderer/components/M3u8DownloadTool'
import BatchRenameTool from '@renderer/components/BatchRenameTool'

enum ActiveTool {
  None,
  Conversion,
  Compression,
  ImageCompression,
  AudioCompression,
  VideoCompression,
  ArchiveCompression,
  ExamCreation,
  ImageOrganize,
  WordToExcel,
  M3u8Download,
  BatchRename
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
    <div className="px-4 py-4 w-full">
      <div className="max-w-md mx-auto">
      {activeTool === ActiveTool.None ? (
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="text-center mb-4">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center justify-center">
              <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
              {t('powerfulFileTools')}
            </h1>
          </motion.div>

          {/* 常用工具分组 */}
          <motion.div variants={itemVariants} className="mb-4">
            <div className="flex items-center mb-2">
              <Star className="h-4 w-4 mr-2 text-yellow-500" />
              <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('frequentTools')}
              </h2>
            </div>
            <div className="space-y-2">
              <CompactToolCard
                icon={<FileType2 size={20} />}
                title={t('fileConversion')}
                description={t('fileConversionDescription')}
                onClick={() => setActiveTool(ActiveTool.Conversion)}
                iconColor="text-blue-500"
              />
              <CompactToolCard
                icon={<FileDown size={20} />}
                title={t('fileCompression')}
                description={t('fileCompressionDescription')}
                onClick={() => setActiveTool(ActiveTool.Compression)}
                iconColor="text-emerald-500"
              />
            </div>
          </motion.div>

          {/* 实用工具分组 */}
          <motion.div variants={itemVariants} className="mb-4">
            <div className="flex items-center mb-2">
              <Wrench className="h-4 w-4 mr-2 text-blue-500" />
              <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('practicalTools')}
              </h2>
            </div>
            <div className="space-y-2">
              <CompactToolCard
                icon={<Edit3 size={20} />}
                title={t('batchRename')}
                description={t('batchRenameDescription')}
                onClick={() => setActiveTool(ActiveTool.BatchRename)}
                iconColor="text-teal-500"
              />
              <CompactToolCard
                icon={<Archive size={20} />}
                title={t('archiveCompression')}
                description={t('archiveCompressionDescription')}
                onClick={() => setActiveTool(ActiveTool.ArchiveCompression)}
                iconColor="text-purple-500"
              />
              <CompactToolCard
                icon={<FileText size={20} />}
                title={t('wordToExcel')}
                description={t('wordToExcelDescription')}
                onClick={() => setActiveTool(ActiveTool.WordToExcel)}
                iconColor="text-rose-500"
              />
            </div>
          </motion.div>

          {/* 专业工具分组 */}
          <motion.div variants={itemVariants} className="mb-4">
            <div className="flex items-center mb-2">
              <Target className="h-4 w-4 mr-2 text-purple-500" />
              <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('professionalTools')}
              </h2>
            </div>
            <div className="space-y-2">
              <CompactToolCard
                icon={<School size={20} />}
                title={t('examCreation')}
                description={t('examCreationDescription')}
                onClick={() => setActiveTool(ActiveTool.ExamCreation)}
                iconColor="text-amber-500"
              />
              <CompactToolCard
                icon={<Images size={20} />}
                title={t('imageOrganize')}
                description={t('imageOrganizeDescription')}
                onClick={() => setActiveTool(ActiveTool.ImageOrganize)}
                iconColor="text-cyan-500"
              />
              <CompactToolCard
                icon={<Download size={20} />}
                title={t('m3u8Download')}
                description={t('m3u8DownloadDescription')}
                onClick={() => setActiveTool(ActiveTool.M3u8Download)}
                iconColor="text-indigo-500"
              />
            </div>
          </motion.div>
        </motion.div>
      ) : (
        <div className="max-w-2xl mx-auto">
      {activeTool === ActiveTool.Conversion ? (
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
      ) : activeTool === ActiveTool.Compression ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center">
              <FileDown className="mr-2 h-5 w-5 text-emerald-500" />
              {t('fileCompression')}
            </h2>
            <button
              onClick={() => setActiveTool(ActiveTool.None)}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-800/40 rounded-full transition-colors"
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4"
          >
            <ToolCard
              icon={<ImageIcon size={24} />}
              title={t('imageCompression')}
              description={t('imageCompressionDescription')}
              onClick={() => setActiveTool(ActiveTool.ImageCompression)}
              iconColor="text-blue-500"
            />
            <ToolCard
              icon={<Music size={24} />}
              title={t('audioCompression')}
              description={t('audioCompressionDescription')}
              onClick={() => setActiveTool(ActiveTool.AudioCompression)}
              iconColor="text-purple-500"
            />
            <ToolCard
              icon={<Video size={24} />}
              title={t('videoCompression')}
              description={t('videoCompressionDescription')}
              onClick={() => setActiveTool(ActiveTool.VideoCompression)}
              iconColor="text-red-500"
            />
          </motion.div>
        </>
      ) : activeTool === ActiveTool.ImageCompression ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center">
              <ImageIcon className="mr-2 h-5 w-5 text-blue-500" />
              {t('imageCompression')}
            </h2>
            <button
              onClick={() => setActiveTool(ActiveTool.Compression)}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-800/40 rounded-full transition-colors"
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
          <ImageCompressionTool />
        </>
      ) : activeTool === ActiveTool.AudioCompression ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center">
              <Music className="mr-2 h-5 w-5 text-purple-500" />
              {t('audioCompression')}
            </h2>
            <button
              onClick={() => setActiveTool(ActiveTool.Compression)}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-800/40 rounded-full transition-colors"
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
          <AudioCompressionTool />
        </>
      ) : activeTool === ActiveTool.VideoCompression ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center">
              <Video className="mr-2 h-5 w-5 text-red-500" />
              {t('videoCompression')}
            </h2>
            <button
              onClick={() => setActiveTool(ActiveTool.Compression)}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-800/40 rounded-full transition-colors"
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
          <VideoCompressionTool />
        </>
      ) : activeTool === ActiveTool.ArchiveCompression ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center">
              <Archive className="mr-2 h-5 w-5 text-purple-500" />
              {t('archiveCompression')}
            </h2>
            <button
              onClick={() => setActiveTool(ActiveTool.None)}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-800/40 rounded-full transition-colors"
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
          <ArchiveCompressionTool />
        </>
      ) : activeTool === ActiveTool.ExamCreation ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center">
              <School className="mr-2 h-5 w-5 text-amber-500" />
              {t('examCreation')}
            </h2>
            <button
              onClick={() => setActiveTool(ActiveTool.None)}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-800/40 rounded-full transition-colors"
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
          <ExamCreationTool />
        </>
      ) : activeTool === ActiveTool.ImageOrganize ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center">
              <Images className="mr-2 h-5 w-5 text-cyan-500" />
              {t('imageOrganize')}
            </h2>
            <button
              onClick={() => setActiveTool(ActiveTool.None)}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-900/30 dark:hover:bg-cyan-800/40 rounded-full transition-colors"
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
          <ImageOrganizeTool />
        </>
      ) : activeTool === ActiveTool.WordToExcel ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center">
              <FileText className="mr-2 h-5 w-5 text-rose-500" />
              {t('wordToExcel')}
            </h2>
            <button
              onClick={() => setActiveTool(ActiveTool.None)}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:hover:bg-rose-800/40 rounded-full transition-colors"
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
          <WordToExcelTool />
        </>
      ) : activeTool === ActiveTool.M3u8Download ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center">
              <Download className="mr-2 h-5 w-5 text-indigo-500" />
              {t('m3u8Download')}
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
          <M3u8DownloadTool />
        </>
      ) : activeTool === ActiveTool.BatchRename ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center">
              <Edit3 className="mr-2 h-5 w-5 text-teal-500" />
              {t('batchRename')}
            </h2>
            <button
              onClick={() => setActiveTool(ActiveTool.None)}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/30 dark:hover:bg-teal-800/40 rounded-full transition-colors"
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
          <BatchRenameTool />
        </>
      ) : null}
        </div>
      )}
      </div>
    </div>
  )
}
