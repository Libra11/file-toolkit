/**
 * Author: Libra
 * Date: 2025-11-21 14:05:03
 * LastEditTime: 2025-11-21 15:51:17
 * LastEditors: Libra
 * Description:
 */
import { useState, useRef, useEffect, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@renderer/components/ui/button'
import { Card } from '@renderer/components/ui/card'
import {
  Monitor,
  Crop,
  Square,
  Pause,
  Play,
  Download,
  ArrowLeft,
  Trash2,
  Sparkles,
  Layers
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from '@renderer/components/ui/use-toast'
import { BackToHomeButton } from '@renderer/components/ui/BackToHomeButton'

interface ScreenRecorderToolProps {
  onBack: () => void
}

interface Source {
  id: string
  name: string
  thumbnail: string
}

export default function ScreenRecorderTool({ onBack }: ScreenRecorderToolProps): JSX.Element {
  const { t } = useTranslation()
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [timer, setTimer] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const startRegionRecordingRef = useRef<
    ((bounds: { x: number; y: number; w: number; h: number }) => Promise<void>) | null
  >(null)

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const stopStream = (): void => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  const startRegionRecording = async (bounds: {
    x: number
    y: number
    w: number
    h: number
  }): Promise<void> => {
    console.log('Starting region recording with bounds:', bounds)
    try {
      // Check bounds validity
      if (bounds.w <= 0 || bounds.h <= 0) {
        toast({
          title: t('error') || 'Error',
          description: 'Invalid selection area',
          variant: 'destructive'
        })
        return
      }

      const sources = (await window.electron.ipcRenderer.invoke('get-screen-sources')) as Source[]
      console.log('Available sources:', sources)

      const source = sources[0]
      if (!source) {
        console.error('No screen source found')
        toast({
          title: t('error') || 'Error',
          description: 'No screen source found',
          variant: 'destructive'
        })
        return
      }

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
      console.log('Stream obtained:', stream.id)

      // Create canvas for cropping
      const canvas = document.createElement('canvas')
      canvas.width = bounds.w
      canvas.height = bounds.h
      const ctx = canvas.getContext('2d')

      const video = document.createElement('video')
      video.srcObject = stream
      video.muted = true
      video.playsInline = true
      await video.play()

      // Draw loop
      const draw = (): void => {
        if (ctx && video.readyState >= video.HAVE_CURRENT_DATA) {
          ctx.drawImage(video, -bounds.x, -bounds.y)
        }
        if (stream.active) {
          requestAnimationFrame(draw)
        }
      }
      draw()

      const croppedStream = canvas.captureStream(30)
      streamRef.current = stream // Keep original stream to stop it later

      const mediaRecorder = new MediaRecorder(croppedStream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e): void => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = (): void => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        setIsRecording(false)
        setIsPaused(false)
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)

        // Stop original stream tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setTimer(0)
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Error starting region recording:', err)
      toast({
        title: t('error') || 'Error',
        description: `Failed to start recording: ${err}`,
        variant: 'destructive'
      })
    }
  }

  // Update ref whenever startRegionRecording changes
  startRegionRecordingRef.current = startRegionRecording

  useEffect(() => {
    console.log('ScreenRecorderTool mounted, registering region-selected-success listener')
    const handleRegionSelected = (
      _event: any,
      bounds: { x: number; y: number; w: number; h: number }
    ): void => {
      console.log('Received region-selected-success event in renderer', bounds)
      if (startRegionRecordingRef.current) {
        startRegionRecordingRef.current(bounds)
      } else {
        console.error('startRegionRecordingRef.current is null')
      }
    }
    window.electron.ipcRenderer.on('region-selected-success', handleRegionSelected)
    return (): void => {
      console.log('ScreenRecorderTool unmounting, removing listener')
      window.electron.ipcRenderer.removeAllListeners('region-selected-success')
    }
  }, [])

  const startRecording = async (type: 'fullscreen' | 'region'): Promise<void> => {
    if (type === 'region') {
      window.electron.ipcRenderer.invoke('open-region-selection-window')
      return
    }

    try {
      // Get sources from main process
      const sources = (await window.electron.ipcRenderer.invoke('get-screen-sources')) as Source[]

      // For simplicity, we'll just pick the first screen source for now.
      // In a real app, we'd show a selection dialog.
      const source = sources[0]

      if (!source) {
        console.error('No screen source found')
        return
      }

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

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e): void => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = (): void => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        setIsRecording(false)
        setIsPaused(false)
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setTimer(0)
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Error starting recording:', err)
    }
  }

  const stopRecording = (): void => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      stopStream()
    }
  }

  const togglePause = (): void => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        timerIntervalRef.current = setInterval(() => {
          setTimer((prev) => prev + 1)
        }, 1000)
      } else {
        mediaRecorderRef.current.pause()
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      }
      setIsPaused(!isPaused)
    }
  }

  const downloadVideo = (): void => {
    if (previewUrl) {
      const a = document.createElement('a')
      a.href = previewUrl
      a.download = `recording-${new Date().toISOString()}.webm`
      a.click()
    }
  }

  const discardRecording = (): void => {
    setPreviewUrl(null)
  }

  const highlightItems = [
    {
      label: t('fullScreenRecording'),
      description: t('fullScreenRecordingDesc'),
      icon: Monitor,
      accent: 'from-blue-500/15 via-transparent to-blue-500/5',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      label: t('regionRecording'),
      description: t('regionRecordingDesc'),
      icon: Crop,
      accent: 'from-emerald-500/15 via-transparent to-emerald-500/5',
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      label: t('recording'),
      description: t('recordingTip') ?? t('supportHighFps') ?? 'High quality capture',
      icon: Layers,
      accent: 'from-purple-500/15 via-transparent to-purple-500/5',
      iconColor: 'text-purple-600 dark:text-purple-400'
    }
  ]

  const renderIdleSection = (): ReactNode => (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        {[
          {
            type: 'fullscreen' as const,
            title: t('fullScreenRecording'),
            description: t('fullScreenRecordingDesc'),
            icon: Monitor,
            accent: 'from-blue-500/20 via-transparent to-blue-500/5',
            iconBg: 'bg-blue-100 dark:bg-blue-900/30',
            iconColor: 'text-blue-600 dark:text-blue-400'
          },
          {
            type: 'region' as const,
            title: t('regionRecording'),
            description: t('regionRecordingDesc'),
            icon: Crop,
            accent: 'from-emerald-500/20 via-transparent to-emerald-500/5',
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
            iconColor: 'text-emerald-600 dark:text-emerald-400'
          }
        ].map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() => startRecording(item.type)}
            className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/90 p-6 text-left shadow-xl shadow-slate-900/5 transition-all hover:-translate-y-1 hover:shadow-2xl dark:border-white/10 dark:bg-white/5"
          >
            <div
              className={`pointer-events-none absolute inset-0 opacity-80 bg-gradient-to-br ${item.accent}`}
            />
            <div className="relative flex flex-col gap-6">
              <div
                className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm transition-colors ${item.iconBg} ${item.iconColor}`}
              >
                <item.icon className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                  {item.description}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 transition group-hover:gap-3 dark:text-blue-300">
                {t('startNow') ?? 'Start now'}
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {highlightItems.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-inner shadow-slate-900/5 dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-xl bg-white/80 shadow-sm dark:bg-white/10 ${item.iconColor}`}
              >
                <div className="flex h-full w-full items-center justify-center">
                  <item.icon className="h-5 w-5" />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {item.label}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-200">{item.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderRecordingSection = (): ReactNode => (
    <div className="rounded-3xl border border-white/70 bg-white/90 p-8 text-center shadow-xl shadow-blue-900/10 dark:border-white/10 dark:bg-slate-900/70">
      <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100/60 px-4 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
        <Sparkles className="h-4 w-4" />
        {isPaused ? t('paused') : t('recording')}
      </div>
      <div className="text-6xl font-mono font-bold text-slate-900 dark:text-white">
        {formatTime(timer)}
      </div>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {isPaused
          ? (t('pausedTip') ?? 'Recording paused')
          : (t('recordingTip') ?? 'Recording in progress')}
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
        <Button
          size="lg"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-white shadow-inner shadow-slate-900/40 transition hover:bg-slate-800 dark:bg-white/10 dark:text-white px-0"
          onClick={togglePause}
        >
          {isPaused ? <Play size={26} className="ml-1" /> : <Pause size={26} />}
        </Button>
        <Button
          size="lg"
          variant="destructive"
          className="flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition hover:scale-105 hover:shadow-red-500/30 px-6"
          onClick={stopRecording}
        >
          <Square size={26} fill="currentColor" className="text-white" />
        </Button>
      </div>
    </div>
  )

  const renderPreviewSection = (): ReactNode => (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)]">
      <Card className="border border-white/70 bg-white/95 shadow-2xl shadow-slate-900/10 dark:border-white/10 dark:bg-slate-900/80">
        <div className="flex items-center justify-between border-b border-slate-200/70 px-6 py-4 dark:border-white/5">
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {t('preview')}
            </p>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t('recordingPreview') ?? t('preview')}
            </h3>
          </div>
          <Button variant="ghost" size="sm" onClick={discardRecording}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('back')}
          </Button>
        </div>
        <div className="flex items-center justify-center bg-black/90">
          <video
            src={previewUrl ?? undefined}
            controls
            className="max-h-[60vh] w-full object-contain"
          />
        </div>
      </Card>

      <Card className="flex flex-col gap-4 border border-white/70 bg-white/95 p-6 shadow-xl shadow-slate-900/10 dark:border-white/10 dark:bg-slate-900/70">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t('nextSteps') ?? 'Next steps'}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('previewTip') ?? 'Save your recording or discard and try again.'}
        </p>
        <div className="mt-auto flex gap-3">
          <Button
            className="group flex h-14 flex-1 items-center justify-center gap-3 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 hover:bg-blue-700"
            onClick={downloadVideo}
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full  text-white ">
              <Download className="h-5 w-5" />
            </span>
            <span className="text-base font-semibold">{t('download')}</span>
          </Button>
          <Button
            variant="outline"
            className="group flex h-14 flex-1 items-center justify-center gap-3 rounded-full border-slate-200 text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-900/50 dark:hover:bg-red-900/20 dark:hover:text-red-200"
            onClick={discardRecording}
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-slate-200 text-slate-600 dark:border-slate-600 dark:text-slate-100">
              <Trash2 className="h-5 w-5" />
            </span>
            <span className="text-base font-semibold">{t('discard')}</span>
          </Button>
        </div>
      </Card>
    </div>
  )

  const renderMainSection = (): ReactNode => {
    if (previewUrl) {
      return renderPreviewSection()
    }
    if (isRecording) {
      return renderRecordingSection()
    }
    return renderIdleSection()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="container mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-[#eef2ff] via-white to-[#e0f7ff] p-6 shadow-2xl shadow-blue-900/20 backdrop-blur-lg dark:border-white/10 dark:from-[#0f172a] dark:via-[#111c3d] dark:to-[#0a1328] md:p-10">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute -left-10 top-0 h-48 w-48 rounded-full bg-blue-400/30 blur-3xl dark:bg-blue-500/20" />
            <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-500/20" />
          </div>

          <div className="relative space-y-6">
            <div className="flex gap-3 flex-row items-center justify-between">
              <div className="inline-flex items-center gap-3 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm dark:bg-white/10 dark:text-white">
                <Monitor className="h-4 w-4" />
                {t('screenRecorder')}
              </div>
              {onBack && (
                <BackToHomeButton
                  onClick={onBack}
                  className="bg-white/70 text-slate-700 hover:bg-white dark:bg-white/10 dark:text-white"
                />
              )}
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
                {t('captureMoments') ?? t('screenRecorder')}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {t('screenRecorderDescription') ??
                  'Record your screen in full fidelity with a single click.'}
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-blue-100/70 bg-blue-50/60 p-4 text-sm text-blue-700 shadow-inner dark:border-blue-500/30 dark:bg-blue-900/20 dark:text-blue-100 md:flex-row md:items-start md:gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-blue-500 shadow-sm dark:bg-white/10 dark:text-blue-200">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold">{t('screenRecorderTipTitle')}</p>
                <p className="text-xs leading-relaxed text-blue-600/80 dark:text-blue-100/80">
                  {t('screenRecorderTipDescription')}
                </p>
              </div>
            </div>

            {renderMainSection()}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
