import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Download,
  Eye,
  FileImage,
  Film,
  FolderOpen,
  Loader2,
  ScanSearch,
  Settings2
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Slider } from './ui/slider'
import { Panel, PanelBody, PanelHeader, Field, DataRow } from './ui/panel'
import { SegmentedControl } from './ui/segmented-control'
import { EmptyState, Notice, StatusDot } from './ui/states'
import { cn } from '@renderer/lib/utils'
import type { GifExportOptions, CardInfo } from '../../../shared/types'

interface GifExportToolProps {
  className?: string
  onBack?: () => void
}

interface GifExportProgress {
  type?: 'analyzing' | 'exporting' | 'capturing' | 'completed' | 'error'
  message?: string
  cardCount?: number
  totalCards?: number
  currentCard?: number
  frameProgress?: number
}

function fileNameFromPath(filePath: string): string {
  return filePath.split(/[\\/]/).pop() || filePath
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
  const [exportedFiles, setExportedFiles] = useState<string[]>([])
  const [operationError, setOperationError] = useState('')
  const [options, setOptions] = useState<GifExportOptions>({
    frameRate: 30,
    duration: 8000,
    quality: 'high',
    singleFrame: false,
    outputDir: ''
  })

  // The host still owns navigation; keep accepting onBack without rendering legacy navigation.
  void onBack

  useEffect(() => {
    const handleProgress = (progress: GifExportProgress): void => {
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
          if (progress.currentCard && progress.totalCards) {
            setCurrentCard(progress.currentCard)
            setExportProgress(Math.round((progress.currentCard / progress.totalCards) * 100))
          }
          break
        case 'capturing':
          if (progress.frameProgress && totalCards > 0) {
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
          setOperationError(progress.message || t('exportFailed'))
          break
      }
    }

    window.gifExport.onProgress(handleProgress)
    return (): void => {
      window.gifExport.removeProgressListener()
    }
  }, [currentCard, totalCards, t])

  const handleSelectOutputDir = useCallback(async () => {
    try {
      const dir = await window.gifExport.selectOutputDir()
      if (dir) {
        setOutputDir(dir)
        setOptions((prev) => ({ ...prev, outputDir: dir }))
        setOperationError('')
      }
    } catch (error) {
      console.error('选择输出目录失败:', error)
      setOperationError(t('selectOutputDirFailed'))
    }
  }, [t])

  const handleAnalyzeCards = useCallback(async () => {
    if (!htmlString.trim()) {
      setOperationError(t('pleaseEnterHtml'))
      return
    }

    setIsAnalyzing(true)
    setOperationError('')
    setExportedFiles([])
    setExportProgress(0)
    setCurrentCard(0)
    setProgressMessage('')

    try {
      const cards = await window.gifExport.getCardInfo(htmlString, { ...options, outputDir })
      setCardInfo(cards)
      setTotalCards(cards.length)
    } catch (error) {
      console.error('分析卡片失败:', error)
      setOperationError(t('analyzeCardsFailed'))
    } finally {
      setIsAnalyzing(false)
    }
  }, [htmlString, options, outputDir, t])

  const handleExportAll = useCallback(async () => {
    if (!htmlString.trim()) {
      setOperationError(t('pleaseEnterHtml'))
      return
    }
    if (cardInfo.length === 0) {
      setOperationError(t('pleaseAnalyzeCards'))
      return
    }

    setIsExporting(true)
    setSelectedCardIndex(null)
    setExportedFiles([])
    setOperationError('')
    setExportProgress(0)
    setCurrentCard(0)
    setTotalCards(cardInfo.length)
    setProgressMessage(t('exportStarting'))

    try {
      const outputPaths = await window.gifExport.exportAll(htmlString, { ...options, outputDir })
      setExportedFiles(outputPaths)
      setExportProgress(100)
      setProgressMessage(
        t('exportCompleted', {
          count: outputPaths.length,
          type: options.singleFrame ? 'PNG' : 'GIF'
        })
      )
    } catch (error) {
      console.error('导出失败:', error)
      setOperationError(t('exportFailed'))
      setExportProgress(0)
    } finally {
      setIsExporting(false)
    }
  }, [htmlString, cardInfo, options, outputDir, t])

  const handleExportSingle = useCallback(
    async (cardIndex: number) => {
      if (!htmlString.trim()) {
        setOperationError(t('pleaseEnterHtml'))
        return
      }

      setIsExporting(true)
      setSelectedCardIndex(cardIndex)
      setExportedFiles([])
      setOperationError('')
      setExportProgress(0)
      setCurrentCard(cardIndex + 1)
      setTotalCards(cardInfo.length)
      setProgressMessage(t('exportStarting'))

      try {
        const outputPath = await window.gifExport.exportSingle(htmlString, cardIndex, {
          ...options,
          outputDir
        })
        setExportedFiles([outputPath])
        setExportProgress(100)
        setProgressMessage(
          t('singleExportCompleted', { type: options.singleFrame ? 'PNG' : 'GIF' })
        )
      } catch (error) {
        console.error('单张导出失败:', error)
        setOperationError(t('singleExportFailed'))
      } finally {
        setIsExporting(false)
        setSelectedCardIndex(null)
      }
    },
    [htmlString, cardInfo.length, options, outputDir, t]
  )

  const qualityLabelKey =
    options.quality === 'high'
      ? 'highQuality'
      : options.quality === 'medium'
        ? 'mediumQuality'
        : 'lowQuality'
  const outputType = options.singleFrame ? 'PNG' : 'GIF'
  const visibleProgress = isExporting || exportedFiles.length > 0 ? exportProgress : 0

  return (
    <div className={cn('min-h-full bg-background text-foreground', className)}>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-end gap-3 px-4 py-2.5 text-xs text-muted-foreground md:px-6">
          <StatusDot tone={isExporting || isAnalyzing ? 'active' : 'neutral'} />
          <span>
            {cardInfo.length} {t('discoveredCards')}
          </span>
          <span className="border-l border-border pl-3 font-medium text-foreground">
            HTML / {outputType}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] space-y-5 p-4 md:p-6">
        {operationError && <Notice tone="error" title={t('error')} description={operationError} />}

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
          <Panel>
            <PanelHeader
              eyebrow="01"
              title={t('htmlString')}
              description={t('htmlCardGifExportTipDescription')}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyzeCards}
                  disabled={!htmlString.trim() || isAnalyzing || isExporting}
                >
                  {isAnalyzing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="mr-2 h-4 w-4" />
                  )}
                  {isAnalyzing ? t('analyzing') : t('analyzeCards')}
                </Button>
              }
            />
            <PanelBody className="space-y-4">
              <Textarea
                id="html-input"
                aria-label={t('htmlString')}
                placeholder={t('htmlStringPlaceholder')}
                value={htmlString}
                onChange={(event) => setHtmlString(event.target.value)}
                className="min-h-[360px] resize-y bg-background/50 font-mono text-xs leading-6"
                spellCheck={false}
              />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  {t('discoveredCards')} · {cardInfo.length}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  HTML · {htmlString.length}
                </p>
              </div>
            </PanelBody>
          </Panel>

          <div className="space-y-5">
            <Panel>
              <PanelHeader
                eyebrow="02"
                title={t('exportSettings')}
                description={t('singleFramePngDescription')}
                action={<Settings2 className="h-4 w-4 text-muted-foreground" />}
              />
              <PanelBody className="space-y-5">
                <Field label={t('vsFormat')} hint={outputType}>
                  <SegmentedControl
                    value={options.singleFrame ? 'png' : 'gif'}
                    onChange={(value) =>
                      setOptions((prev) => ({ ...prev, singleFrame: value === 'png' }))
                    }
                    options={[
                      { value: 'gif', label: 'GIF', icon: Film },
                      { value: 'png', label: 'PNG', icon: FileImage }
                    ]}
                    ariaLabel={t('vsFormat')}
                    className="grid w-full grid-cols-2"
                  />
                </Field>

                {!options.singleFrame && (
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    <Field
                      label={t('htmlGifFrameRate')}
                      hint={`${options.frameRate || 30} ${t('frameRateUnit')}`}
                    >
                      <Slider
                        value={[options.frameRate || 30]}
                        onValueChange={([value]) =>
                          setOptions((prev) => ({ ...prev, frameRate: value }))
                        }
                        min={10}
                        max={60}
                        step={5}
                        className="py-2"
                      />
                    </Field>
                    <Field
                      label={t('htmlGifDuration')}
                      hint={`${(options.duration || 8000) / 1000}${t('durationUnit')}`}
                    >
                      <Slider
                        value={[(options.duration || 8000) / 1000]}
                        onValueChange={([value]) =>
                          setOptions((prev) => ({ ...prev, duration: value * 1000 }))
                        }
                        min={3}
                        max={15}
                        step={1}
                        className="py-2"
                      />
                    </Field>
                  </div>
                )}

                <Field label={t('htmlGifQuality')} hint={t(qualityLabelKey)}>
                  <Select
                    value={options.quality}
                    onValueChange={(value: 'high' | 'medium' | 'low') =>
                      setOptions((prev) => ({ ...prev, quality: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">{t('highQuality')}</SelectItem>
                      <SelectItem value="medium">{t('mediumQuality')}</SelectItem>
                      <SelectItem value="low">{t('lowQuality')}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field label={t('gifOutputDirectory')}>
                  <div className="flex gap-2">
                    <Input
                      value={outputDir}
                      readOnly
                      placeholder={t('selectGifDirectory')}
                      className="min-w-0 bg-background/50 font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleSelectOutputDir}
                      title={t('selectGifDirectory')}
                      aria-label={t('selectGifDirectory')}
                    >
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                  </div>
                </Field>

                <Button
                  className="w-full"
                  onClick={handleExportAll}
                  disabled={
                    !htmlString.trim() || cardInfo.length === 0 || isExporting || isAnalyzing
                  }
                >
                  {isExporting && selectedCardIndex === null ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {isExporting && selectedCardIndex === null
                    ? t('exporting')
                    : options.singleFrame
                      ? t('exportAllPng')
                      : t('exportAllGif')}
                </Button>
              </PanelBody>
            </Panel>

            <Panel>
              <PanelHeader
                title={t('exportProgress')}
                action={
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <StatusDot
                      tone={
                        operationError
                          ? 'error'
                          : exportedFiles.length > 0
                            ? 'success'
                            : isExporting
                              ? 'active'
                              : 'neutral'
                      }
                    />
                    {isExporting ? t('exporting') : outputType}
                  </div>
                }
              />
              <PanelBody className="space-y-4" aria-live="polite">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">
                      {progressMessage ||
                        (cardInfo.length > 0
                          ? `${cardInfo.length} ${t('discoveredCards')}`
                          : t('pleaseAnalyzeCards'))}
                    </span>
                    <span className="shrink-0 font-mono font-medium text-foreground">
                      {visibleProgress}%
                    </span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-sm bg-muted"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={visibleProgress}
                  >
                    <div
                      className={cn(
                        'h-full bg-primary transition-[width]',
                        operationError && 'bg-destructive'
                      )}
                      style={{ width: `${Math.min(100, Math.max(0, visibleProgress))}%` }}
                    />
                  </div>
                </div>
                <dl className="divide-y divide-border border-y border-border">
                  <DataRow label={t('discoveredCards')} value={cardInfo.length} />
                  <DataRow label={t('htmlGifQuality')} value={t(qualityLabelKey)} />
                  {totalCards > 0 && (
                    <DataRow
                      label={t('exportProgress')}
                      value={
                        currentCard > 0
                          ? t('processingCard', { current: currentCard, total: totalCards })
                          : t('totalCards', { total: totalCards })
                      }
                    />
                  )}
                </dl>
                {exportedFiles.length > 0 && (
                  <Notice
                    tone="success"
                    title={t('exportCompleted', {
                      count: exportedFiles.length,
                      type: outputType
                    })}
                    description={outputDir || fileNameFromPath(exportedFiles[0])}
                  />
                )}
              </PanelBody>
            </Panel>
          </div>
        </div>

        <Panel>
          <PanelHeader
            eyebrow="03"
            title={t('discoveredCards')}
            description={t('htmlCardGifExportTipTitle')}
            action={
              <span className="font-mono text-xs text-muted-foreground">{cardInfo.length}</span>
            }
          />
          <PanelBody>
            {cardInfo.length === 0 ? (
              <EmptyState
                icon={ScanSearch}
                title={t('analyzeCards')}
                description={t('pleaseAnalyzeCards')}
              />
            ) : (
              <div className="space-y-5">
                {exportedFiles.length > 0 && (
                  <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border bg-muted/30 p-2">
                    {exportedFiles.map((filePath) => (
                      <div
                        key={filePath}
                        className="flex items-start gap-3 rounded-md bg-card px-3 py-2 text-xs"
                      >
                        <FileImage className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">
                            {fileNameFromPath(filePath)}
                          </p>
                          <p className="mt-0.5 break-all font-mono text-[11px] text-muted-foreground">
                            {filePath}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                  {cardInfo.map((card, index) => (
                    <article
                      key={`${card.index}-${index}`}
                      className={cn(
                        'rounded-lg border border-border bg-background/40 p-4',
                        selectedCardIndex === index && 'border-primary/50'
                      )}
                    >
                      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span className="font-mono font-medium text-primary">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="font-mono">
                          {card.boundingBox.width} × {card.boundingBox.height}
                        </span>
                      </div>
                      <h3
                        className="mt-3 truncate text-sm font-medium text-foreground"
                        title={card.title}
                      >
                        {card.title || `${t('htmlCardGifExportTool')} ${index + 1}`}
                      </h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportSingle(index)}
                        disabled={isExporting || isAnalyzing}
                        className="mt-4 w-full"
                      >
                        {selectedCardIndex === index && isExporting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        {selectedCardIndex === index && isExporting
                          ? t('exporting')
                          : options.singleFrame
                            ? t('exportSinglePng')
                            : t('exportSingleGif')}
                      </Button>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </PanelBody>
        </Panel>
      </div>
    </div>
  )
}
