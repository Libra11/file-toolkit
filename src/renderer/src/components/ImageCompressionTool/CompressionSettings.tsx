import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Field } from '@renderer/components/ui/panel'
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
import { Input } from '@renderer/components/ui/input'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { ImageFormat, ImageQualityPreset, WebpPreset, ImageInfo } from './types'
import { IMAGE_FORMATS, IMAGE_QUALITY_PRESETS, WEBP_PRESETS } from './types'

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
  isBatchMode?: boolean
  enableBatchResize?: boolean
  onEnableBatchResizeChange?: (value: boolean) => void
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
  isBatchMode = false,
  enableBatchResize = false,
  onEnableBatchResizeChange,
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
  const usesCompressionLevel = outputFormat === IMAGE_FORMATS.PNG

  return (
    <div className="space-y-5">
      <section className="space-y-3" aria-label={t('compressionSettings')}>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {t('compressionSettings')}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <Field label={t('qualityPreset')}>
            <Select
              value={qualityPreset}
              onValueChange={(value) => onQualityPresetChange(value as ImageQualityPreset)}
            >
              <SelectTrigger id="image-quality-preset" aria-label={t('qualityPreset')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={IMAGE_QUALITY_PRESETS.HIGH}>{t('high')}</SelectItem>
                <SelectItem value={IMAGE_QUALITY_PRESETS.MEDIUM}>{t('medium')}</SelectItem>
                <SelectItem value={IMAGE_QUALITY_PRESETS.LOW}>{t('low')}</SelectItem>
                <SelectItem value={IMAGE_QUALITY_PRESETS.CUSTOM}>{t('custom')}</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label={t('outputFormat')}>
            <Select
              value={outputFormat}
              onValueChange={(value) => onFormatChange(value as ImageFormat)}
            >
              <SelectTrigger id="image-output-format" aria-label={t('outputFormat')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="original">{t('original')}</SelectItem>
                <SelectItem value={IMAGE_FORMATS.JPG}>JPG</SelectItem>
                <SelectItem value={IMAGE_FORMATS.PNG}>PNG</SelectItem>
                <SelectItem value={IMAGE_FORMATS.WEBP}>WebP</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </section>

      {outputFormat === IMAGE_FORMATS.WEBP && (
        <section className="space-y-3 border-t border-border pt-4" aria-label={t('webpOptions')}>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t('webpOptions')}
          </h3>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="image-webp-lossless" className="text-xs font-medium">
              {t('lossless')}
            </Label>
            <Switch
              id="image-webp-lossless"
              checked={webpLossless}
              onCheckedChange={onWebpLosslessChange}
            />
          </div>
          {!webpLossless && (
            <Field label={t('preset')}>
              <Select
                value={webpPreset}
                onValueChange={(value) => onWebpPresetChange(value as WebpPreset)}
              >
                <SelectTrigger id="image-webp-preset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={WEBP_PRESETS.DEFAULT}>{t('default')}</SelectItem>
                  <SelectItem value={WEBP_PRESETS.PHOTO}>{t('photo')}</SelectItem>
                  <SelectItem value={WEBP_PRESETS.PICTURE}>{t('picture')}</SelectItem>
                  <SelectItem value={WEBP_PRESETS.DRAWING}>{t('drawing')}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
        </section>
      )}

      <button
        type="button"
        className="flex w-full items-center justify-between border-y border-border py-2.5 text-xs font-medium text-foreground transition-colors hover:text-primary"
        onClick={() => onShowAdvancedChange(!showAdvanced)}
        aria-expanded={showAdvanced}
      >
        <span>{t('advancedOptions')}</span>
        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {showAdvanced && (
        <div className="space-y-5">
          <Field
            label={usesCompressionLevel ? t('compressionLevel') : t('quality')}
            hint={usesCompressionLevel ? compressionLevel : `${qualityValue}%`}
          >
            <Slider
              id="image-quality-slider"
              min={usesCompressionLevel ? 0 : 1}
              max={usesCompressionLevel ? 9 : 100}
              step={1}
              value={[usesCompressionLevel ? compressionLevel : qualityValue]}
              onValueChange={(value) => {
                if (usesCompressionLevel) onCompressionLevelChange(value[0])
                else onQualityChange(value[0])
              }}
            />
          </Field>

          {isBatchMode && (
            <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
              <Label htmlFor="image-enable-batch-resize" className="text-xs leading-relaxed">
                {t('batchResizeToSameDimensionsLabel')}
              </Label>
              <Switch
                id="image-enable-batch-resize"
                checked={enableBatchResize}
                onCheckedChange={(checked) => onEnableBatchResizeChange?.(checked)}
              />
            </div>
          )}

          {(!isBatchMode || enableBatchResize) && (
            <section className="space-y-3 border-t border-border pt-4" aria-label={t('dimensions')}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {t('dimensions')}
                </h3>
                {imageInfo.width && imageInfo.height && (
                  <span className="text-[11px] text-muted-foreground">
                    {t('original')}: {imageInfo.width} × {imageInfo.height}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('width')}>
                  <Input
                    id="image-width"
                    type="number"
                    min={1}
                    placeholder={imageInfo.width?.toString() || ''}
                    value={outputWidth}
                    onChange={(event) => {
                      const newWidth = event.target.value === '' ? '' : Number(event.target.value)
                      onWidthChange(newWidth)
                      if (
                        maintainAspectRatio &&
                        newWidth !== '' &&
                        imageInfo.width &&
                        imageInfo.height
                      ) {
                        onHeightChange(Math.round(newWidth / (imageInfo.width / imageInfo.height)))
                      }
                    }}
                  />
                </Field>
                <Field label={t('height')}>
                  <Input
                    id="image-height"
                    type="number"
                    min={1}
                    placeholder={imageInfo.height?.toString() || ''}
                    value={outputHeight}
                    onChange={(event) => {
                      const newHeight = event.target.value === '' ? '' : Number(event.target.value)
                      onHeightChange(newHeight)
                      if (
                        maintainAspectRatio &&
                        newHeight !== '' &&
                        imageInfo.width &&
                        imageInfo.height
                      ) {
                        onWidthChange(Math.round(newHeight * (imageInfo.width / imageInfo.height)))
                      }
                    }}
                  />
                </Field>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="image-maintain-aspect"
                  checked={maintainAspectRatio}
                  onCheckedChange={(checked) => onMaintainAspectRatioChange(checked === true)}
                />
                <Label htmlFor="image-maintain-aspect" className="text-xs text-muted-foreground">
                  {t('maintainAspectRatio')}
                </Label>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
