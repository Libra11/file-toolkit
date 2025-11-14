/**
 * Author: Libra
 * Date: 2025-03-30 11:37:05
 * LastEditors: Libra
 * Description:
 */
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  FileType2,
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
  ArrowUpRight,
  Sparkles,
  Wrench,
  Target,
  FileImage,
  VideoIcon,
  Fingerprint,
  Settings2,
  Check,
  Code2
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
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
import { GifExportTool } from '@renderer/components/GifExportTool'
import { WebRTCTool } from '@renderer/components/WebRTCTool'
import FileHashTool from '@renderer/components/FileHashTool'
import JsonFormatterTool from '@renderer/components/JsonFormatterTool'
import { conversionCategories } from '@renderer/lib/conversionTypes'
import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'

enum ActiveTool {
  None,
  Conversion,
  Compression,
  ArchiveCompression,
  ExamCreation,
  ImageOrganize,
  WordToExcel,
  M3u8Download,
  JsonFormatter,
  BatchRename,
  GifExport,
  WebRTC,
  FileHash
}

type ToolKey = Exclude<ActiveTool, ActiveTool.None>

type ToolConfig = {
  id: ToolKey
  icon: LucideIcon
  iconColor: string
  titleKey?: string
  title?: string
  descriptionKey?: string
  description?: string
}

const DEFAULT_FAVORITE_TOOLS: ToolKey[] = [
  ActiveTool.Conversion,
  ActiveTool.Compression,
  ActiveTool.FileHash
]

const MAX_FAVORITES = 6
const FAVORITE_TOOLS_STORAGE_KEY = 'fileToolkit.favoriteTools'

const toolConfigs: Record<ToolKey, ToolConfig> = {
  [ActiveTool.Conversion]: {
    id: ActiveTool.Conversion,
    icon: FileType2,
    iconColor: 'text-blue-500',
    titleKey: 'fileConversion',
    descriptionKey: 'fileConversionDescription'
  },
  [ActiveTool.Compression]: {
    id: ActiveTool.Compression,
    icon: FileDown,
    iconColor: 'text-emerald-500',
    titleKey: 'fileCompression',
    descriptionKey: 'fileCompressionDescription'
  },
  [ActiveTool.ArchiveCompression]: {
    id: ActiveTool.ArchiveCompression,
    icon: Archive,
    iconColor: 'text-purple-500',
    titleKey: 'archiveCompression',
    descriptionKey: 'archiveCompressionDescription'
  },
  [ActiveTool.ExamCreation]: {
    id: ActiveTool.ExamCreation,
    icon: School,
    iconColor: 'text-amber-500',
    titleKey: 'examCreation',
    descriptionKey: 'examCreationDescription'
  },
  [ActiveTool.ImageOrganize]: {
    id: ActiveTool.ImageOrganize,
    icon: Images,
    iconColor: 'text-cyan-500',
    titleKey: 'imageOrganize',
    descriptionKey: 'imageOrganizeDescription'
  },
  [ActiveTool.WordToExcel]: {
    id: ActiveTool.WordToExcel,
    icon: FileText,
    iconColor: 'text-rose-500',
    titleKey: 'wordToExcel',
    descriptionKey: 'wordToExcelDescription'
  },
  [ActiveTool.M3u8Download]: {
    id: ActiveTool.M3u8Download,
    icon: Download,
    iconColor: 'text-indigo-500',
    titleKey: 'm3u8Download',
    descriptionKey: 'm3u8DownloadDescription'
  },
  [ActiveTool.JsonFormatter]: {
    id: ActiveTool.JsonFormatter,
    icon: Code2,
    iconColor: 'text-lime-500',
    titleKey: 'jsonFormatter',
    descriptionKey: 'jsonFormatterDescription'
  },
  [ActiveTool.BatchRename]: {
    id: ActiveTool.BatchRename,
    icon: Edit3,
    iconColor: 'text-teal-500',
    titleKey: 'batchRename',
    descriptionKey: 'batchRenameDescription'
  },
  [ActiveTool.GifExport]: {
    id: ActiveTool.GifExport,
    icon: FileImage,
    iconColor: 'text-pink-500',
    titleKey: 'htmlCardGifExportTool',
    descriptionKey: 'htmlCardGifExportDescription'
  },
  [ActiveTool.WebRTC]: {
    id: ActiveTool.WebRTC,
    icon: VideoIcon,
    iconColor: 'text-orange-500',
    titleKey: 'webrtcTool',
    descriptionKey: 'webrtcToolDescription'
  },
  [ActiveTool.FileHash]: {
    id: ActiveTool.FileHash,
    icon: Fingerprint,
    iconColor: 'text-indigo-500',
    titleKey: 'fileHashTool',
    descriptionKey: 'fileHashDescription'
  }
}

const practicalTools: ToolKey[] = [
  ActiveTool.BatchRename,
  ActiveTool.ArchiveCompression,
  ActiveTool.WordToExcel,
  ActiveTool.JsonFormatter
]

const professionalTools: ToolKey[] = [
  ActiveTool.ExamCreation,
  ActiveTool.ImageOrganize,
  ActiveTool.M3u8Download,
  ActiveTool.GifExport,
  ActiveTool.WebRTC
]

const availableToolIds = Object.values(toolConfigs).map((config) => config.id)
const availableToolIdSet = new Set<ToolKey>(availableToolIds)

enum CompressionTab {
  Image = 'image',
  Audio = 'audio',
  Video = 'video'
}

export default function HomePage(): JSX.Element {
  const { t } = useTranslation()
  const [activeTool, setActiveTool] = useState<ActiveTool>(ActiveTool.None)
  const [compressionTab, setCompressionTab] = useState<CompressionTab>(CompressionTab.Image)
  const [conversionTab, setConversionTab] = useState<string>(
    conversionCategories[0]?.name ?? 'image'
  )
  const [favoriteTools, setFavoriteTools] = useState<ToolKey[]>(DEFAULT_FAVORITE_TOOLS)
  const [favoritesLoaded, setFavoritesLoaded] = useState(false)
  const [isFavoritesDialogOpen, setFavoritesDialogOpen] = useState(false)
  const [pendingFavorites, setPendingFavorites] = useState<ToolKey[]>(DEFAULT_FAVORITE_TOOLS)

  useEffect(() => {
    if (activeTool === ActiveTool.Conversion) {
      setConversionTab(conversionCategories[0]?.name ?? 'image')
    }
    if (activeTool === ActiveTool.Compression) {
      setCompressionTab(CompressionTab.Image)
    }
  }, [activeTool])

  useEffect(() => {
    if (typeof window === 'undefined') {
      setFavoritesLoaded(true)
      return
    }

    try {
      const stored = window.localStorage.getItem(FAVORITE_TOOLS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          const valid = parsed.reduce<ToolKey[]>((acc, value) => {
            const numericValue = Number(value)
            if (availableToolIdSet.has(numericValue as ToolKey)) {
              acc.push(numericValue as ToolKey)
            }
            return acc
          }, [])
          setFavoriteTools(valid)
        }
      }
    } catch (error) {
      console.error('Failed to load favorite tools', error)
    } finally {
      setFavoritesLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!favoritesLoaded || typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(
        FAVORITE_TOOLS_STORAGE_KEY,
        JSON.stringify(favoriteTools.map((tool) => Number(tool)))
      )
    } catch (error) {
      console.error('Failed to save favorite tools', error)
    }
  }, [favoriteTools, favoritesLoaded])

  const compressionTabsConfig = [
    {
      key: CompressionTab.Image,
      labelKey: 'imageCompression',
      descriptionKey: 'imageCompressionDescription',
      icon: ImageIcon,
      activeTextClass: 'text-blue-600 dark:text-blue-400',
      activeIconClass: 'text-blue-500'
    },
    {
      key: CompressionTab.Audio,
      labelKey: 'audioCompression',
      descriptionKey: 'audioCompressionDescription',
      icon: Music,
      activeTextClass: 'text-purple-600 dark:text-purple-400',
      activeIconClass: 'text-purple-500'
    },
    {
      key: CompressionTab.Video,
      labelKey: 'videoCompression',
      descriptionKey: 'videoCompressionDescription',
      icon: Video,
      activeTextClass: 'text-red-600 dark:text-red-400',
      activeIconClass: 'text-red-500'
    }
  ]

  const activeCompressionTab =
    compressionTabsConfig.find((tab) => tab.key === compressionTab) ?? compressionTabsConfig[0]

  const conversionTabsConfig = conversionCategories.map((category) => {
    const baseConfig = {
      key: category.name,
      icon: category.icon,
      labelKey: '',
      descriptionKey: '',
      activeTextClass: '',
      activeIconClass: ''
    }

    switch (category.name) {
      case 'image':
        return {
          ...baseConfig,
          labelKey: 'imageConversion',
          descriptionKey: 'imageConversionDescription',
          activeTextClass: 'text-blue-600 dark:text-blue-400',
          activeIconClass: 'text-blue-500'
        }
      case 'video':
        return {
          ...baseConfig,
          labelKey: 'videoConversion',
          descriptionKey: 'videoConversionDescription',
          activeTextClass: 'text-red-600 dark:text-red-400',
          activeIconClass: 'text-red-500'
        }
      case 'audio':
        return {
          ...baseConfig,
          labelKey: 'audioConversion',
          descriptionKey: 'audioConversionDescription',
          activeTextClass: 'text-purple-600 dark:text-purple-400',
          activeIconClass: 'text-purple-500'
        }
      default:
        return {
          ...baseConfig,
          labelKey: category.name,
          descriptionKey: 'fileConversionDescription',
          activeTextClass: 'text-indigo-600 dark:text-indigo-400',
          activeIconClass: 'text-indigo-500'
        }
    }
  })

  const activeConversionTab =
    conversionTabsConfig.find((tab) => tab.key === conversionTab) ?? conversionTabsConfig[0]

  const handleFavoritesDialogOpen = (open: boolean): void => {
    if (open) {
      setPendingFavorites(favoriteTools)
    }
    setFavoritesDialogOpen(open)
  }

  const togglePendingFavorite = (toolId: ToolKey): void => {
    setPendingFavorites((prev) => {
      if (prev.includes(toolId)) {
        return prev.filter((id) => id !== toolId)
      }

      if (prev.length >= MAX_FAVORITES) {
        return prev
      }

      return [...prev, toolId]
    })
  }

  const handleSaveFavorites = (): void => {
    setFavoriteTools(pendingFavorites)
    setFavoritesDialogOpen(false)
  }

  const renderCompactToolCard = (toolId: ToolKey): JSX.Element | null => {
    const config = toolConfigs[toolId]
    if (!config) {
      return null
    }

    const Icon = config.icon
    const title = config.titleKey ? t(config.titleKey) : (config.title ?? '')
    const description = config.descriptionKey
      ? t(config.descriptionKey)
      : (config.description ?? '')

    return (
      <CompactToolCard
        key={toolId}
        icon={<Icon size={20} />}
        title={title}
        description={description}
        onClick={() => setActiveTool(toolId)}
        iconColor={config.iconColor}
      />
    )
  }

  const toolOptions = Object.values(toolConfigs)
  const selectionLimitReached = pendingFavorites.length >= MAX_FAVORITES

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
    <>
      <Dialog open={isFavoritesDialogOpen} onOpenChange={handleFavoritesDialogOpen}>
        <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
          <div className="relative overflow-hidden rounded-[24px] border border-slate-200/70 bg-gradient-to-br from-white via-slate-50/80 to-white/70 shadow-2xl shadow-indigo-900/15  dark:border-white/15 dark:from-[#0f172a] dark:via-[#111a37] dark:to-[#0c1326]">
            <div className="pointer-events-none absolute inset-0 opacity-70">
              <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-indigo-300/40 blur-3xl dark:bg-indigo-500/30" />
              <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/25" />
            </div>
            <div className="relative px-6 py-6 sm:px-8 sm:py-8">
              <DialogHeader className="space-y-3 text-left">
                <DialogTitle className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {t('customizeFrequentTools')}
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500 dark:text-white/70">
                  {t('customizeFrequentToolsDescription')}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-5">
                <div className="grid max-h-[30vh] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                  {toolOptions.map((config) => {
                    const Icon = config.icon
                    const isSelected = pendingFavorites.includes(config.id)
                    const isDisabled = !isSelected && selectionLimitReached
                    const title = config.titleKey ? t(config.titleKey) : (config.title ?? '')
                    const description = config.descriptionKey
                      ? t(config.descriptionKey)
                      : (config.description ?? '')

                    return (
                      <button
                        key={config.id}
                        type="button"
                        onClick={() => togglePendingFavorite(config.id)}
                        disabled={isDisabled}
                        aria-pressed={isSelected}
                        className={cn(
                          'group flex items-center gap-3 rounded-2xl border border-white/70 bg-white/80 p-3 text-left shadow-sm shadow-indigo-900/5 transition-all hover:border-white hover:bg-white dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-emerald-400/70 dark:focus-visible:ring-offset-slate-900',
                          isSelected &&
                            'border-emerald-300 bg-emerald-50/70 shadow-emerald-200/40 dark:border-emerald-400/50 dark:bg-emerald-500/10',
                          isDisabled && 'cursor-not-allowed opacity-50 hover:translate-y-0'
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white',
                            config.iconColor
                          )}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-white/70">{description}</p>
                        </div>
                        {isSelected ? (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/30 dark:text-emerald-200">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>

                <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 text-xs text-slate-600 shadow-inner dark:border-white/15 dark:bg-white/5 dark:text-white/70 sm:flex sm:items-center sm:justify-between">
                  <span>{t('favoriteToolsSelectionHint', { count: MAX_FAVORITES })}</span>
                  <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm dark:bg-white/10 dark:text-white sm:mt-0">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    {t('favoriteToolsSelectionCount', {
                      count: pendingFavorites.length,
                      max: MAX_FAVORITES
                    })}
                  </span>
                </div>
                {selectionLimitReached ? (
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-300">
                    {t('favoriteToolsSelectionLimitReached', { count: MAX_FAVORITES })}
                  </p>
                ) : null}
              </div>

              <DialogFooter className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="ghost"
                  onClick={() => handleFavoritesDialogOpen(false)}
                  className="h-11 rounded-2xl border border-slate-200/80 bg-white/70 text-slate-700 shadow-sm hover:bg-white dark:border-white/20 dark:bg-transparent dark:text-white"
                >
                  {t('cancel')}
                </Button>
                <Button
                  onClick={handleSaveFavorites}
                  className="h-11 flex-1 rounded-2xl bg-slate-900 text-white shadow-lg shadow-indigo-900/20 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-white/90"
                >
                  {t('save')}
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <div className="px-4 py-4 w-full">
        <div className="w-full mx-auto">
          {activeTool === ActiveTool.None ? (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <motion.div variants={itemVariants} className="mb-6">
                <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-r from-[#eef2ff] via-[#f8f5ff] to-[#e2f7ff] text-slate-900 shadow-xl shadow-indigo-900/20 dark:border-slate-700/60 dark:from-[#13172b] dark:via-[#161c3a] dark:to-[#10172a] dark:text-white">
                  <div className="pointer-events-none absolute inset-0 opacity-70">
                    <div className="absolute -left-16 top-0 h-60 w-60 rounded-full bg-indigo-300/40 blur-3xl dark:bg-indigo-500/30" />
                    <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-400/20" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.5),_transparent_60%)] dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_60%)]" />
                  </div>
                  <div className="relative px-6 py-8 sm:px-8">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-700 dark:border-white/20 dark:bg-white/10 dark:text-white/80">
                      <Sparkles className="h-4 w-4 text-amber-500 dark:text-amber-200" />
                      {t('newFeatures')}
                      <span className="text-slate-500 dark:text-white/60">2025 · Q1</span>
                    </span>
                    <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                      <div className="max-w-3xl">
                        <h1 className="text-3xl font-semibold leading-tight text-slate-900 dark:text-white sm:text-4xl">
                          {t('powerfulFileTools')}
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-white/80 sm:text-base">
                          {t('heroSubtitle')}
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                          <Button
                            type="button"
                            onClick={() => setActiveTool(ActiveTool.Conversion)}
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-indigo-200/60 transition hover:-translate-y-0.5 hover:bg-white/90 dark:text-slate-900"
                          >
                            {t('fileConversion')}
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setActiveTool(ActiveTool.Compression)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300/60 bg-white/30 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-white/50 dark:border-white/30 dark:bg-transparent dark:text-white"
                          >
                            {t('fileCompression')}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-10 grid gap-5 lg:grid-cols-3">
                      <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-2xl shadow-indigo-900/10  dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                              {t('frequentTools')}
                            </p>
                            <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                              {t('frequentToolsSubtitle', {
                                defaultValue: 'Quick access to your go-to tools'
                              })}
                            </h3>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 shrink-0 rounded-full border-slate-200/80 bg-white/80 px-4 text-xs font-semibold text-slate-700 shadow-sm hover:-translate-y-0.5 hover:bg-white dark:border-white/30 dark:bg-transparent dark:text-white"
                            onClick={() => handleFavoritesDialogOpen(true)}
                          >
                            <Settings2 className="mr-1.5 h-4 w-4" />
                            {t('customize')}
                          </Button>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {favoriteTools.length > 0 ? (
                            favoriteTools.map((toolId) => renderCompactToolCard(toolId))
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300/80 bg-white/80 px-4 py-6 text-center shadow-inner dark:border-white/20 dark:bg-white/5">
                              <p className="text-sm font-medium text-slate-700 dark:text-white">
                                {t('noFrequentToolsSelected')}
                              </p>
                              <p className="max-w-xs text-xs text-slate-500 dark:text-white/70">
                                {t('noFrequentToolsSelectedDescription')}
                              </p>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleFavoritesDialogOpen(true)}
                              >
                                {t('customize')}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-2xl shadow-indigo-900/10  dark:border-white/10 dark:bg-white/5">
                        <div className="mb-4 flex items-start gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-white/10 dark:text-white">
                            <Wrench className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                              {t('practicalTools')}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-white/70">
                              {t('practicalToolsSubtitle', {
                                defaultValue: 'Everyday helpers for routine file tasks'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="grid gap-3">
                          {practicalTools.map(renderCompactToolCard)}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-2xl shadow-indigo-900/10  dark:border-white/10 dark:bg-white/5">
                        <div className="mb-4 flex items-start gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-white/10 dark:text-white">
                            <Target className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                              {t('professionalTools')}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-white/70">
                              {t('professionalToolsSubtitle', {
                                defaultValue: 'Advanced features for specialized workflows'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="grid gap-3">
                          {professionalTools.map(renderCompactToolCard)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <div className="w-full mx-auto">
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
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 p-1 dark:bg-indigo-900/20">
                      {conversionTabsConfig.map((tab) => {
                        const Icon = tab.icon
                        const isActive = conversionTab === tab.key
                        return (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => setConversionTab(tab.key)}
                            className={`flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                              isActive
                                ? `bg-white shadow-sm dark:bg-slate-900 ${tab.activeTextClass}`
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                            }`}
                          >
                            <Icon
                              className={`mr-1.5 h-4 w-4 ${
                                isActive
                                  ? tab.activeIconClass
                                  : 'text-slate-400 dark:text-slate-500'
                              }`}
                            />
                            {t(tab.labelKey)}
                          </button>
                        )
                      })}
                    </div>
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                      {t(activeConversionTab.descriptionKey)}
                    </p>
                  </div>
                  <FileConversionTool activeCategory={conversionTab} />
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
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 p-1 dark:bg-emerald-900/20">
                      {compressionTabsConfig.map((tab) => {
                        const Icon = tab.icon
                        const isActive = compressionTab === tab.key
                        return (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => setCompressionTab(tab.key)}
                            className={`flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                              isActive
                                ? `bg-white shadow-sm dark:bg-slate-900 ${tab.activeTextClass}`
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                            }`}
                          >
                            <Icon
                              className={`mr-1.5 h-4 w-4 ${
                                isActive
                                  ? tab.activeIconClass
                                  : 'text-slate-400 dark:text-slate-500'
                              }`}
                            />
                            {t(tab.labelKey)}
                          </button>
                        )
                      })}
                    </div>
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                      {t(activeCompressionTab.descriptionKey)}
                    </p>
                  </div>
                  {compressionTab === CompressionTab.Image ? (
                    <ImageCompressionTool />
                  ) : compressionTab === CompressionTab.Audio ? (
                    <AudioCompressionTool />
                  ) : (
                    <VideoCompressionTool />
                  )}
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
              ) : activeTool === ActiveTool.JsonFormatter ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center">
                      <Code2 className="mr-2 h-5 w-5 text-lime-500" />
                      {t('jsonFormatter')}
                    </h2>
                    <button
                      onClick={() => setActiveTool(ActiveTool.None)}
                      className="flex items-center px-3 py-1.5 text-sm font-medium text-lime-600 hover:text-lime-700 dark:text-lime-400 dark:hover:text-lime-300 bg-lime-50 hover:bg-lime-100 dark:bg-lime-900/30 dark:hover:bg-lime-800/40 rounded-full transition-colors"
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
                  <JsonFormatterTool />
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
              ) : activeTool === ActiveTool.FileHash ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center">
                      <Fingerprint className="mr-2 h-5 w-5 text-indigo-500" />
                      {t('fileHashTool')}
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
                  <FileHashTool />
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
              ) : activeTool === ActiveTool.GifExport ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center">
                      <FileImage className="mr-2 h-5 w-5 text-pink-500" />
                      {t('htmlCardGifExportTool')}
                    </h2>
                    <button
                      onClick={() => setActiveTool(ActiveTool.None)}
                      className="flex items-center px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
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
                  <GifExportTool />
                </>
              ) : activeTool === ActiveTool.WebRTC ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center">
                      <VideoIcon className="mr-2 h-5 w-5 text-orange-500" />
                      {t('webrtcTool')}
                    </h2>
                    <button
                      onClick={() => setActiveTool(ActiveTool.None)}
                      className="flex items-center px-3 py-1.5 text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/30 dark:hover:bg-orange-800/40 rounded-full transition-colors"
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
                  <WebRTCTool />
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
