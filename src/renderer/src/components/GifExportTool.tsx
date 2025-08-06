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
import { FolderOpen, Download, Eye, Settings, FileImage } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { GifExportOptions, CardInfo } from '../../../shared/types'

interface GifExportToolProps {
  className?: string
}

export function GifExportTool({ className }: GifExportToolProps): JSX.Element {
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
    singleFrame: false
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
      if (dir) {
        setOutputDir(dir)
        setOptions((prev) => ({ ...prev, outputDir: dir }))
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
      const cards = await window.gifExport.getCardInfo(htmlString)
      setCardInfo(cards)
      console.log('发现卡片:', cards)
    } catch (error) {
      console.error('分析卡片失败:', error)
      alert(t('analyzeCardsFailed'))
    } finally {
      setIsAnalyzing(false)
    }
  }, [htmlString, t])

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
      const outputPaths = await window.gifExport.exportAll(htmlString, options)

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
  }, [htmlString, cardInfo, options, t])

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
        const outputPath = await window.gifExport.exportSingle(htmlString, cardIndex, options)
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
    [htmlString, options, t]
  )

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            {t('htmlCardGifExportTool')}
          </CardTitle>
          <CardDescription>{t('htmlCardGifExportDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* HTML 输入区域 */}
          <div className="space-y-2">
            <Label htmlFor="html-input">{t('htmlString')}</Label>
            <Textarea
              id="html-input"
              placeholder={t('htmlStringPlaceholder')}
              value={htmlString}
              onChange={(e) => setHtmlString(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          {/* 输出目录选择 */}
          <div className="space-y-2">
            <Label>{t('gifOutputDirectory')}</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSelectOutputDir}
                className="flex items-center gap-2"
              >
                <FolderOpen className="h-4 w-4" />
                {t('selectGifDirectory')}
              </Button>
              {outputDir && (
                <div className="flex-1 px-3 py-2 bg-muted rounded-md text-sm">{outputDir}</div>
              )}
            </div>
          </div>

          {/* 导出设置 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <Label>{t('exportSettings')}</Label>
            </div>

            {/* 单帧选项 */}
            <div className="flex items-center space-x-2">
              <Switch
                id="single-frame"
                checked={options.singleFrame || false}
                onCheckedChange={(checked) =>
                  setOptions((prev) => ({ ...prev, singleFrame: checked }))
                }
              />
              <Label htmlFor="single-frame" className="text-sm font-medium">
                {t('singleFramePng')} {options.singleFrame && t('singleFramePngDescription')}
              </Label>
            </div>

            {!options.singleFrame && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 帧率设置 */}
                <div className="space-y-2">
                  <Label>
                    {t('htmlGifFrameRate')}: {options.frameRate} {t('frameRateUnit')}
                  </Label>
                  <Slider
                    value={[options.frameRate || 30]}
                    onValueChange={([value]) =>
                      setOptions((prev) => ({ ...prev, frameRate: value }))
                    }
                    min={10}
                    max={60}
                    step={5}
                  />
                </div>

                {/* 持续时间设置 */}
                <div className="space-y-2">
                  <Label>
                    {t('htmlGifDuration')}: {(options.duration || 8000) / 1000}
                    {t('durationUnit')}
                  </Label>
                  <Slider
                    value={[(options.duration || 8000) / 1000]}
                    onValueChange={([value]) =>
                      setOptions((prev) => ({ ...prev, duration: value * 1000 }))
                    }
                    min={3}
                    max={15}
                    step={1}
                  />
                </div>

                {/* 质量设置 */}
                <div className="space-y-2">
                  <Label>{t('htmlGifQuality')}</Label>
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
                </div>
              </div>
            )}

            {options.singleFrame && (
              <div className="grid grid-cols-1 gap-4">
                {/* 质量设置 */}
                <div className="space-y-2">
                  <Label>{t('htmlGifQuality')}</Label>
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
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button
              onClick={handleAnalyzeCards}
              disabled={!htmlString.trim() || isAnalyzing}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {isAnalyzing ? t('analyzing') : t('analyzeCards')}
            </Button>

            <Button
              onClick={handleExportAll}
              disabled={!htmlString.trim() || cardInfo.length === 0 || isExporting}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isExporting
                ? t('exporting')
                : options.singleFrame
                  ? t('exportAllPng')
                  : t('exportAllGif')}
            </Button>
          </div>

          {/* 导出进度 */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('exportProgress')}</span>
                <span>{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="w-full" />
              {progressMessage && (
                <div className="text-sm text-gray-600 dark:text-gray-400">{progressMessage}</div>
              )}
              {totalCards > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {currentCard > 0
                    ? t('processingCard', { current: currentCard, total: totalCards })
                    : t('totalCards', { total: totalCards })}
                </div>
              )}
            </div>
          )}

          {/* 卡片列表 */}
          {cardInfo.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label>
                  {t('discoveredCards')} ({cardInfo.length})
                </Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {cardInfo.map((card, index) => (
                  <Card key={index} className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">#{index + 1}</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExportSingle(index)}
                          disabled={isExporting}
                          className="h-6 px-2 text-xs"
                        >
                          {selectedCardIndex === index
                            ? t('exporting')
                            : options.singleFrame
                              ? t('exportSinglePng')
                              : t('exportSingleGif')}
                        </Button>
                      </div>
                      <div className="text-sm font-medium truncate" title={card.title}>
                        {card.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {card.boundingBox.width} × {card.boundingBox.height}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
