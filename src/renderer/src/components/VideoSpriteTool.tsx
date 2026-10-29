import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Download,
  FileImage,
  FileVideo,
  Film,
  FolderOpen,
  Grid3x3,
  Image as ImageIcon,
  Loader2,
  Play,
  Settings2
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
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
import { toast } from '@renderer/components/ui/toast'
import { cn } from '@renderer/lib/utils'

interface VideoSpriteToolProps {
  onBack?: () => void
}

type WorkspaceMode = 'video-to-sprite' | 'sprite-to-gif'
type OperationStatus = 'idle' | 'processing' | 'success' | 'error'

interface OperationViewState {
  status: OperationStatus
  outputPath?: string
  message?: string
}

const idleOperation: OperationViewState = { status: 'idle' }

function fileNameFromPath(filePath: string): string {
  return filePath.split(/[\\/]/).pop() || filePath
}

export function VideoSpriteTool({ onBack }: VideoSpriteToolProps): JSX.Element {
  const { t } = useTranslation()
  const [mode, setMode] = useState<WorkspaceMode>('video-to-sprite')

  const [videoPath, setVideoPath] = useState('')
  const [videoOutputDir, setVideoOutputDir] = useState('')
  const [videoTotalFrames, setVideoTotalFrames] = useState(6)
  const [videoScale, setVideoScale] = useState(0.5)
  const [videoColumns, setVideoColumns] = useState(3)
  const [videoFormat, setVideoFormat] = useState<'png' | 'jpg'>('png')
  const [isVideoProcessing, setIsVideoProcessing] = useState(false)
  const [videoOperation, setVideoOperation] = useState<OperationViewState>(idleOperation)

  const [imagePath, setImagePath] = useState('')
  const [imageOutputDir, setImageOutputDir] = useState('')
  const [imageFps, setImageFps] = useState(10)
  const [frameWidth, setFrameWidth] = useState(100)
  const [frameHeight, setFrameHeight] = useState(100)
  const [gridRows, setGridRows] = useState(2)
  const [gridColumns, setGridColumns] = useState(3)
  const [totalFrames, setTotalFrames] = useState(6)
  const [isImageProcessing, setIsImageProcessing] = useState(false)
  const [imageOperation, setImageOperation] = useState<OperationViewState>(idleOperation)

  // Kept in the public props for host compatibility; workspace navigation is not rendered here.
  void onBack

  const handleSelectVideo = async (): Promise<void> => {
    const path = await window.videoSprite.selectVideo()
    if (path) {
      setVideoPath(path)
      setVideoOutputDir(path.substring(0, path.lastIndexOf('/')))
      setVideoOperation(idleOperation)
    }
  }

  const handleSelectImage = async (): Promise<void> => {
    const path = await window.videoSprite.selectImage()
    if (path) {
      setImagePath(path)
      setImageOutputDir(path.substring(0, path.lastIndexOf('/')))
      setImageOperation(idleOperation)
    }
  }

  const handleSelectOutputDir = async (type: 'video' | 'image'): Promise<void> => {
    const result = await window.system.selectDirectory()
    if (result) {
      if (type === 'video') {
        setVideoOutputDir(result)
      } else {
        setImageOutputDir(result)
      }
    }
  }

  const handleVideoToSprite = async (): Promise<void> => {
    if (!videoPath) {
      toast.warning({ title: t('vsSelectVideoFirst') })
      return
    }

    setIsVideoProcessing(true)
    setVideoOperation({ status: 'processing' })
    const startTime = Date.now()

    try {
      const result = await window.videoSprite.videoToSprite({
        videoPath,
        outputDir: videoOutputDir || videoPath.substring(0, videoPath.lastIndexOf('/')),
        config: {
          totalFrames: videoTotalFrames,
          scale: videoScale,
          columns: videoColumns,
          format: videoFormat
        }
      })

      const elapsed = Date.now() - startTime
      if (elapsed < 800) {
        await new Promise((resolve) => setTimeout(resolve, 800 - elapsed))
      }

      if (result.success) {
        setVideoOperation({ status: 'success', outputPath: result.outputPath })
        toast.success({ title: t('vsExportSuccess'), description: result.outputPath })
      } else {
        const message = result.error || t('vsExportFailed')
        setVideoOperation({ status: 'error', message })
        toast.error({ title: t('vsExportFailed'), description: result.error })
      }
    } catch (error) {
      const message = String(error)
      setVideoOperation({ status: 'error', message })
      toast.error({ title: t('error'), description: message })
    } finally {
      setIsVideoProcessing(false)
    }
  }

  const handleSpriteToGif = async (): Promise<void> => {
    if (!imagePath) {
      toast.warning({ title: t('vsSelectImageFirst') })
      return
    }

    setIsImageProcessing(true)
    setImageOperation({ status: 'processing' })
    const startTime = Date.now()

    try {
      const result = await window.videoSprite.spriteToGif({
        imagePath,
        outputDir: imageOutputDir || imagePath.substring(0, imagePath.lastIndexOf('/')),
        config: {
          fps: imageFps,
          frameWidth,
          frameHeight,
          rows: gridRows,
          columns: gridColumns,
          totalFrames
        }
      })

      const elapsed = Date.now() - startTime
      if (elapsed < 800) {
        await new Promise((resolve) => setTimeout(resolve, 800 - elapsed))
      }

      if (result.success) {
        setImageOperation({ status: 'success', outputPath: result.outputPath })
        toast.success({ title: t('vsExportSuccess'), description: result.outputPath })
      } else {
        const message = result.error || t('vsExportFailed')
        setImageOperation({ status: 'error', message })
        toast.error({ title: t('vsExportFailed'), description: result.error })
      }
    } catch (error) {
      const message = String(error)
      setImageOperation({ status: 'error', message })
      toast.error({ title: t('error'), description: message })
    } finally {
      setIsImageProcessing(false)
    }
  }

  const isVideoMode = mode === 'video-to-sprite'
  const isProcessing = isVideoMode ? isVideoProcessing : isImageProcessing
  const operation = isVideoMode ? videoOperation : imageOperation
  const sourcePath = isVideoMode ? videoPath : imagePath
  const outputDir = isVideoMode ? videoOutputDir : imageOutputDir
  const status = isProcessing ? 'processing' : operation.status

  return (
    <div className="min-h-full bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-primary">
              <Grid3x3 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t('videoSpriteWorkbench')}
              </p>
              <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
                {t('videoSpriteTool')}
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">{t('videoSpriteDescription')}</p>
            </div>
          </div>
          <SegmentedControl
            value={mode}
            onChange={setMode}
            options={[
              { value: 'video-to-sprite', label: t('vsVideoToSprite'), icon: Film },
              { value: 'sprite-to-gif', label: t('vsSpriteToGif'), icon: ImageIcon }
            ]}
            ariaLabel={t('videoSpriteTool')}
          />
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] p-4 md:p-6">
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(380px,1.1fr)]">
          <Panel>
            <PanelHeader
              eyebrow="01"
              title={isVideoMode ? t('vsSelectVideo') : t('vsSelectImage')}
              description={isVideoMode ? t('vsVideoToSprite') : t('vsSpriteToGif')}
              action={
                sourcePath ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <StatusDot tone="success" />
                    {isVideoMode ? t('video') : t('image')}
                  </div>
                ) : undefined
              }
            />
            <PanelBody className="space-y-5">
              <button
                type="button"
                onClick={isVideoMode ? handleSelectVideo : handleSelectImage}
                disabled={isProcessing}
                className={cn(
                  'flex min-h-52 w-full flex-col items-center justify-center rounded-lg border border-dashed border-input bg-muted/25 px-6 py-8 text-center transition-colors',
                  'hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                  'disabled:cursor-not-allowed disabled:opacity-60'
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-card text-primary">
                  {isVideoMode ? (
                    <FileVideo className="h-6 w-6" />
                  ) : (
                    <FileImage className="h-6 w-6" />
                  )}
                </div>
                <span className="mt-4 text-sm font-medium text-foreground">
                  {sourcePath
                    ? fileNameFromPath(sourcePath)
                    : isVideoMode
                      ? t('vsSelectVideo')
                      : t('vsSelectImage')}
                </span>
                <span className="mt-1.5 text-xs text-muted-foreground">
                  {sourcePath
                    ? t('select')
                    : isVideoMode
                      ? t('vsSelectVideoFirst')
                      : t('vsSelectImageFirst')}
                </span>
              </button>

              <dl className="divide-y divide-border border-y border-border">
                <DataRow
                  label={isVideoMode ? t('vsSelectVideo') : t('vsSelectImage')}
                  value={sourcePath || '--'}
                />
                <DataRow label={t('outputFolder')} value={outputDir || '--'} />
                {isVideoMode ? (
                  <>
                    <DataRow label={t('vsTotalFrames')} value={videoTotalFrames} />
                    <DataRow label={t('vsFormat')} value={videoFormat.toUpperCase()} />
                  </>
                ) : (
                  <>
                    <DataRow label={t('vsFrameConfig')} value={`${frameWidth} × ${frameHeight}`} />
                    <DataRow label={t('vsFps')} value={`${imageFps} FPS`} />
                  </>
                )}
              </dl>
            </PanelBody>
          </Panel>

          <div className="space-y-5">
            <Panel>
              <PanelHeader
                eyebrow="02"
                title={t('vsConfig')}
                description={t('videoSpriteDescription')}
                action={<Settings2 className="h-4 w-4 text-muted-foreground" />}
              />
              <PanelBody className="space-y-5">
                {isVideoMode ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t('vsTotalFrames')}>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={videoTotalFrames}
                        onChange={(event) => setVideoTotalFrames(Number(event.target.value))}
                      />
                    </Field>
                    <Field label={t('vsScale')}>
                      <Select
                        value={String(videoScale)}
                        onValueChange={(value) => setVideoScale(Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">100%</SelectItem>
                          <SelectItem value="0.75">75%</SelectItem>
                          <SelectItem value="0.5">50%</SelectItem>
                          <SelectItem value="0.25">25%</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label={t('vsColumns')}>
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        value={videoColumns}
                        onChange={(event) => setVideoColumns(Number(event.target.value))}
                      />
                    </Field>
                    <Field label={t('vsFormat')}>
                      <Select
                        value={videoFormat}
                        onValueChange={(value: 'png' | 'jpg') => setVideoFormat(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="png">PNG</SelectItem>
                          <SelectItem value="jpg">JPG</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label={t('vsFrameWidth')}>
                      <Input
                        type="number"
                        min={1}
                        value={frameWidth}
                        onChange={(event) => setFrameWidth(Number(event.target.value))}
                      />
                    </Field>
                    <Field label={t('vsFrameHeight')}>
                      <Input
                        type="number"
                        min={1}
                        value={frameHeight}
                        onChange={(event) => setFrameHeight(Number(event.target.value))}
                      />
                    </Field>
                    <Field label={t('vsFps')}>
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        value={imageFps}
                        onChange={(event) => setImageFps(Number(event.target.value))}
                      />
                    </Field>
                    <Field label={t('vsRows')}>
                      <Input
                        type="number"
                        min={1}
                        value={gridRows}
                        onChange={(event) => setGridRows(Number(event.target.value))}
                      />
                    </Field>
                    <Field label={t('vsColumns')}>
                      <Input
                        type="number"
                        min={1}
                        value={gridColumns}
                        onChange={(event) => setGridColumns(Number(event.target.value))}
                      />
                    </Field>
                    <Field label={t('vsTotalFrames')}>
                      <Input
                        type="number"
                        min={1}
                        value={totalFrames}
                        onChange={(event) => setTotalFrames(Number(event.target.value))}
                      />
                    </Field>
                  </div>
                )}

                <Field label={t('outputFolder')}>
                  <div className="flex gap-2">
                    <Input
                      value={outputDir}
                      readOnly
                      placeholder={t('vsOutputDir')}
                      className="min-w-0 bg-background/50 font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleSelectOutputDir(isVideoMode ? 'video' : 'image')}
                      title={t('select')}
                      aria-label={t('select')}
                    >
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                  </div>
                </Field>

                <Button
                  size="lg"
                  className="w-full"
                  disabled={!sourcePath || isProcessing}
                  onClick={isVideoMode ? handleVideoToSprite : handleSpriteToGif}
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : isVideoMode ? (
                    <Download className="mr-2 h-4 w-4" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  {isProcessing
                    ? t('processing')
                    : isVideoMode
                      ? t('vsGenerateSprite')
                      : t('vsGenerateGif')}
                </Button>
              </PanelBody>
            </Panel>

            <Panel>
              <PanelHeader
                eyebrow="03"
                title={status === 'processing' ? t('processing') : t('preview')}
                action={
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <StatusDot
                      tone={
                        status === 'error'
                          ? 'error'
                          : status === 'success'
                            ? 'success'
                            : status === 'processing'
                              ? 'active'
                              : 'neutral'
                      }
                    />
                    {isVideoMode ? videoFormat.toUpperCase() : 'GIF'}
                  </div>
                }
              />
              <PanelBody aria-live="polite">
                {status === 'idle' && (
                  <EmptyState
                    icon={isVideoMode ? Grid3x3 : Film}
                    title={isVideoMode ? t('vsGenerateSprite') : t('vsGenerateGif')}
                    description={t('videoSpriteDescription')}
                  />
                )}
                {status === 'processing' && (
                  <div className="space-y-4">
                    <Notice tone="loading" title={t('processing')} description={sourcePath} />
                    <div className="h-1 overflow-hidden rounded-sm bg-muted">
                      <div className="h-full w-full animate-pulse bg-primary/50" />
                    </div>
                  </div>
                )}
                {status === 'success' && (
                  <div className="space-y-4">
                    <Notice
                      tone="success"
                      title={t('vsExportSuccess')}
                      description={operation.outputPath}
                    />
                    <dl className="divide-y divide-border border-y border-border">
                      <DataRow
                        label={t('outputFolder')}
                        value={operation.outputPath || outputDir || '--'}
                      />
                      <DataRow
                        label={t('vsFormat')}
                        value={isVideoMode ? videoFormat.toUpperCase() : 'GIF'}
                      />
                    </dl>
                  </div>
                )}
                {status === 'error' && (
                  <Notice
                    tone="error"
                    title={t('vsExportFailed')}
                    description={operation.message || t('error')}
                  />
                )}
              </PanelBody>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  )
}
