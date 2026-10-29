import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Field } from '@renderer/components/ui/panel'
import { Label } from '@renderer/components/ui/label'
import { Input } from '@renderer/components/ui/input'
import { SegmentedControl } from '@renderer/components/ui/segmented-control'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Slider } from '@renderer/components/ui/slider'
import { Switch } from '@renderer/components/ui/switch'
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

  const handleWidthChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const newWidth = event.target.value === '' ? '' : parseInt(event.target.value)
    onWidthChange?.(newWidth)
    if (maintainAspectRatio && newWidth !== '' && videoInfo.width && videoInfo.height) {
      onHeightChange?.(Math.round(newWidth / (videoInfo.width / videoInfo.height)))
    }
  }

  const handleHeightChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const newHeight = event.target.value === '' ? '' : parseInt(event.target.value)
    onHeightChange?.(newHeight)
    if (maintainAspectRatio && newHeight !== '' && videoInfo.width && videoInfo.height) {
      onWidthChange?.(Math.round(newHeight * (videoInfo.width / videoInfo.height)))
    }
  }

  const handleCrfChange = (value: number[]): void => {
    onCrfChange?.(value[0])
    if (qualityPreset !== VIDEO_QUALITY_PRESETS.CUSTOM) {
      onQualityPresetChange(VIDEO_QUALITY_PRESETS.CUSTOM)
    }
  }

  const encoderPresets = [
    'ultrafast',
    'superfast',
    'veryfast',
    'faster',
    'fast',
    'medium',
    'slow',
    'slower',
    'veryslow'
  ]

  return (
    <div className="space-y-5">
      <section className="space-y-3" aria-label={t('compressionSettings')}>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {t('compressionSettings')}
        </h3>
        <Field label={t('quality')}>
          <SegmentedControl<VideoQualityPreset>
            value={qualityPreset}
            onChange={onQualityPresetChange}
            ariaLabel={t('quality')}
            className="grid w-full grid-cols-4"
            options={Object.values(VIDEO_QUALITY_PRESETS).map((value) => ({
              value,
              label: t(value)
            }))}
          />
        </Field>
        <p className="text-[11px] leading-relaxed text-muted-foreground">{t('qualityTooltip')}</p>
        <Field label={t('outputFormat')}>
          <Select
            value={outputFormat}
            onValueChange={(value) => onFormatChange(value as VideoFormat)}
          >
            <SelectTrigger aria-label={t('outputFormat')}>
              <SelectValue placeholder={t('selectFormat')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="original">{t('original')}</SelectItem>
              {Object.values(VIDEO_FORMATS).map((value) => (
                <SelectItem key={value} value={value}>
                  {value.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </section>

      {!isBatchMode && (
        <section
          className="space-y-3 border-t border-border pt-4"
          aria-label={t('resolutionSettings')}
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t('resolutionSettings')}
            </h3>
            {videoInfo.width && videoInfo.height && (
              <span className="text-[11px] text-muted-foreground">
                {t('original')}: {videoInfo.width} × {videoInfo.height}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('width')}>
              <Input
                id="video-width-input"
                type="number"
                min={1}
                value={width}
                onChange={handleWidthChange}
                placeholder={videoInfo.width?.toString() || ''}
              />
            </Field>
            <Field label={t('height')}>
              <Input
                id="video-height-input"
                type="number"
                min={1}
                value={height}
                onChange={handleHeightChange}
                placeholder={videoInfo.height?.toString() || ''}
              />
            </Field>
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="video-maintain-aspect-ratio" className="text-xs text-muted-foreground">
              {t('maintainAspectRatio')}
            </Label>
            <Switch
              id="video-maintain-aspect-ratio"
              checked={maintainAspectRatio}
              onCheckedChange={onMaintainAspectRatioChange}
            />
          </div>
        </section>
      )}

      <button
        type="button"
        className="flex w-full items-center justify-between border-y border-border py-2.5 text-xs font-medium text-foreground transition-colors hover:text-primary"
        onClick={() => onShowAdvancedChange?.(!showAdvanced)}
        aria-expanded={showAdvanced}
      >
        <span>{showAdvanced ? t('hideAdvancedSettings') : t('showAdvancedSettings')}</span>
        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {showAdvanced && (
        <div className="space-y-5">
          <section className="space-y-4" aria-label={t('encoderSettings')}>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t('encoderSettings')}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <Field label={t('videoEncoder')}>
                <Select
                  value={encoder}
                  onValueChange={(value) => onEncoderChange?.(value as VideoEncoder)}
                  disabled={outputFormat === 'original'}
                >
                  <SelectTrigger aria-label={t('videoEncoder')}>
                    <SelectValue placeholder={t('selectEncoder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(VIDEO_ENCODERS).map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t('encoderPreset')}>
                <Select value={preset} onValueChange={onPresetChange}>
                  <SelectTrigger aria-label={t('encoderPreset')}>
                    <SelectValue placeholder={t('selectPreset')} />
                  </SelectTrigger>
                  <SelectContent>
                    {encoderPresets.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label={t('crfValue')} hint={crf}>
              <div className="space-y-2 pt-1">
                <Slider value={[crf]} min={0} max={51} step={1} onValueChange={handleCrfChange} />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{t('higher')}</span>
                  <span>{t('lower')}</span>
                </div>
              </div>
            </Field>
          </section>

          {!isBatchMode && (
            <section
              className="space-y-3 border-t border-border pt-4"
              aria-label={t('framerateSettings')}
            >
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {t('framerateSettings')}
              </h3>
              <Field
                label={`${t('framerate')} (FPS)`}
                hint={videoInfo.fps ? `${t('original')}: ${videoInfo.fps}` : undefined}
              >
                <Input
                  id="video-fps-input"
                  type="number"
                  min={1}
                  value={fps}
                  onChange={(event) =>
                    onFpsChange?.(event.target.value === '' ? '' : parseInt(event.target.value))
                  }
                  placeholder={videoInfo.fps?.toString() || ''}
                />
              </Field>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {t('fpsDescription')}
              </p>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
