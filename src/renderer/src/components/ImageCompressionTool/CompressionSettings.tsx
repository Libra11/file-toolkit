import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Label } from '@renderer/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Slider } from '@renderer/components/ui/slider'
import { Switch } from '@renderer/components/ui/switch'
import { ImageFormat, ImageQualityPreset, WebpPreset, ImageInfo } from './types'
import { IMAGE_FORMATS, IMAGE_QUALITY_PRESETS, WEBP_PRESETS } from './types'
import { getQualityConfig } from './utils'

interface CompressionSettingsProps {
  qualityPreset: ImageQualityPreset
  outputFormat: ImageFormat
  qualityValue: number
  compressionLevel: number
  outputWidth: number | ''
  outputHeight: number | ''
  maintainAspectRatio: boolean
  webpPreset: WebpPreset
  webpLossless: boolean
  showAdvanced: boolean
  imageInfo: ImageInfo
  onQualityPresetChange: (value: ImageQualityPreset) => void
  onFormatChange: (value: ImageFormat) => void
  onQualityChange: (value: number) => void
  onCompressionLevelChange: (value: number) => void
  onWidthChange: (value: number | '') => void
  onHeightChange: (value: number | '') => void
  onMaintainAspectRatioChange: (value: boolean) => void
  onWebpPresetChange: (value: WebpPreset) => void
  onWebpLosslessChange: (value: boolean) => void
  onShowAdvancedChange: (value: boolean) => void
}

export function CompressionSettings({
  qualityPreset,
  outputFormat,
  qualityValue,
  compressionLevel,
  outputWidth,
  outputHeight,
  maintainAspectRatio,
  webpPreset,
  webpLossless,
  showAdvanced,
  imageInfo,
  onQualityPresetChange,
  onFormatChange,
  onQualityChange,
  onCompressionLevelChange,
  onWidthChange,
  onHeightChange,
  onMaintainAspectRatioChange,
  onWebpPresetChange,
  onWebpLosslessChange,
  onShowAdvancedChange
}: CompressionSettingsProps): JSX.Element {
  const { t } = useTranslation()

  // 获取当前质量显示文本
  const getQualityText = (): string => {
    if (outputFormat === IMAGE_FORMATS.PNG) {
      const qualityPercent = Math.round(((9 - compressionLevel) * 100) / 9)
      return `${compressionLevel} (${qualityPercent}%)`
    } else {
      return `${qualityValue}%`
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="quality-preset" className="text-sm font-medium">
          {t('qualityPreset')}
        </Label>
        <Select value={qualityPreset} onValueChange={onQualityPresetChange}>
          <SelectTrigger id="quality-preset" className="w-full mt-1">
            <SelectValue placeholder={t('selectPreset')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={IMAGE_QUALITY_PRESETS.HIGH}>{t('high')}</SelectItem>
            <SelectItem value={IMAGE_QUALITY_PRESETS.MEDIUM}>{t('medium')}</SelectItem>
            <SelectItem value={IMAGE_QUALITY_PRESETS.LOW}>{t('low')}</SelectItem>
            <SelectItem value={IMAGE_QUALITY_PRESETS.CUSTOM}>{t('custom')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="output-format" className="text-sm font-medium">
          {t('outputFormat')}
        </Label>
        <Select value={outputFormat} onValueChange={onFormatChange}>
          <SelectTrigger id="output-format" className="w-full mt-1">
            <SelectValue placeholder={t('original')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="original">{t('original')}</SelectItem>
            <SelectItem value={IMAGE_FORMATS.JPG}>JPEG</SelectItem>
            <SelectItem value={IMAGE_FORMATS.PNG}>PNG</SelectItem>
            <SelectItem value={IMAGE_FORMATS.WEBP}>WebP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {qualityPreset === IMAGE_QUALITY_PRESETS.CUSTOM && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="quality-slider" className="text-sm font-medium">
              {outputFormat === IMAGE_FORMATS.PNG ? t('compressionLevel') : t('quality')}
            </Label>
            <span className="text-sm text-slate-500 dark:text-slate-400">{getQualityText()}</span>
          </div>
          <Slider
            id="quality-slider"
            min={getQualityConfig(outputFormat).min}
            max={getQualityConfig(outputFormat).max}
            step={getQualityConfig(outputFormat).step}
            value={[outputFormat === IMAGE_FORMATS.PNG ? compressionLevel : qualityValue]}
            onValueChange={(values) =>
              outputFormat === IMAGE_FORMATS.PNG
                ? onCompressionLevelChange(values[0])
                : onQualityChange(values[0])
            }
            className="w-full"
          />
        </div>
      )}

      <button
        className="flex items-center text-sm text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        onClick={() => onShowAdvancedChange(!showAdvanced)}
      >
        {showAdvanced ? (
          <ChevronUp className="h-4 w-4 mr-1" />
        ) : (
          <ChevronDown className="h-4 w-4 mr-1" />
        )}
        {t('advancedOptions')}
      </button>

      {showAdvanced && (
        <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-4 mt-2">
          <div>
            <Label htmlFor="dimensions" className="text-sm font-medium mb-2 block">
              {t('dimensions')}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="width" className="text-xs text-slate-500 dark:text-slate-400">
                  {t('width')}
                </Label>
                <input
                  id="width"
                  type="number"
                  value={outputWidth === '' ? '' : outputWidth}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : Number(e.target.value)
                    onWidthChange(value)
                    if (
                      maintainAspectRatio &&
                      value !== '' &&
                      imageInfo.width &&
                      imageInfo.height
                    ) {
                      const ratio = imageInfo.width / imageInfo.height
                      onHeightChange(Math.round(Number(value) / ratio))
                    }
                  }}
                  min="1"
                  placeholder={imageInfo.width?.toString()}
                  className="w-full mt-1 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <Label htmlFor="height" className="text-xs text-slate-500 dark:text-slate-400">
                  {t('height')}
                </Label>
                <input
                  id="height"
                  type="number"
                  value={outputHeight === '' ? '' : outputHeight}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : Number(e.target.value)
                    onHeightChange(value)
                    if (
                      maintainAspectRatio &&
                      value !== '' &&
                      imageInfo.width &&
                      imageInfo.height
                    ) {
                      const ratio = imageInfo.width / imageInfo.height
                      onWidthChange(Math.round(Number(value) * ratio))
                    }
                  }}
                  min="1"
                  placeholder={imageInfo.height?.toString()}
                  className="w-full mt-1 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <Switch
                id="aspect-ratio"
                checked={maintainAspectRatio}
                onCheckedChange={onMaintainAspectRatioChange}
              />
              <Label
                htmlFor="aspect-ratio"
                className="text-xs ml-2 text-slate-600 dark:text-slate-400"
              >
                {t('maintainAspectRatio')}
              </Label>
            </div>
          </div>

          {outputFormat === IMAGE_FORMATS.WEBP && (
            <div className="space-y-3">
              <Label className="text-sm font-medium mb-2 block">{t('webpOptions')}</Label>
              <div className="flex items-center">
                <Switch
                  id="lossless"
                  checked={webpLossless}
                  onCheckedChange={onWebpLosslessChange}
                />
                <Label
                  htmlFor="lossless"
                  className="text-xs ml-2 text-slate-600 dark:text-slate-400"
                >
                  {t('lossless')}
                </Label>
              </div>

              <div>
                <Label
                  htmlFor="webp-preset"
                  className="text-xs text-slate-500 dark:text-slate-400 mb-1 block"
                >
                  {t('preset')}
                </Label>
                <Select value={webpPreset} onValueChange={onWebpPresetChange}>
                  <SelectTrigger id="webp-preset" className="w-full text-sm h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={WEBP_PRESETS.DEFAULT}>{t('default')}</SelectItem>
                    <SelectItem value={WEBP_PRESETS.PHOTO}>{t('photo')}</SelectItem>
                    <SelectItem value={WEBP_PRESETS.PICTURE}>{t('picture')}</SelectItem>
                    <SelectItem value={WEBP_PRESETS.DRAWING}>{t('drawing')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
