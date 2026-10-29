import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Crop,
  Download,
  Loader2,
  Monitor,
  Pause,
  Play,
  RefreshCw,
  Square,
  Trash2
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Panel, PanelBody, PanelHeader, Field, DataRow } from '@renderer/components/ui/panel'
import { SegmentedControl } from '@renderer/components/ui/segmented-control'
import { EmptyState, Notice, StatusDot } from '@renderer/components/ui/states'
import { toast } from '@renderer/components/ui/use-toast'
import { cn } from '@renderer/lib/utils'

interface ScreenRecorderToolProps {
  onBack: () => void
}

interface Source {
  id: string
  name: string
  thumbnail: string
}

type RecordingMode = 'fullscreen' | 'region'
type RegionBounds = { x: number; y: number; w: number; h: number }

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  return [hours, minutes, remainingSeconds]
    .map((value) => value.toString().padStart(2, '0'))
    .join(':')
}

export default function ScreenRecorderTool({ onBack }: ScreenRecorderToolProps): JSX.Element {
  const { t } = useTranslation()
  const [sources, setSources] = useState<Source[]>([])
  const [selectedSourceId, setSelectedSourceId] = useState('')
  const [mode, setMode] = useState<RecordingMode>('fullscreen')
  const [isLoadingSources, setIsLoadingSources] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [timer, setTimer] = useState(0)
  const [recordingError, setRecordingError] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const previewStreamRef = useRef<MediaStream | null>(null)
  const livePreviewRef = useRef<HTMLVideoElement | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const previewUrlRef = useRef<string | null>(null)
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRegionRecordingRef = useRef<((bounds: RegionBounds) => Promise<void>) | null>(null)

  // Keep the required host prop without rendering the legacy home navigation.
  void onBack

  const selectedSource =
    sources.find((source) => source.id === selectedSourceId) || sources[0] || null

  const loadSources = useCallback(async (): Promise<Source[]> => {
    setIsLoadingSources(true)
    try {
      const nextSources = (await window.electron.ipcRenderer.invoke(
        'get-screen-sources'
      )) as Source[]
      setSources(nextSources)
      setSelectedSourceId((current) =>
        nextSources.some((source) => source.id === current) ? current : nextSources[0]?.id || ''
      )
      return nextSources
    } finally {
      setIsLoadingSources(false)
    }
  }, [])

  const updatePreviewUrl = (nextUrl: string | null): void => {
    if (previewUrlRef.current && previewUrlRef.current !== nextUrl) {
      URL.revokeObjectURL(previewUrlRef.current)
    }
    previewUrlRef.current = nextUrl
    setPreviewUrl(nextUrl)
  }

  const clearTimer = (): void => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
  }

  const startTimer = (): void => {
    clearTimer()
    timerIntervalRef.current = setInterval(() => {
      setTimer((previous) => previous + 1)
    }, 1000)
  }

  const stopStream = (): void => {
    const originalStream = streamRef.current
    originalStream?.getTracks().forEach((track) => track.stop())
    if (previewStreamRef.current && previewStreamRef.current !== originalStream) {
      previewStreamRef.current.getTracks().forEach((track) => track.stop())
    }
    streamRef.current = null
    previewStreamRef.current = null
    if (livePreviewRef.current) {
      livePreviewRef.current.srcObject = null
    }
  }

  const beginRecording = (recordingStream: MediaStream, originalStream: MediaStream): void => {
    const mediaRecorder = new MediaRecorder(recordingStream)
    mediaRecorderRef.current = mediaRecorder
    chunksRef.current = []

    mediaRecorder.ondataavailable = (event): void => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = (): void => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      updatePreviewUrl(URL.createObjectURL(blob))
      setIsRecording(false)
      setIsPaused(false)
      setIsStarting(false)
      clearTimer()

      originalStream.getTracks().forEach((track) => track.stop())
      if (recordingStream !== originalStream) {
        recordingStream.getTracks().forEach((track) => track.stop())
      }
      if (streamRef.current === originalStream) {
        streamRef.current = null
      }
      if (
        previewStreamRef.current === recordingStream ||
        previewStreamRef.current === originalStream
      ) {
        previewStreamRef.current = null
      }
      if (livePreviewRef.current) {
        livePreviewRef.current.srcObject = null
      }
      mediaRecorderRef.current = null
    }

    mediaRecorder.start()
    setIsRecording(true)
    setIsPaused(false)
    setTimer(0)
    startTimer()
  }

  const startRegionRecording = async (bounds: RegionBounds): Promise<void> => {
    if (bounds.w <= 0 || bounds.h <= 0) {
      const message = t('screenRecorderInvalidSelection')
      setRecordingError(message)
      toast({ title: t('error'), description: message, variant: 'destructive' })
      return
    }

    setIsStarting(true)
    setRecordingError('')
    updatePreviewUrl(null)

    try {
      const availableSources = await loadSources()
      // Region coordinates are produced by the primary-display selection window.
      const source = availableSources[0]
      if (!source) {
        throw new Error(t('screenRecorderNoSource'))
      }
      setSelectedSourceId(source.id)

      const constraints: any = {
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: source.id
          }
        }
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      const canvas = document.createElement('canvas')
      canvas.width = bounds.w
      canvas.height = bounds.h
      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error(t('screenRecorderCanvasFailed'))
      }

      const video = document.createElement('video')
      video.srcObject = stream
      video.muted = true
      video.playsInline = true
      await video.play()

      const draw = (): void => {
        if (video.readyState >= video.HAVE_CURRENT_DATA) {
          context.drawImage(video, -bounds.x, -bounds.y)
        }
        if (stream.active) {
          requestAnimationFrame(draw)
        }
      }
      draw()

      const croppedStream = canvas.captureStream(30)
      previewStreamRef.current = croppedStream
      beginRecording(croppedStream, stream)
    } catch (error) {
      console.error('Error starting region recording:', error)
      stopStream()
      const message = t('screenRecorderStartFailed', { error: String(error) })
      setRecordingError(message)
      toast({ title: t('error'), description: message, variant: 'destructive' })
    } finally {
      setIsStarting(false)
    }
  }

  startRegionRecordingRef.current = startRegionRecording

  useEffect(() => {
    loadSources().catch((error) => {
      console.error('Error loading screen sources:', error)
      setRecordingError(String(error))
    })
  }, [loadSources])

  useEffect(() => {
    const handleRegionSelected = (_event: any, bounds: RegionBounds): void => {
      if (startRegionRecordingRef.current) {
        void startRegionRecordingRef.current(bounds)
      }
    }
    window.electron.ipcRenderer.on('region-selected-success', handleRegionSelected)
    return (): void => {
      window.electron.ipcRenderer.removeAllListeners('region-selected-success')
    }
  }, [])

  useEffect(() => {
    if (!isRecording || !livePreviewRef.current || !previewStreamRef.current) {
      return
    }
    const video = livePreviewRef.current
    video.srcObject = previewStreamRef.current
    video.play().catch((error) => console.error('Error starting live preview:', error))

    return (): void => {
      video.srcObject = null
    }
  }, [isRecording])

  useEffect(
    () => (): void => {
      clearTimer()
      const recorder = mediaRecorderRef.current
      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = null
        recorder.stop()
      }
      streamRef.current?.getTracks().forEach((track) => track.stop())
      previewStreamRef.current?.getTracks().forEach((track) => track.stop())
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    },
    []
  )

  const handleRefreshSources = async (): Promise<void> => {
    setRecordingError('')
    try {
      await loadSources()
    } catch (error) {
      console.error('Error refreshing screen sources:', error)
      setRecordingError(String(error))
      toast({ title: t('error'), description: String(error), variant: 'destructive' })
    }
  }

  const handleModeChange = (nextMode: RecordingMode): void => {
    setMode(nextMode)
    setRecordingError('')
    if (nextMode === 'region' && sources[0]) {
      setSelectedSourceId(sources[0].id)
    }
  }

  const startRecording = async (type: RecordingMode): Promise<void> => {
    if (type === 'region') {
      setRecordingError('')
      try {
        await window.electron.ipcRenderer.invoke('open-region-selection-window')
      } catch (error) {
        console.error('Error opening region selection:', error)
        setRecordingError(String(error))
        toast({ title: t('error'), description: String(error), variant: 'destructive' })
      }
      return
    }

    setIsStarting(true)
    setRecordingError('')
    updatePreviewUrl(null)

    try {
      const availableSources = await loadSources()
      const source =
        availableSources.find((item) => item.id === selectedSourceId) || availableSources[0]
      if (!source) {
        throw new Error(t('screenRecorderNoSource'))
      }
      setSelectedSourceId(source.id)

      const constraints: any = {
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: source.id
          }
        }
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      previewStreamRef.current = stream
      beginRecording(stream, stream)
    } catch (error) {
      console.error('Error starting recording:', error)
      stopStream()
      const message = t('screenRecorderStartFailed', { error: String(error) })
      setRecordingError(message)
      toast({ title: t('error'), description: message, variant: 'destructive' })
    } finally {
      setIsStarting(false)
    }
  }

  const stopRecording = (): void => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      stopStream()
    }
  }

  const togglePause = (): void => {
    const recorder = mediaRecorderRef.current
    if (!recorder || !isRecording) {
      return
    }

    if (isPaused) {
      recorder.resume()
      startTimer()
    } else {
      recorder.pause()
      clearTimer()
    }
    setIsPaused(!isPaused)
  }

  const downloadVideo = (): void => {
    if (previewUrl) {
      const anchor = document.createElement('a')
      anchor.href = previewUrl
      anchor.download = `recording-${new Date().toISOString()}.webm`
      anchor.click()
    }
  }

  const discardRecording = (): void => {
    updatePreviewUrl(null)
    setTimer(0)
    setRecordingError('')
  }

  const statusText = previewUrl
    ? t('recordingPreview')
    : isPaused
      ? t('paused')
      : isRecording
        ? t('recording')
        : t('preview')
  const isCaptureBusy = isStarting || isRecording

  return (
    <div className="min-h-full bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1700px] items-center justify-end gap-3 px-4 py-2.5 md:px-6">
          <StatusDot
            tone={isRecording && !isPaused ? 'active' : previewUrl ? 'success' : 'neutral'}
          />
          <div>
            <p className="text-xs text-muted-foreground">{statusText}</p>
            <p className="font-mono text-sm font-medium text-foreground">{formatTime(timer)}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1700px] space-y-5 p-4 md:p-6">
        {recordingError && <Notice tone="error" title={t('error')} description={recordingError} />}

        <div className="grid items-start gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
          <Panel>
            <PanelHeader
              eyebrow={t('screenRecorderCaptureSetup')}
              title={t('settings')}
              description={t('screenRecorderTipDescription')}
            />
            <PanelBody className="space-y-5 p-4">
              <Field label={t('screenRecorderSource')} hint={sources.length}>
                <div className="flex gap-2">
                  <Select
                    value={selectedSourceId}
                    onValueChange={setSelectedSourceId}
                    disabled={isCaptureBusy || mode === 'region' || sources.length === 0}
                  >
                    <SelectTrigger className="min-w-0 bg-background/50">
                      <SelectValue placeholder={t('select')} />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map((source) => (
                        <SelectItem key={source.id} value={source.id}>
                          {source.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefreshSources}
                    disabled={isCaptureBusy || isLoadingSources}
                    aria-label={t('refresh')}
                    title={t('refresh')}
                  >
                    <RefreshCw className={cn('h-4 w-4', isLoadingSources && 'animate-spin')} />
                  </Button>
                </div>
              </Field>

              <Field label={t('screenRecorderMode')}>
                <SegmentedControl
                  value={mode}
                  onChange={handleModeChange}
                  options={[
                    { value: 'fullscreen', label: t('fullScreenRecording'), icon: Monitor },
                    { value: 'region', label: t('regionRecording'), icon: Crop }
                  ]}
                  ariaLabel={t('screenRecorder')}
                  className="grid w-full grid-cols-2"
                />
              </Field>

              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  {mode === 'fullscreen' ? (
                    <Monitor className="h-4 w-4 text-primary" />
                  ) : (
                    <Crop className="h-4 w-4 text-primary" />
                  )}
                  {mode === 'fullscreen' ? t('fullScreenRecording') : t('regionRecording')}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  {mode === 'fullscreen' ? t('fullScreenRecordingDesc') : t('regionRecordingDesc')}
                </p>
              </div>

              <dl className="divide-y divide-border border-y border-border">
                <DataRow label={t('screenRecorderSource')} value={selectedSource?.name || '--'} />
                <DataRow
                  label={t('screenRecorderMode')}
                  value={mode === 'fullscreen' ? t('fullScreenRecording') : t('regionRecording')}
                />
                <DataRow label={t('screenRecorderOutput')} value="WEBM" />
              </dl>

              <Notice title={t('screenRecorderTipTitle')} description={t('recordingTip')} />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              eyebrow={t('screenRecorderPreviewStage')}
              title={previewUrl ? t('recordingPreview') : t('preview')}
              description={selectedSource?.name || t('screenRecorderDescription')}
              action={
                <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <StatusDot tone={isRecording && !isPaused ? 'active' : 'neutral'} />
                  {formatTime(timer)}
                </div>
              }
            />

            <div className="relative flex aspect-video min-h-[300px] w-full items-center justify-center overflow-hidden bg-muted">
              {previewUrl ? (
                <video
                  key="recorded-preview"
                  src={previewUrl}
                  controls
                  className="absolute inset-0 h-full w-full object-contain"
                />
              ) : isCaptureBusy ? (
                <>
                  <video
                    ref={livePreviewRef}
                    autoPlay
                    muted
                    playsInline
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                  {isStarting && (
                    <div className="relative z-10 w-full max-w-md px-6">
                      <Notice
                        tone="loading"
                        title={t('startRecording')}
                        description={t('processing')}
                      />
                    </div>
                  )}
                  {isRecording && (
                    <div className="absolute left-4 top-4 flex items-center gap-2 rounded-md border border-border bg-card/95 px-3 py-2 text-xs font-medium text-foreground">
                      <StatusDot tone={isPaused ? 'neutral' : 'active'} />
                      {isPaused ? t('paused') : t('recording')}
                    </div>
                  )}
                </>
              ) : selectedSource ? (
                <img
                  src={selectedSource.thumbnail}
                  alt={selectedSource.name}
                  className="absolute inset-0 h-full w-full object-contain"
                />
              ) : (
                <EmptyState
                  icon={Monitor}
                  title={t('screenRecorder')}
                  description={isLoadingSources ? t('processing') : t('screenRecorderDescription')}
                  className="border-0 bg-transparent"
                />
              )}
            </div>

            <div className="flex flex-col gap-4 border-t border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="font-mono text-lg font-semibold tabular-nums text-foreground">
                  {formatTime(timer)}
                </div>
                <div className="min-w-0 border-l border-border pl-3 text-xs">
                  <p className="truncate font-medium text-foreground">{statusText}</p>
                  <p className="mt-0.5 truncate text-muted-foreground">
                    {previewUrl ? 'WEBM' : selectedSource?.name || '--'}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {previewUrl ? (
                  <>
                    <Button variant="outline" onClick={discardRecording}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('discard')}
                    </Button>
                    <Button onClick={downloadVideo}>
                      <Download className="mr-2 h-4 w-4" />
                      {t('download')}
                    </Button>
                  </>
                ) : isRecording ? (
                  <>
                    <Button variant="outline" onClick={togglePause}>
                      {isPaused ? (
                        <Play className="mr-2 h-4 w-4" />
                      ) : (
                        <Pause className="mr-2 h-4 w-4" />
                      )}
                      {isPaused ? t('resumeRecording') : t('pauseRecording')}
                    </Button>
                    <Button variant="destructive" onClick={stopRecording}>
                      <Square className="mr-2 h-4 w-4" fill="currentColor" />
                      {t('stopRecording')}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => void startRecording(mode)}
                    disabled={isStarting || isLoadingSources || sources.length === 0}
                  >
                    {isStarting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    {isStarting ? t('processing') : t('startRecording')}
                  </Button>
                )}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
