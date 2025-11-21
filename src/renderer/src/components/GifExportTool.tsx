/**
 * Author: Libra
 * Date: 2025-07-21 14:03:08
 * LastEditors: Libra
 * Description:
 */
/*
 * @Author: Libra
 * @Date: 2025-07-21 11:19:27
 * @LastEditors: Libra
 * @Description: GIF 导出工具组件
 */
import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Slider } from './ui/slider'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Switch } from './ui/switch'
import { BackToHomeButton } from './ui/BackToHomeButton'
import { FolderOpen, Download, Eye, Settings, FileImage, Sparkles, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { GifExportOptions, CardInfo } from '../../../shared/types'

interface GifExportToolProps {
  className?: string
  onBack?: () => void
}

export function GifExportTool({ className, onBack }: GifExportToolProps): JSX.Element {
  const { t } = useTranslation()
  const [htmlString, setHtmlString] = useState('')
  const [outputDir, setOutputDir] = useState('')
  const [cardInfo, setCardInfo] = useState<CardInfo[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null)
  const [progressMessage, setProgressMessage] = useState('')
  const [currentCard, setCurrentCard] = useState(0)
  const [totalCards, setTotalCards] = useState(0)

  // 导出选项
  const [options, setOptions] = useState<GifExportOptions>({
    frameRate: 30,
    duration: 8000,
    quality: 'high',
    singleFrame: false,
    outputDir: ''
  })

  // 监听进度事件
  useEffect(() => {
    const handleProgress = (progress: any): void => {
      console.log('Progress:', progress)
      setProgressMessage(progress.message || '')

      switch (progress.type) {
        case 'analyzing':
          if (progress.cardCount) {
            setTotalCards(progress.cardCount)
          }
          break
        case 'exporting':
          if (progress.totalCards) {
            setTotalCards(progress.totalCards)
          }
          if (progress.currentCard) {
            setCurrentCard(progress.currentCard)
            const overallProgress = Math.round((progress.currentCard / progress.totalCards) * 100)
            setExportProgress(overallProgress)
          }
          break
        case 'capturing':
          if (progress.frameProgress) {
            // 对于帧截取进度，我们可以更细粒度地更新进度
            const cardProgress = ((currentCard - 1) / totalCards) * 100
            const frameProgress = progress.frameProgress / totalCards
            setExportProgress(Math.round(cardProgress + frameProgress))
          }
          break
        case 'completed':
          setExportProgress(100)
          break
        case 'error':
          setIsExporting(false)
          setExportProgress(0)
          break
      }
    }

    window.gifExport.onProgress(handleProgress)

    return (): void => {
      window.gifExport.removeProgressListener()
    }
  }, [currentCard, totalCards])

  // 选择输出目录
  const handleSelectOutputDir = useCallback(async () => {
    try {
      const dir = await window.gifExport.selectOutputDir()
      console.log('选择的目录:', dir)
      if (dir) {
        console.log('设置目录为:', dir)
        setOutputDir(dir)
        setOptions((prev) => {
          const newOptions = { ...prev, outputDir: dir }
          console.log('更新后的 options:', newOptions)
          return newOptions
        })
      } else {
        console.log('用户取消了目录选择')
      }
    } catch (error) {
      console.error('选择输出目录失败:', error)
      alert(t('selectOutputDirFailed'))
    }
  }, [])

  // 分析 HTML 中的卡片
  const handleAnalyzeCards = useCallback(async () => {
    if (!htmlString.trim()) {
      alert(t('pleaseEnterHtml'))
      return
    }

    setIsAnalyzing(true)
    try {
      const currentOptions = { ...options, outputDir }
      console.log('options', currentOptions)
      const cards = await window.gifExport.getCardInfo(htmlString, currentOptions)
      setCardInfo(cards)
      console.log('发现卡片:', cards)
    } catch (error) {
      console.error('分析卡片失败:', error)
      alert(t('analyzeCardsFailed'))
    } finally {
      setIsAnalyzing(false)
    }
  }, [htmlString, options, outputDir, t])

  // 导出所有卡片
  const handleExportAll = useCallback(async () => {
    if (!htmlString.trim()) {
      alert(t('pleaseEnterHtml'))
      return
    }

    if (cardInfo.length === 0) {
      alert(t('pleaseAnalyzeCards'))
      return
    }

    setIsExporting(true)
    setExportProgress(0)
    setProgressMessage(t('exportStarting'))

    try {
      const currentOptions = { ...options, outputDir }
      console.log('导出选项:', currentOptions)
      const outputPaths = await window.gifExport.exportAll(htmlString, currentOptions)

      console.log('导出完成:', outputPaths)
      const fileType = options.singleFrame ? 'PNG' : 'GIF'
      alert(t('exportCompleted', { count: outputPaths.length, type: fileType }))
    } catch (error) {
      console.error('导出失败:', error)
      alert(t('exportFailed'))
    } finally {
      setIsExporting(false)
      setTimeout(() => {
        setExportProgress(0)
        setProgressMessage('')
        setCurrentCard(0)
        setTotalCards(0)
      }, 2000)
    }
  }, [htmlString, cardInfo, options, outputDir, t])

  // 导出单张卡片
  const handleExportSingle = useCallback(
    async (cardIndex: number) => {
      if (!htmlString.trim()) {
        alert(t('pleaseEnterHtml'))
        return
      }

      setIsExporting(true)
      setSelectedCardIndex(cardIndex)

      try {
        const currentOptions = { ...options, outputDir }
        const outputPath = await window.gifExport.exportSingle(
          htmlString,
          cardIndex,
          currentOptions
        )
        console.log('单张导出完成:', outputPath)
        const fileType = options.singleFrame ? 'PNG' : 'GIF'
        alert(t('singleExportCompleted', { type: fileType }))
      } catch (error) {
        console.error('单张导出失败:', error)
        alert(t('singleExportFailed'))
      } finally {
        setIsExporting(false)
        setSelectedCardIndex(null)
      }
    },
    [htmlString, options, outputDir, t]
  )

  const qualityLabelKey =
    options.quality === 'high'
      ? 'highQuality'
      : options.quality === 'medium'
        ? 'mediumQuality'
        : 'lowQuality'

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-6 shadow-2xl shadow-pink-900/10 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/60 md:p-8">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-pink-100/60 via-white to-transparent dark:from-pink-900/25 dark:via-slate-900" />
        <div className="space-y-8">
          <div className="flex flex-col gap-4">
            <div className="flex gap-3 flex-row items-center justify-between">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-pink-100/70 px-3 py-1 text-sm font-medium text-pink-600 dark:bg-pink-900/40 dark:text-pink-100">
                <FileImage className="h-4 w-4" />
                {t('htmlCardGifExportTool')}
              </div>
              {onBack && (
                <BackToHomeButton
                  onClick={onBack}
                  className="bg-pink-100/70 text-pink-600 hover:bg-pink-100 hover:text-pink-700 dark:bg-pink-900/30 dark:text-pink-100 dark:hover:bg-pink-900/50"
                />
              )}
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                {t('htmlCardGifExportTool')}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('htmlCardGifExportDescription')}
              </p>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-pink-100/70 bg-pink-50/60 p-4 text-sm text-pink-700 shadow-inner dark:border-pink-500/30 dark:bg-pink-900/20 dark:text-pink-100 md:flex-row md:items-start md:gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-pink-500 shadow-sm dark:bg-white/10 dark:text-pink-200">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold">{t('htmlCardGifExportTipTitle')}</p>
                <p className="text-xs leading-relaxed text-pink-600/80 dark:text-pink-100/80">
                  {t('htmlCardGifExportTipDescription')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
            <Card className="border border-pink-100/70 bg-white/90 shadow-xl shadow-pink-900/10 dark:border-pink-500/30 dark:bg-slate-900/70">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                      {t('htmlString')}
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                      {t('htmlStringPlaceholder')}
                    </CardDescription>
                  </div>
                  {cardInfo.length > 0 && (
                    <Badge className="rounded-full bg-pink-100/80 text-pink-600 dark:bg-pink-900/40 dark:text-pink-100">
                      {t('discoveredCards')} · {cardInfo.length}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <Textarea
                  id="html-input"
                  placeholder={t('htmlStringPlaceholder')}
                  value={htmlString}
                  onChange={(e) => setHtmlString(e.target.value)}
                  rows={10}
                  className="min-h-[220px] rounded-2xl border border-pink-100/60 bg-white/80 p-4 font-mono text-sm text-slate-700 shadow-inner placeholder:text-pink-300 focus-visible:ring-2 focus-visible:ring-pink-200 dark:border-pink-500/30 dark:bg-slate-900/60 dark:text-slate-100"
                />

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t('gifOutputDirectory')}
                  </Label>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Button
                      variant="outline"
                      onClick={handleSelectOutputDir}
                      className="inline-flex w-full items-center gap-2 rounded-2xl border-pink-100/70 bg-white/90 px-4 py-2 text-pink-600 hover:bg-pink-50 dark:border-pink-500/30 dark:bg-transparent dark:text-pink-200 sm:w-auto"
                    >
                      <FolderOpen className="h-4 w-4" />
                      {t('selectGifDirectory')}
                    </Button>
                    <div className="flex-1 rounded-2xl border border-dashed border-pink-200/70 bg-white/70 px-3 py-2 text-sm text-slate-500 dark:border-pink-500/30 dark:bg-slate-900/40 dark:text-slate-300">
                      {outputDir || t('selectGifDirectory')}
                    </div>
                  </div>
                </div>

                <Separator className="border-pink-100/60 dark:border-pink-500/30" />

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={handleAnalyzeCards}
                    disabled={!htmlString.trim() || isAnalyzing}
                    variant="outline"
                    className="inline-flex items-center gap-2 rounded-2xl border-pink-200/70 px-4 py-2 text-pink-600 hover:bg-pink-50 dark:border-pink-500/40 dark:text-pink-100"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    {isAnalyzing ? t('analyzing') : t('analyzeCards')}
                  </Button>
                  <Button
                    onClick={handleExportAll}
                    disabled={!htmlString.trim() || cardInfo.length === 0 || isExporting}
                    className="flex-1 rounded-2xl bg-pink-500/90 text-white shadow-lg shadow-pink-500/30 transition hover:bg-pink-500 disabled:bg-pink-400/60 sm:flex-none sm:px-6"
                  >
                    {isExporting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('exporting')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        {options.singleFrame ? t('exportAllPng') : t('exportAllGif')}
                      </span>
                    )}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-pink-700 dark:text-pink-100">
                  <Badge className="rounded-full bg-pink-100/80 px-3 py-1 text-pink-600 dark:bg-pink-900/40 dark:text-pink-100">
                    {options.singleFrame ? 'PNG' : 'GIF'}
                  </Badge>
                  <Badge className="rounded-full bg-pink-100/60 px-3 py-1 text-pink-700 dark:bg-pink-900/40 dark:text-pink-100">
                    {t('htmlGifQuality')} · {t(qualityLabelKey)}
                  </Badge>
                  {!options.singleFrame && (
                    <>
                      <Badge className="rounded-full bg-pink-100/60 px-3 py-1 text-pink-700 dark:bg-pink-900/40 dark:text-pink-100">
                        {t('htmlGifFrameRate')} · {options.frameRate} {t('frameRateUnit')}
                      </Badge>
                      <Badge className="rounded-full bg-pink-100/60 px-3 py-1 text-pink-700 dark:bg-pink-900/40 dark:text-pink-100">
                        {t('htmlGifDuration')} · {(options.duration || 8000) / 1000}
                        {t('durationUnit')}
                      </Badge>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border border-pink-100/70 bg-white/90 shadow-xl shadow-pink-900/10 dark:border-pink-500/30 dark:bg-slate-900/70">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100/70 text-pink-600 dark:bg-pink-900/40 dark:text-pink-100">
                      <Settings className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                        {t('exportSettings')}
                      </CardTitle>
                      <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                        {t('htmlCardGifExportDescription')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-2xl border border-pink-100/70 bg-white/80 p-4 dark:border-pink-500/30 dark:bg-slate-900/50">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-700 dark:text-white">
                        {t('singleFramePng')}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t('singleFramePngDescription')}
                      </p>
                    </div>
                    <Switch
                      id="single-frame"
                      checked={options.singleFrame || false}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, singleFrame: checked }))
                      }
                    />
                  </div>

                  {!options.singleFrame ? (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-pink-100/70 bg-white/80 p-4 dark:border-pink-500/30 dark:bg-slate-900/50">
                        <Label className="text-xs font-medium uppercase tracking-wide text-pink-600 dark:text-pink-200">
                          {t('htmlGifFrameRate')} · {options.frameRate} {t('frameRateUnit')}
                        </Label>
                        <Slider
                          className="mt-3"
                          value={[options.frameRate || 30]}
                          onValueChange={([value]) =>
                            setOptions((prev) => ({ ...prev, frameRate: value }))
                          }
                          min={10}
                          max={60}
                          step={5}
                        />
                      </div>
                      <div className="rounded-2xl border border-pink-100/70 bg-white/80 p-4 dark:border-pink-500/30 dark:bg-slate-900/50">
                        <Label className="text-xs font-medium uppercase tracking-wide text-pink-600 dark:text-pink-200">
                          {t('htmlGifDuration')} · {(options.duration || 8000) / 1000}
                          {t('durationUnit')}
                        </Label>
                        <Slider
                          className="mt-3"
                          value={[(options.duration || 8000) / 1000]}
                          onValueChange={([value]) =>
                            setOptions((prev) => ({ ...prev, duration: value * 1000 }))
                          }
                          min={3}
                          max={15}
                          step={1}
                        />
                      </div>
                      <div className="rounded-2xl border border-pink-100/70 bg-white/80 p-4 dark:border-pink-500/30 dark:bg-slate-900/50">
                        <Label className="text-xs font-medium uppercase tracking-wide text-pink-600 dark:text-pink-200">
                          {t('htmlGifQuality')}
                        </Label>
                        <Select
                          value={options.quality}
                          onValueChange={(value: 'high' | 'medium' | 'low') =>
                            setOptions((prev) => ({ ...prev, quality: value }))
                          }
                        >
                          <SelectTrigger className="mt-3 rounded-xl border-pink-100/70 dark:border-pink-500/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">{t('highQuality')}</SelectItem>
                            <SelectItem value="medium">{t('mediumQuality')}</SelectItem>
                            <SelectItem value="low">{t('lowQuality')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-pink-100/70 bg-white/80 p-4 dark:border-pink-500/30 dark:bg-slate-900/50">
                      <Label className="text-xs font-medium uppercase tracking-wide text-pink-600 dark:text-pink-200">
                        {t('htmlGifQuality')}
                      </Label>
                      <Select
                        value={options.quality}
                        onValueChange={(value: 'high' | 'medium' | 'low') =>
                          setOptions((prev) => ({ ...prev, quality: value }))
                        }
                      >
                        <SelectTrigger className="mt-3 rounded-xl border-pink-100/70 dark:border-pink-500/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">{t('highQuality')}</SelectItem>
                          <SelectItem value="medium">{t('mediumQuality')}</SelectItem>
                          <SelectItem value="low">{t('lowQuality')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-pink-100/70 bg-white/90 shadow-xl shadow-pink-900/10 dark:border-pink-500/30 dark:bg-slate-900/70">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                    {t('exportProgress')}
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                    {progressMessage ||
                      (cardInfo.length > 0
                        ? `${cardInfo.length} ${t('discoveredCards')}`
                        : t('pleaseAnalyzeCards'))}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-pink-100/70 bg-white/80 p-3 dark:border-pink-500/30 dark:bg-slate-900/50">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {t('discoveredCards')}
                      </p>
                      <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                        {cardInfo.length}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-pink-100/70 bg-white/80 p-3 dark:border-pink-500/30 dark:bg-slate-900/50">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {t('htmlGifQuality')}
                      </p>
                      <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                        {t(qualityLabelKey)}
                      </p>
                    </div>
                  </div>

                  <Separator className="border-pink-100/60 dark:border-pink-500/30" />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                      <span>{isExporting ? t('exporting') : t('analyzeCards')}</span>
                      <span>
                        {isExporting ? `${exportProgress}%` : options.singleFrame ? 'PNG' : 'GIF'}
                      </span>
                    </div>
                    <Progress
                      value={isExporting ? exportProgress : cardInfo.length > 0 ? 100 : 0}
                      className="h-2"
                    />
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {progressMessage ||
                        (cardInfo.length > 0
                          ? `${cardInfo.length} ${t('discoveredCards')}`
                          : t('pleaseEnterHtml'))}
                    </div>
                    {totalCards > 0 && (
                      <div className="text-xs text-pink-600 dark:text-pink-200">
                        {currentCard > 0
                          ? t('processingCard', { current: currentCard, total: totalCards })
                          : t('totalCards', { total: totalCards })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {cardInfo.length > 0 && (
            <Card className="border border-pink-100/70 bg-white/90 shadow-xl shadow-pink-900/10 dark:border-pink-500/30 dark:bg-slate-900/70">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                    {t('discoveredCards')}
                  </CardTitle>
                  <Badge className="rounded-full bg-pink-100/80 text-pink-600 dark:bg-pink-900/40 dark:text-pink-100">
                    {cardInfo.length}
                  </Badge>
                </div>
                <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                  {t('singleFramePngDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {cardInfo.map((card, index) => (
                    <div
                      key={index}
                      className={`flex flex-col rounded-2xl border border-pink-100/70 bg-white/90 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-pink-500/30 dark:bg-slate-900/70 ${
                        selectedCardIndex === index ? 'border-pink-400/70 shadow-pink-500/30' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <Badge className="rounded-full bg-pink-100/80 px-2 py-0.5 text-pink-600 dark:bg-pink-900/40 dark:text-pink-100">
                          #{index + 1}
                        </Badge>
                        <span>
                          {card.boundingBox.width} × {card.boundingBox.height}
                        </span>
                      </div>
                      <div
                        className="mt-3 line-clamp-1 text-sm font-semibold text-slate-900 dark:text-white"
                        title={card.title}
                      >
                        {card.title || t('htmlCardGifExportTool')}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportSingle(index)}
                        disabled={isExporting}
                        className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border-pink-200/70 text-pink-600 hover:bg-pink-50 dark:border-pink-500/40 dark:text-pink-100"
                      >
                        {selectedCardIndex === index && isExporting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t('exporting')}
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            {options.singleFrame ? t('exportSinglePng') : t('exportSingleGif')}
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  )
}
