/**
 * Author: Libra
 * Date: 2024-03-31
 * LastEditors: Libra
 * Description: 音频压缩工具的压缩设置组件
 */
import { useTranslation } from 'react-i18next'
import { Label } from '@renderer/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { ToggleGroup, ToggleGroupItem } from '@renderer/components/ui/toggle-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@renderer/components/ui/accordion'
import { AudioFormat, AudioQualityPreset, AUDIO_FORMATS, AUDIO_QUALITY_PRESETS } from './types'
interface CompressionSettingsProps {
  originalSize: number
  qualityPreset: AudioQualityPreset
  outputFormat: AudioFormat
  bitrate: string
  sampleRate: number | ''
  channels: number | ''
  onQualityPresetChange: (value: AudioQualityPreset) => void
  onFormatChange: (value: AudioFormat) => void
  onBitrateChange: (value: string) => void
  onSampleRateChange: (value: number | '') => void
  onChannelsChange: (value: number | '') => void
}

export function CompressionSettings({
  qualityPreset,
  outputFormat,
  bitrate,
  sampleRate,
  channels,
  onQualityPresetChange,
  onFormatChange,
  onBitrateChange,
  onSampleRateChange,
  onChannelsChange
}: CompressionSettingsProps): JSX.Element {
  const { t } = useTranslation()
  return (
    <div className="space-y-4">
      {/* 压缩质量预设 */}
      <div className="space-y-2">
        <Label>{t('qualityPreset')}</Label>
        <ToggleGroup
          type="single"
          value={qualityPreset}
          onValueChange={(value) => value && onQualityPresetChange(value as AudioQualityPreset)}
          variant="outline"
          className="grid grid-cols-4 gap-2"
        >
          <ToggleGroupItem value={AUDIO_QUALITY_PRESETS.HIGH} className="text-xs sm:text-sm">
            {t('high')}
          </ToggleGroupItem>
          <ToggleGroupItem value={AUDIO_QUALITY_PRESETS.MEDIUM} className="text-xs sm:text-sm">
            {t('medium')}
          </ToggleGroupItem>
          <ToggleGroupItem value={AUDIO_QUALITY_PRESETS.LOW} className="text-xs sm:text-sm">
            {t('low')}
          </ToggleGroupItem>
          <ToggleGroupItem value={AUDIO_QUALITY_PRESETS.CUSTOM} className="text-xs sm:text-sm">
            {t('custom')}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* 输出格式 */}
      <div className="space-y-2">
        <Label>{t('outputFormat')}</Label>
        <RadioGroup
          value={outputFormat}
          onValueChange={(value) => onFormatChange(value as AudioFormat)}
          className="grid grid-cols-5 gap-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="original" id="r-original" />
            <Label htmlFor="r-original" className="text-xs sm:text-sm">
              {t('original')}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={AUDIO_FORMATS.MP3} id="r-mp3" />
            <Label htmlFor="r-mp3" className="text-xs sm:text-sm">
              MP3
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={AUDIO_FORMATS.AAC} id="r-aac" />
            <Label htmlFor="r-aac" className="text-xs sm:text-sm">
              AAC
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={AUDIO_FORMATS.OGG} id="r-ogg" />
            <Label htmlFor="r-ogg" className="text-xs sm:text-sm">
              OGG
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={AUDIO_FORMATS.WAV} id="r-wav" />
            <Label htmlFor="r-wav" className="text-xs sm:text-sm">
              WAV
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* 比特率设置 */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>{t('bitrate')}</Label>
          <span className="text-xs text-gray-500">{bitrate}</span>
        </div>
        <Select value={bitrate} onValueChange={onBitrateChange}>
          <SelectTrigger>
            <SelectValue placeholder={t('selectBitrate')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="64k">64 kbps</SelectItem>
            <SelectItem value="96k">96 kbps</SelectItem>
            <SelectItem value="128k">128 kbps</SelectItem>
            <SelectItem value="192k">192 kbps</SelectItem>
            <SelectItem value="256k">256 kbps</SelectItem>
            <SelectItem value="320k">320 kbps</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 高级设置 */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="advanced-settings">
          <AccordionTrigger>{t('advancedOptions')}</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              {/* 采样率 */}
              <div className="space-y-2">
                <Label>{t('sampleRate')}</Label>
                <Select
                  value={sampleRate ? sampleRate.toString() : 'original'}
                  onValueChange={(value) => {
                    if (value === 'original') {
                      onSampleRateChange('')
                    } else {
                      onSampleRateChange(parseInt(value))
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectSampleRate')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original">{t('original')}</SelectItem>
                    <SelectItem value="8000">8,000 Hz</SelectItem>
                    <SelectItem value="16000">16,000 Hz</SelectItem>
                    <SelectItem value="22050">22,050 Hz</SelectItem>
                    <SelectItem value="44100">44,100 Hz</SelectItem>
                    <SelectItem value="48000">48,000 Hz</SelectItem>
                    <SelectItem value="96000">96,000 Hz</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 声道 */}
              <div className="space-y-2">
                <Label>{t('channels')}</Label>
                <Select
                  value={channels ? channels.toString() : 'original'}
                  onValueChange={(value) => {
                    if (value === 'original') {
                      onChannelsChange('')
                    } else {
                      onChannelsChange(parseInt(value))
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectChannels')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original">{t('original')}</SelectItem>
                    <SelectItem value="1">{t('mono')}</SelectItem>
                    <SelectItem value="2">{t('stereo')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
