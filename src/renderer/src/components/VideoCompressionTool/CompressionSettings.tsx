/**
 * Author: Libra
 * Date: 2024-04-01
 * LastEditors: Libra
 * Description: 视频压缩设置组件
 */
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { ChevronDown, ChevronUp, Info } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Slider } from '@renderer/components/ui/slider'
import { Switch } from '@renderer/components/ui/switch'
import { Label } from '@renderer/components/ui/label'
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@renderer/components/ui/accordion'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@renderer/components/ui/tooltip'
import {
  VIDEO_FORMATS,
  VIDEO_ENCODERS,
  VIDEO_QUALITY_PRESETS,
  VideoEncoder,
  VideoQualityPreset,
  VideoFormat,
  VideoInfo
} from './types'

interface CompressionSettingsProps {
  qualityPreset: VideoQualityPreset
  outputFormat: VideoFormat
  encoder?: VideoEncoder
  crf?: number
  preset?: string
  width?: number | ''
  height?: number | ''
  fps?: number | ''
  maintainAspectRatio?: boolean
  showAdvanced?: boolean
  videoInfo?: VideoInfo
  isBatchMode?: boolean
  onQualityPresetChange: (value: VideoQualityPreset) => void
  onFormatChange: (value: VideoFormat) => void
  onEncoderChange?: (value: VideoEncoder) => void
  onCrfChange?: (value: number) => void
  onPresetChange?: (value: string) => void
  onWidthChange?: (value: number | '') => void
  onHeightChange?: (value: number | '') => void
  onFpsChange?: (value: number | '') => void
  onMaintainAspectRatioChange?: (value: boolean) => void
  onShowAdvancedChange?: (value: boolean) => void
}

export function CompressionSettings({
  qualityPreset,
  outputFormat,
  encoder = VIDEO_ENCODERS.H264,
  crf = 23,
  preset = 'medium',
  width = '',
  height = '',
  fps = '',
  maintainAspectRatio = true,
  showAdvanced = false,
  videoInfo = {},
  isBatchMode = false,
  onQualityPresetChange,
  onFormatChange,
  onEncoderChange,
  onCrfChange,
  onPresetChange,
  onWidthChange,
  onHeightChange,
  onFpsChange,
  onMaintainAspectRatioChange,
  onShowAdvancedChange
}: CompressionSettingsProps): JSX.Element {
  const { t } = useTranslation()
  const [accordionValue, setAccordionValue] = useState<string>('')

  // 处理宽度变化并保持宽高比
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newWidth = e.target.value === '' ? '' : parseInt(e.target.value)

    if (onWidthChange) {
      onWidthChange(newWidth)
    }

    // 如果保持宽高比且有原始宽高信息，则自动计算高度
    if (
      maintainAspectRatio &&
      onHeightChange &&
      newWidth !== '' &&
      videoInfo.width &&
      videoInfo.height
    ) {
      const aspectRatio = videoInfo.width / videoInfo.height
      const newHeight = Math.round((newWidth as number) / aspectRatio)
      onHeightChange(newHeight)
    }
  }

  // 处理高度变化并保持宽高比
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newHeight = e.target.value === '' ? '' : parseInt(e.target.value)

    if (onHeightChange) {
      onHeightChange(newHeight)
    }

    // 如果保持宽高比且有原始宽高信息，则自动计算宽度
    if (
      maintainAspectRatio &&
      onWidthChange &&
      newHeight !== '' &&
      videoInfo.width &&
      videoInfo.height
    ) {
      const aspectRatio = videoInfo.width / videoInfo.height
      const newWidth = Math.round((newHeight as number) * aspectRatio)
      onWidthChange(newWidth)
    }
  }

  // 处理CRF值改变
  const handleCrfChange = (value: number[]): void => {
    if (onCrfChange) {
      onCrfChange(value[0])
    }

    // 如果CRF值改变，自动切换到自定义模式
    if (qualityPreset !== VIDEO_QUALITY_PRESETS.CUSTOM) {
      onQualityPresetChange(VIDEO_QUALITY_PRESETS.CUSTOM)
    }
  }

  // 切换显示高级选项
  const handleToggleAdvanced = (): void => {
    if (onShowAdvancedChange) {
      onShowAdvancedChange(!showAdvanced)
    }
  }

  // 编码预设选项
  const encoderPresets = [
    { value: 'ultrafast', label: t('ultrafast') },
    { value: 'superfast', label: t('superfast') },
    { value: 'veryfast', label: t('veryfast') },
    { value: 'faster', label: t('faster') },
    { value: 'fast', label: t('fast') },
    { value: 'medium', label: t('medium') },
    { value: 'slow', label: t('slow') },
    { value: 'slower', label: t('slower') },
    { value: 'veryslow', label: t('veryslow') }
  ]

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{t('quality')}</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{t('qualityTooltip')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {Object.values(VIDEO_QUALITY_PRESETS).map((preset) => (
            <Button
              key={preset}
              type="button"
              variant={qualityPreset === preset ? 'default' : 'outline'}
              size="sm"
              className={qualityPreset === preset ? 'bg-red-500 hover:bg-red-600' : ''}
              onClick={() => onQualityPresetChange(preset)}
            >
              {t(preset)}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">{t('outputFormat')}</Label>
        <Select
          value={outputFormat}
          onValueChange={(value) => onFormatChange(value as VideoFormat)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('selectFormat')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="original">{t('original')}</SelectItem>
            {Object.entries(VIDEO_FORMATS).map(([key, value]) => (
              <SelectItem key={key} value={value}>
                {value.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!isBatchMode && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{t('resolutionSettings')}</Label>
            {videoInfo.width && videoInfo.height && (
              <span className="text-xs text-slate-500">
                {t('original')}: {videoInfo.width}×{videoInfo.height}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs" htmlFor="width-input">
                {t('width')}
              </Label>
              <Input
                id="width-input"
                type="number"
                value={width}
                onChange={handleWidthChange}
                placeholder={videoInfo.width?.toString() || ''}
                className="h-8"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs" htmlFor="height-input">
                {t('height')}
              </Label>
              <Input
                id="height-input"
                type="number"
                value={height}
                onChange={handleHeightChange}
                placeholder={videoInfo.height?.toString() || ''}
                className="h-8"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 mt-1">
            <Switch
              id="maintain-aspect-ratio"
              checked={maintainAspectRatio}
              onCheckedChange={onMaintainAspectRatioChange}
            />
            <Label htmlFor="maintain-aspect-ratio" className="text-xs">
              {t('maintainAspectRatio')}
            </Label>
          </div>
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="flex items-center justify-between w-full p-0 h-auto text-xs text-slate-600 dark:text-slate-400 hover:bg-transparent hover:text-slate-900 dark:hover:text-slate-200"
        onClick={handleToggleAdvanced}
      >
        <span>{showAdvanced ? t('hideAdvancedSettings') : t('showAdvancedSettings')}</span>
        {showAdvanced ? (
          <ChevronUp className="h-4 w-4 ml-1" />
        ) : (
          <ChevronDown className="h-4 w-4 ml-1" />
        )}
      </Button>

      {showAdvanced && (
        <Accordion
          type="single"
          collapsible
          className="w-full"
          value={accordionValue}
          onValueChange={setAccordionValue}
        >
          <AccordionItem value="encoder" className="border-b-0">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="text-sm font-medium">{t('encoderSettings')}</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 mt-1">
                <div className="space-y-1">
                  <Label className="text-xs">{t('videoEncoder')}</Label>
                  <Select
                    value={encoder}
                    onValueChange={(value) => onEncoderChange?.(value as VideoEncoder)}
                    disabled={outputFormat === 'original'}
                  >
                    <SelectTrigger className="w-full h-8">
                      <SelectValue placeholder={t('selectEncoder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(VIDEO_ENCODERS).map(([key, value]) => (
                        <SelectItem key={key} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">{t('crfValue')}</Label>
                    <span className="text-xs font-medium">{crf}</span>
                  </div>
                  <Slider
                    value={[crf]}
                    min={0}
                    max={51}
                    step={1}
                    className="py-1"
                    onValueChange={handleCrfChange}
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{t('higher')}</span>
                    <span>{t('lower')}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">{t('encoderPreset')}</Label>
                  <Select value={preset} onValueChange={(value) => onPresetChange?.(value)}>
                    <SelectTrigger className="w-full h-8">
                      <SelectValue placeholder={t('selectPreset')} />
                    </SelectTrigger>
                    <SelectContent>
                      {encoderPresets.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="framerate" className="border-b-0">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="text-sm font-medium">{t('framerateSettings')}</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 mt-1">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs" htmlFor="fps-input">
                      {t('framerate')} (FPS)
                    </Label>
                    {videoInfo.fps && (
                      <span className="text-xs text-slate-500">
                        {t('original')}: {videoInfo.fps}
                      </span>
                    )}
                  </div>
                  <Input
                    id="fps-input"
                    type="number"
                    value={fps}
                    onChange={(e) =>
                      onFpsChange?.(e.target.value === '' ? '' : parseInt(e.target.value))
                    }
                    placeholder={videoInfo.fps?.toString() || ''}
                    className="h-8"
                  />
                  <p className="text-xs text-slate-500 mt-1">{t('fpsDescription')}</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  )
}
