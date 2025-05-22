/**
 * Author: Libra
 * Date: 2024-10-07 12:12:42
 * LastEditors: Libra
 * Description: 图片压缩设置组件
 */
import { useTranslation } from 'react-i18next'
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
import { Input } from '@renderer/components/ui/input'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Button } from '@renderer/components/ui/button'
// import { useState } from 'react' // No longer used here

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
  enableBatchResize?: boolean // New prop
  onEnableBatchResizeChange?: (value: boolean) => void // New prop
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
  enableBatchResize = false, // Default value for the new prop
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
  // const [enableBatchResize, setEnableBatchResize] = useState(false) // Removed internal state

  // 创建组件
  return (
    <div className="space-y-4">
      {/* 基本设置部分 */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="quality-preset" className="text-sm">
            {t('qualityPreset')}
          </Label>
          <Select
            value={qualityPreset}
            onValueChange={(value) => onQualityPresetChange(value as ImageQualityPreset)}
          >
            <SelectTrigger id="quality-preset">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={IMAGE_QUALITY_PRESETS.HIGH}>{t('high')}</SelectItem>
              <SelectItem value={IMAGE_QUALITY_PRESETS.MEDIUM}>{t('medium')}</SelectItem>
              <SelectItem value={IMAGE_QUALITY_PRESETS.LOW}>{t('low')}</SelectItem>
              <SelectItem value={IMAGE_QUALITY_PRESETS.CUSTOM}>{t('custom')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="output-format" className="text-sm">
            {t('outputFormat')}
          </Label>
          <Select
            value={outputFormat}
            onValueChange={(value) => onFormatChange(value as ImageFormat)}
          >
            <SelectTrigger id="output-format">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={'original'}>{t('original')}</SelectItem>
              <SelectItem value={IMAGE_FORMATS.JPG}>JPG</SelectItem>
              <SelectItem value={IMAGE_FORMATS.PNG}>PNG</SelectItem>
              <SelectItem value={IMAGE_FORMATS.WEBP}>WebP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* WebP 高级选项 */}
        {outputFormat === IMAGE_FORMATS.WEBP && (
          <div className="space-y-2">
            <Label className="text-sm">{t('webpOptions')}</Label>
            <div className="flex items-center justify-between">
              <Label htmlFor="webp-lossless" className="text-xs text-slate-500">
                {t('lossless')}
              </Label>
              <Switch
                id="webp-lossless"
                checked={webpLossless}
                onCheckedChange={onWebpLosslessChange}
              />
            </div>
            {!webpLossless && (
              <div className="space-y-1.5">
                <Label htmlFor="webp-preset" className="text-xs text-slate-500">
                  {t('preset')}
                </Label>
                <Select
                  value={webpPreset}
                  onValueChange={(value) => onWebpPresetChange(value as WebpPreset)}
                >
                  <SelectTrigger id="webp-preset">
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
            )}
          </div>
        )}

        <Button
          variant="link"
          className="text-xs h-auto p-0 mt-1"
          onClick={() => onShowAdvancedChange(!showAdvanced)}
        >
          {showAdvanced ? '- ' : '+ '}
          {t('advancedOptions')}
        </Button>
      </div>

      {/* 高级选项部分 */}
      {showAdvanced && (
        <div className="mt-6 space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label htmlFor="quality-slider" className="text-sm">
                {outputFormat === IMAGE_FORMATS.PNG ? t('compressionLevel') : t('quality')}
              </Label>
              <span className="text-xs text-slate-500">
                {outputFormat === IMAGE_FORMATS.PNG ? compressionLevel : qualityValue}
              </span>
            </div>

            <Slider
              id="quality-slider"
              min={outputFormat === IMAGE_FORMATS.PNG ? 0 : 1}
              max={outputFormat === IMAGE_FORMATS.PNG ? 9 : 100}
              step={1}
              value={[outputFormat === IMAGE_FORMATS.PNG ? compressionLevel : qualityValue]}
              onValueChange={(value) => {
                outputFormat === IMAGE_FORMATS.PNG
                  ? onCompressionLevelChange(value[0])
                  : onQualityChange(value[0])
              }}
            />
          </div>

          {/* 批量模式下的尺寸统一设置 */}
          {isBatchMode && (
            <div className="flex items-center space-x-2 mt-4">
              <Checkbox
                id="enable-batch-resize"
                checked={enableBatchResize}
                onCheckedChange={(checked) => {
                  if (onEnableBatchResizeChange) {
                    onEnableBatchResizeChange(checked === true)
                  }
                }}
              />
              <Label
                htmlFor="enable-batch-resize"
                className="text-sm cursor-pointer"
              >
                {t('imageCompression.batchResizeToSameDimensionsLabel')}
              </Label>
            </div>
          )}

          {/* 尺寸设置 */}
          {(!isBatchMode || (isBatchMode && enableBatchResize)) && (
            <div className="space-y-3">
              <Label className="text-sm">{t('dimensions')}</Label>

              <div className="flex space-x-3">
                <div className="space-y-1.5 flex-1">
                  <Label htmlFor="width" className="text-xs text-slate-500">
                    {t('width')}
                  </Label>
                  <Input
                    id="width"
                    type="number"
                    placeholder={imageInfo.width?.toString() || ''}
                    value={outputWidth}
                    onChange={(e) => {
                      const newWidth = e.target.value === '' ? '' : Number(e.target.value)
                      onWidthChange(newWidth)
                      if (
                        maintainAspectRatio &&
                        newWidth !== '' &&
                        imageInfo.width &&
                        imageInfo.height
                      ) {
                        const aspectRatio = imageInfo.width / imageInfo.height
                        onHeightChange(Math.round(Number(newWidth) / aspectRatio))
                      }
                    }}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5 flex-1">
                  <Label htmlFor="height" className="text-xs text-slate-500">
                    {t('height')}
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder={imageInfo.height?.toString() || ''}
                    value={outputHeight}
                    onChange={(e) => {
                      const newHeight = e.target.value === '' ? '' : Number(e.target.value)
                      onHeightChange(newHeight)
                      if (
                        maintainAspectRatio &&
                        newHeight !== '' &&
                        imageInfo.width &&
                        imageInfo.height
                      ) {
                        const aspectRatio = imageInfo.width / imageInfo.height
                        onWidthChange(Math.round(Number(newHeight) * aspectRatio))
                      }
                    }}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 mt-1">
                <Checkbox
                  id="maintain-aspect"
                  checked={maintainAspectRatio}
                  onCheckedChange={(checked) => {
                    onMaintainAspectRatioChange(checked === true)
                  }}
                />
                <Label
                  htmlFor="maintain-aspect"
                  className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer"
                >
                  {t('maintainAspectRatio')}
                </Label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
