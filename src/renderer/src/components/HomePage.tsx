/**
 * Author: Libra
 * Date: 2025-03-30 11:37:05
 * LastEditors: Libra
 * Description:
 */
import { useEffect, useState, type KeyboardEvent } from 'react'
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
  Star,
  Wrench,
  Target,
  FileImage,
  VideoIcon,
  Fingerprint,
  Settings2,
  Check,
  Code2,
  ChevronDown
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

type SectionKey = 'frequent' | 'practical' | 'professional'

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
  const [openSections, setOpenSections] = useState<SectionKey[]>(['frequent'])

  const isSectionOpen = (section: SectionKey): boolean => openSections.includes(section)

  const toggleSection = (section: SectionKey): void => {
    setOpenSections((prev) =>
      prev.includes(section) ? prev.filter((value) => value !== section) : [...prev, section]
    )
  }

  const handleSectionKeyDown = (event: KeyboardEvent<HTMLDivElement>, section: SectionKey): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggleSection(section)
    }
  }

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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('customizeFrequentTools')}</DialogTitle>
            <DialogDescription>{t('customizeFrequentToolsDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 pr-1 max-h-[45vh] overflow-y-auto sm:grid-cols-2">
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
                      'flex items-center gap-3 rounded-lg border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
                      'bg-white dark:bg-slate-900/50 shadow-sm hover:shadow',
                      isSelected
                        ? 'border-emerald-400 dark:border-emerald-500/60 ring-1 ring-emerald-500/40 dark:ring-emerald-500/40'
                        : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-500/60 hover:bg-emerald-50/60 dark:hover:bg-emerald-900/20',
                      isDisabled &&
                        'cursor-not-allowed opacity-60 hover:border-slate-200 hover:bg-transparent dark:hover:border-slate-700'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        isSelected
                          ? 'bg-emerald-100 dark:bg-emerald-900/40'
                          : 'bg-slate-100 dark:bg-slate-800/60',
                        config.iconColor
                      )}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {description}
                      </div>
                    </div>
                    {isSelected ? (
                      <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                    ) : null}
                  </button>
                )
              })}
            </div>
            <div className="flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <span>{t('favoriteToolsSelectionHint', { count: MAX_FAVORITES })}</span>
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {t('favoriteToolsSelectionCount', {
                  count: pendingFavorites.length,
                  max: MAX_FAVORITES
                })}
              </span>
            </div>
            {selectionLimitReached ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                {t('favoriteToolsSelectionLimitReached', { count: MAX_FAVORITES })}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => handleFavoritesDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSaveFavorites}>{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="px-4 py-4 w-full">
        <div className="w-full mx-auto">
          {activeTool === ActiveTool.None ? (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              {/* <motion.div variants={itemVariants} className="text-center mb-4">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
                  {t('powerfulFileTools')}
                </h1>
              </motion.div> */}

              {/* 常用工具分组 */}
              <motion.div variants={itemVariants} className="mb-5">
                <div className="rounded-xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/40">
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={isSectionOpen('frequent')}
                    onClick={() => toggleSection('frequent')}
                    onKeyDown={(event) => handleSectionKeyDown(event, 'frequent')}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-slate-100/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:hover:bg-slate-800/50 dark:focus-visible:ring-indigo-500 dark:focus-visible:ring-offset-slate-900 sm:px-5 sm:py-5"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300">
                        <Star className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                          {t('frequentTools')}
                        </h2>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {t('frequentToolsSubtitle', {
                            defaultValue: 'Quick access to your go-to tools'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 shrink-0 px-3 text-xs font-medium border-slate-200 text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-100/70 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800/60"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleFavoritesDialogOpen(true)
                        }}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <Settings2 className="mr-1.5 h-4 w-4" />
                        {t('customize')}
                      </Button>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                          isSectionOpen('frequent') ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>
                  {isSectionOpen('frequent') ? (
                    <div className="border-t border-slate-200/60 px-4 pb-5 pt-4 dark:border-slate-700/40 sm:px-5">
                      <div className="flex flex-col gap-3">
                        {favoriteTools.length > 0 ? (
                          favoriteTools.map((toolId) => renderCompactToolCard(toolId))
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200/90 bg-slate-50/90 px-4 py-6 text-center dark:border-slate-700/60 dark:bg-slate-800/50">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                              {t('noFrequentToolsSelected')}
                            </p>
                            <p className="max-w-xs text-xs text-slate-500 dark:text-slate-400">
                              {t('noFrequentToolsSelectedDescription')}
                            </p>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleFavoritesDialogOpen(true)}
                              className="px-3"
                            >
                              {t('customize')}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </motion.div>

              {/* 实用工具分组 */}
              <motion.div variants={itemVariants} className="mb-5">
                <div className="rounded-xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/40">
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={isSectionOpen('practical')}
                    onClick={() => toggleSection('practical')}
                    onKeyDown={(event) => handleSectionKeyDown(event, 'practical')}
                    className="flex items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-slate-100/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:hover:bg-slate-800/50 dark:focus-visible:ring-indigo-500 dark:focus-visible:ring-offset-slate-900 sm:px-5 sm:py-5"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                        <Wrench className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                          {t('practicalTools')}
                        </h2>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {t('practicalToolsSubtitle', {
                            defaultValue: 'Everyday helpers for routine file tasks'
                          })}
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                        isSectionOpen('practical') ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  {isSectionOpen('practical') ? (
                    <div className="border-t border-slate-200/60 px-4 pb-5 pt-4 dark:border-slate-700/40 sm:px-5">
                      <div className="flex flex-col gap-3">
                        {practicalTools.map(renderCompactToolCard)}
                      </div>
                    </div>
                  ) : null}
                </div>
              </motion.div>

              {/* 专业工具分组 */}
              <motion.div variants={itemVariants} className="mb-5">
                <div className="rounded-xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/40">
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={isSectionOpen('professional')}
                    onClick={() => toggleSection('professional')}
                    onKeyDown={(event) => handleSectionKeyDown(event, 'professional')}
                    className="flex items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-slate-100/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:hover:bg-slate-800/50 dark:focus-visible:ring-indigo-500 dark:focus-visible:ring-offset-slate-900 sm:px-5 sm:py-5"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
                        <Target className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                          {t('professionalTools')}
                        </h2>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {t('professionalToolsSubtitle', {
                            defaultValue: 'Advanced features for specialized workflows'
                          })}
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                        isSectionOpen('professional') ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  {isSectionOpen('professional') ? (
                    <div className="border-t border-slate-200/60 px-4 pb-5 pt-4 dark:border-slate-700/40 sm:px-5">
                      <div className="flex flex-col gap-3">
                        {professionalTools.map(renderCompactToolCard)}
                      </div>
                    </div>
                  ) : null}
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
