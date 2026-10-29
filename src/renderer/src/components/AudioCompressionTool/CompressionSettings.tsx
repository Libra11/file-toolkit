import { useTranslation } from 'react-i18next'
import { DataRow, Field } from '@renderer/components/ui/panel'
import { SegmentedControl } from '@renderer/components/ui/segmented-control'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
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

function formatSize(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(2)} ${units[index]}`
}

export function CompressionSettings({
  originalSize,
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
    <div className="space-y-5">
      <section className="space-y-3" aria-label={t('compressionSettings')}>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {t('compressionSettings')}
        </h3>
        <Field label={t('qualityPreset')}>
          <SegmentedControl<AudioQualityPreset>
            value={qualityPreset}
            onChange={onQualityPresetChange}
            ariaLabel={t('qualityPreset')}
            className="grid w-full grid-cols-4"
            options={[
              { value: AUDIO_QUALITY_PRESETS.HIGH, label: t('high') },
              { value: AUDIO_QUALITY_PRESETS.MEDIUM, label: t('medium') },
              { value: AUDIO_QUALITY_PRESETS.LOW, label: t('low') },
              { value: AUDIO_QUALITY_PRESETS.CUSTOM, label: t('custom') }
            ]}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <Field label={t('outputFormat')}>
            <Select
              value={outputFormat}
              onValueChange={(value) => onFormatChange(value as AudioFormat)}
            >
              <SelectTrigger aria-label={t('outputFormat')}>
                <SelectValue placeholder={t('selectFormat')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="original">{t('original')}</SelectItem>
                <SelectItem value={AUDIO_FORMATS.MP3}>MP3</SelectItem>
                <SelectItem value={AUDIO_FORMATS.AAC}>AAC</SelectItem>
                <SelectItem value={AUDIO_FORMATS.OGG}>OGG</SelectItem>
                <SelectItem value={AUDIO_FORMATS.WAV}>WAV</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t('bitrate')} hint={bitrate}>
            <Select value={bitrate} onValueChange={onBitrateChange}>
              <SelectTrigger aria-label={t('bitrate')}>
                <SelectValue placeholder={t('selectBitrate')} />
              </SelectTrigger>
              <SelectContent>
                {['64k', '96k', '128k', '192k', '256k', '320k'].map((value) => (
                  <SelectItem key={value} value={value}>
                    {value.replace('k', ' kbps')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </section>

      <section className="space-y-3 border-t border-border pt-4" aria-label={t('advancedOptions')}>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {t('advancedOptions')}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <Field label={t('sampleRate')}>
            <Select
              value={sampleRate ? sampleRate.toString() : 'original'}
              onValueChange={(value) =>
                onSampleRateChange(value === 'original' ? '' : Number(value))
              }
            >
              <SelectTrigger aria-label={t('sampleRate')}>
                <SelectValue placeholder={t('selectSampleRate')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="original">{t('original')}</SelectItem>
                {[8000, 16000, 22050, 44100, 48000, 96000].map((value) => (
                  <SelectItem key={value} value={value.toString()}>
                    {value.toLocaleString()} Hz
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t('channels')}>
            <Select
              value={channels ? channels.toString() : 'original'}
              onValueChange={(value) => onChannelsChange(value === 'original' ? '' : Number(value))}
            >
              <SelectTrigger aria-label={t('channels')}>
                <SelectValue placeholder={t('selectChannels')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="original">{t('original')}</SelectItem>
                <SelectItem value="1">{t('mono')}</SelectItem>
                <SelectItem value="2">{t('stereo')}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </section>

      <dl className="border-y border-border">
        <DataRow label={t('inputFile')} value={formatSize(originalSize)} />
      </dl>
    </div>
  )
}
