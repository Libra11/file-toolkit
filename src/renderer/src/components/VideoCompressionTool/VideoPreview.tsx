import { useTranslation } from 'react-i18next'
import { FileVideo } from 'lucide-react'
import { DataRow } from '@renderer/components/ui/panel'
import { EmptyState } from '@renderer/components/ui/states'
import { cn } from '@renderer/lib/utils'
import { VideoInfo } from './types'
import { formatFileSize, formatTime } from './utils'

interface VideoPreviewProps {
  videoUrl: string | null
  fileName: string
  fileSize: number
  videoInfo: VideoInfo
  className?: string
}

export function VideoPreview({
  videoUrl,
  fileName,
  fileSize,
  videoInfo,
  className
}: VideoPreviewProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <FileVideo className="h-4 w-4 shrink-0 text-primary" />
        <h3 className="truncate text-xs font-medium text-foreground" title={fileName}>
          {fileName}
        </h3>
      </div>

      {videoUrl ? (
        <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/35">
          <video src={videoUrl} controls className="h-full w-full object-contain">
            <track kind="captions" />
          </video>
        </div>
      ) : (
        <EmptyState
          icon={FileVideo}
          title={t('originalVideo')}
          description={fileName}
          className="aspect-video min-h-52"
        />
      )}

      <dl className="divide-y divide-border border-y border-border">
        <DataRow label={t('fileSize')} value={formatFileSize(fileSize)} />
        <DataRow label={t('format')} value={videoInfo.format?.toUpperCase() || '—'} />
        <DataRow
          label={t('duration')}
          value={videoInfo.duration ? formatTime(videoInfo.duration) : '—'}
        />
        <DataRow
          label={t('resolution')}
          value={
            videoInfo.width && videoInfo.height
              ? `${videoInfo.width} × ${videoInfo.height} px`
              : '—'
          }
        />
        <DataRow label={t('codec')} value={videoInfo.codec?.toUpperCase() || '—'} />
        <DataRow label={t('framerate')} value={videoInfo.fps ? `${videoInfo.fps} FPS` : '—'} />
        <DataRow
          label={t('bitrate')}
          value={videoInfo.bitrate ? `${videoInfo.bitrate} bps` : '—'}
        />
      </dl>
    </div>
  )
}
