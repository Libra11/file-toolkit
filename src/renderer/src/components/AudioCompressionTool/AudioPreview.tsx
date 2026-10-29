import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Music } from 'lucide-react'
import { DataRow } from '@renderer/components/ui/panel'
import { cn } from '@renderer/lib/utils'
import { AudioInfo } from './types'

interface AudioPreviewProps {
  audioUrl: string
  fileName?: string
  fileSize?: number
  audioInfo?: AudioInfo
  className?: string
}

function formatSize(bytes?: number): string {
  if (bytes === undefined) return '—'
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(2)} ${units[index]}`
}

export function AudioPreview({
  audioUrl,
  fileName,
  fileSize,
  audioInfo = {},
  className
}: AudioPreviewProps): JSX.Element {
  const { t } = useTranslation()
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (audioRef.current) audioRef.current.currentTime = 0
  }, [audioUrl])

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <Music className="h-4 w-4 shrink-0 text-primary" />
        <h3 className="truncate text-xs font-medium text-foreground" title={fileName}>
          {fileName || t('audioPreview')}
        </h3>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary">
            <Music className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground">{t('originalAudio')}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{formatSize(fileSize)}</p>
          </div>
        </div>
        <audio
          ref={audioRef}
          src={audioUrl}
          controls
          className="w-full"
          controlsList="nodownload"
        />
      </div>

      <dl className="divide-y divide-border border-y border-border">
        <DataRow label={t('fileSize')} value={formatSize(fileSize)} />
        <DataRow label={t('format')} value={audioInfo.format?.toUpperCase() || '—'} />
        <DataRow label={t('duration')} value={audioInfo.duration ?? '—'} />
        <DataRow
          label={t('sampleRate')}
          value={audioInfo.sampleRate ? `${audioInfo.sampleRate} Hz` : '—'}
        />
        <DataRow
          label={t('channels')}
          value={audioInfo.channels ? (audioInfo.channels === 1 ? t('mono') : t('stereo')) : '—'}
        />
        <DataRow
          label={t('bitrate')}
          value={audioInfo.bitrate ? `${audioInfo.bitrate} kbps` : '—'}
        />
      </dl>
    </div>
  )
}
