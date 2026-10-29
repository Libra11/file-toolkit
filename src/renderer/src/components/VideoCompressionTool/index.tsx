import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { File, Files, FileVideo, FolderOpen, Loader2, X } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { DataRow, Panel, PanelBody, PanelHeader } from '@renderer/components/ui/panel'
import { Progress } from '@renderer/components/ui/progress'
import { SegmentedControl } from '@renderer/components/ui/segmented-control'
import { EmptyState, Notice, StatusDot } from '@renderer/components/ui/states'
import { FileUploader } from './FileUploader'
import { VideoPreview } from './VideoPreview'
import { CompressionSettings } from './CompressionSettings'
import { CompressedVideoPreview } from './CompressedVideoPreview'
import {
  VideoFormat,
  VideoQualityPreset,
  VideoEncoder,
  VideoInfo,
  CompressionResult,
  VIDEO_QUALITY_PRESETS,
  VIDEO_ENCODERS
} from './types'
import { formatFileSize } from './utils'

interface VideoCompressionToolProps {
  onBack?: () => void
}

type CompressionMode = 'single' | 'batch'

export default function VideoCompressionTool({ onBack }: VideoCompressionToolProps): JSX.Element {
  // Navigation belongs to the outer workspace; keep the callback in the public API.
  void onBack
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionComplete, setCompressionComplete] = useState(false)
  const [activeTab, setActiveTab] = useState<CompressionMode>('single')
  const [videoInfo, setVideoInfo] = useState<VideoInfo>({})
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null)

  const [qualityPreset, setQualityPreset] = useState<VideoQualityPreset>(
    VIDEO_QUALITY_PRESETS.MEDIUM
  )
  const [outputFormat, setOutputFormat] = useState<VideoFormat>('original')
  const [encoder, setEncoder] = useState<VideoEncoder>(VIDEO_ENCODERS.H264)
  const [crf, setCrf] = useState<number>(23)
  const [preset, setPreset] = useState<string>('medium')
  const [width, setWidth] = useState<number | ''>('')
  const [height, setHeight] = useState<number | ''>('')
  const [fps, setFps] = useState<number | ''>('')
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)

  const [batchProgress, setBatchProgress] = useState<{
    current: number
    total: number
    currentFileName: string
  }>({ current: 0, total: 0, currentFileName: '' })

  const resetState = (): void => {
    setSelectedFiles([])
    setVideoUrl(null)
    setPreviewUrl(null)
    setCompressionResult(null)
    setCompressionComplete(false)
    setQualityPreset(VIDEO_QUALITY_PRESETS.MEDIUM)
    setOutputFormat('original')
    setEncoder(VIDEO_ENCODERS.H264)
    setCrf(23)
    setPreset('medium')
    setWidth('')
    setHeight('')
    setFps('')
    setVideoInfo({})
    setMaintainAspectRatio(true)
    setShowAdvanced(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleModeToggle = (value: CompressionMode): void => {
    if (value === activeTab) return
    resetState()
    setActiveTab(value)
  }

  const handleFileSelect = async (files: File[]): Promise<void> => {
    if (!files.length) return
    setSelectedFiles(files)

    if (activeTab === 'single' && files.length === 1) {
      const file = files[0]
      const url = URL.createObjectURL(file)
      setVideoUrl(url)

      try {
        const info = await window.compression.getVideoInfo(file.path)
        setVideoInfo({
          duration: info.duration,
          width: info.width,
          height: info.height,
          bitrate: info.bitrate,
          fps: info.fps,
          codec: info.codec,
          format: info.format || file.name.split('.').pop()
        })
      } catch (error) {
        console.error('获取视频信息失败:', error)
        setVideoInfo({ format: file.name.split('.').pop() })
      }
    }
  }

  useEffect(() => {
    return (): void => {
      if (videoUrl) URL.revokeObjectURL(videoUrl)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [videoUrl, previewUrl])

  const compressVideo = async (): Promise<void> => {
    if (!selectedFiles.length) return
    setIsCompressing(true)

    try {
      const inputFile = selectedFiles[0]
      const inputFileName = inputFile.name
      const extension = outputFormat === 'original' ? inputFileName.split('.').pop() : outputFormat
      const outputPath = await window.system.saveFile(
        `compressed_${inputFileName.split('.')[0]}.${extension}`
      )
      if (!outputPath) throw new Error(t('noOutputFileSelected'))

      const options = {
        format: outputFormat === 'original' ? undefined : outputFormat,
        encoder,
        crf,
        preset,
        width: width || undefined,
        height: height || undefined,
        fps: fps || undefined,
        maintainAspectRatio
      }

      const result = await window.compression.compressVideo(inputFile.path, outputPath, options)
      setCompressionResult({
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        compressionRatio: result.originalSize / result.compressedSize,
        outputPath: result.outputPath,
        format: result.format || extension || '',
        duration: result.duration || videoInfo.duration,
        width: result.width || width || videoInfo.width,
        height: result.height || height || videoInfo.height
      })
      setPreviewUrl(`myapp:///${result.outputPath}`)
      setIsCompressing(false)
      setCompressionComplete(true)
    } catch (error) {
      console.error('视频压缩失败:', error)
      setIsCompressing(false)
    }
  }

  const batchCompressVideos = async (): Promise<void> => {
    if (!selectedFiles.length) return
    setIsCompressing(true)
    setCompressionComplete(false)
    setBatchProgress({ current: 0, total: selectedFiles.length, currentFileName: '' })

    try {
      const outputDir = await window.system.selectDirectory()
      if (!outputDir) throw new Error(t('noOutputDirectorySelected'))

      const options = {
        format: outputFormat === 'original' ? undefined : outputFormat,
        encoder,
        crf,
        preset,
        width: width || undefined,
        height: height || undefined,
        fps: fps || undefined,
        maintainAspectRatio
      }
      const results: CompressionResult[] = []

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        setBatchProgress({
          current: i + 1,
          total: selectedFiles.length,
          currentFileName: file.name
        })

        try {
          const inputFileName = file.name
          const extension =
            outputFormat === 'original' ? inputFileName.split('.').pop() : outputFormat
          const outputFileName = `${inputFileName.split('.')[0]}_compressed.${extension}`
          const outputPath = `${outputDir}/${outputFileName}`
          const result = await window.compression.compressVideo(file.path, outputPath, options)

          results.push({
            originalSize: result.originalSize,
            compressedSize: result.compressedSize,
            compressionRatio: result.originalSize / result.compressedSize,
            outputPath: result.outputPath,
            format: result.format || extension || '',
            fileName: file.name
          })
        } catch (error) {
          console.error(`压缩视频 ${file.name} 失败:`, error)
        }
      }

      if (results.length > 0) {
        const totalOriginalSize = results.reduce((sum, result) => sum + result.originalSize, 0)
        const totalCompressedSize = results.reduce((sum, result) => sum + result.compressedSize, 0)
        setCompressionResult({
          batchResults: results,
          totalOriginalSize,
          totalCompressedSize,
          fileCount: results.length,
          originalSize: totalOriginalSize,
          compressedSize: totalCompressedSize,
          compressionRatio: totalOriginalSize / totalCompressedSize,
          outputPath: outputDir,
          format: ''
        })
        setCompressionComplete(true)
      }
    } catch (error) {
      console.error('批量压缩过程中出错:', error)
    } finally {
      setIsCompressing(false)
      setBatchProgress({ current: 0, total: 0, currentFileName: '' })
    }
  }

  const handleReset = (): void => {
    resetState()
  }

  const isBatch = activeTab === 'batch'
  const batchResults = compressionResult?.batchResults || []
  const hasInput = selectedFiles.length > 0
  const hasResult = isBatch
    ? batchResults.length > 0
    : compressionComplete && Boolean(compressionResult)
  const selectedBatchSize = selectedFiles.reduce((sum, file) => sum + file.size, 0)
  const totalOriginalSize = compressionResult?.totalOriginalSize || 0
  const totalCompressedSize = compressionResult?.totalCompressedSize || 0
  const totalSavedPercent = totalOriginalSize
    ? Math.round(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100)
    : 0
  const currentFile = selectedFiles[0]

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="mx-auto max-w-[1680px] space-y-5 p-4 md:p-6">
        <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary">
              <FileVideo className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-[-0.01em] text-foreground">
                {t('videoCompression')}
              </h1>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                {t('videoCompressionDescription')}
              </p>
            </div>
          </div>
          <SegmentedControl<CompressionMode>
            value={activeTab}
            onChange={handleModeToggle}
            ariaLabel={t('videoCompressionTool')}
            className="w-full sm:w-auto"
            options={[
              { value: 'single', label: t('singleFileMode'), icon: File },
              { value: 'batch', label: t('batchMode'), icon: Files }
            ]}
          />
        </header>

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(240px,0.78fr)_minmax(300px,0.95fr)_minmax(360px,1.27fr)]">
          <Panel>
            <PanelHeader
              eyebrow="01"
              title={isBatch ? t('fileList') : t('inputFile')}
              description={isBatch ? t('selectVideosToCompress') : t('selectVideoFile')}
              action={
                hasInput ? (
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <StatusDot tone="success" />
                    {selectedFiles.length}
                  </span>
                ) : undefined
              }
            />
            <PanelBody className="space-y-4">
              <FileUploader
                onFileSelect={handleFileSelect}
                fileInputRef={fileInputRef}
                batchMode={isBatch}
              />

              {!isBatch && currentFile && (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/25 px-3 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-card text-primary">
                    <FileVideo className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-xs font-medium text-foreground"
                      title={currentFile.name}
                    >
                      {currentFile.name}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatFileSize(currentFile.size)}
                    </p>
                  </div>
                </div>
              )}

              {isBatch && selectedFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-foreground">
                      {t('selectedFiles')} · {selectedFiles.length}
                    </span>
                    <span className="text-muted-foreground">
                      {formatFileSize(selectedBatchSize)}
                    </span>
                  </div>
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${file.lastModified}-${index}`}
                        className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
                          <FileVideo className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate text-xs font-medium text-foreground"
                            title={file.name}
                          >
                            {file.name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 shrink-0 px-0"
                          onClick={() => {
                            const newFiles = [...selectedFiles]
                            newFiles.splice(index, 1)
                            setSelectedFiles(newFiles)
                          }}
                          aria-label={`${t('remove')} ${file.name}`}
                          title={t('remove')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              eyebrow="02"
              title={t('compressionSettings')}
              description={
                isBatch ? t('videoBatchSettingsHint') : t('videoCompressionSettingsHint')
              }
            />
            <PanelBody className="space-y-5">
              <CompressionSettings
                qualityPreset={qualityPreset}
                outputFormat={outputFormat}
                encoder={encoder}
                crf={crf}
                preset={preset}
                width={width}
                height={height}
                fps={fps}
                maintainAspectRatio={maintainAspectRatio}
                showAdvanced={showAdvanced}
                videoInfo={videoInfo}
                isBatchMode={isBatch}
                onQualityPresetChange={setQualityPreset}
                onFormatChange={setOutputFormat}
                onEncoderChange={setEncoder}
                onCrfChange={setCrf}
                onPresetChange={setPreset}
                onWidthChange={setWidth}
                onHeightChange={setHeight}
                onFpsChange={setFps}
                onMaintainAspectRatioChange={setMaintainAspectRatio}
                onShowAdvancedChange={setShowAdvanced}
              />

              {!hasInput && (
                <Notice
                  title={t('noFileChosen')}
                  description={isBatch ? t('selectVideosToCompress') : t('selectVideoFile')}
                />
              )}

              <div className="space-y-3 border-t border-border pt-4">
                <Button
                  type="button"
                  className="w-full"
                  onClick={isBatch ? batchCompressVideos : compressVideo}
                  disabled={!hasInput || isCompressing}
                >
                  {isCompressing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileVideo className="mr-2 h-4 w-4" />
                  )}
                  {isCompressing
                    ? isBatch
                      ? t('batchCompressing')
                      : t('compressing')
                    : isBatch
                      ? t('batchCompression')
                      : t('compressVideo')}
                </Button>

                {isBatch && isCompressing && batchProgress.total > 0 && (
                  <div className="space-y-2">
                    <Notice
                      tone="loading"
                      title={batchProgress.currentFileName || t('processing')}
                      description={t('processingFile', {
                        current: batchProgress.current,
                        total: batchProgress.total,
                        filename: batchProgress.currentFileName
                      })}
                    />
                    <Progress
                      value={(batchProgress.current / batchProgress.total) * 100}
                      className="h-1.5"
                    />
                  </div>
                )}
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              eyebrow="03"
              title={hasResult ? t('compressionResult') : t('preview')}
              description={hasResult ? t('outputFiles') : t('videoCompressionTool')}
              action={
                hasResult ? (
                  <span className="flex items-center gap-2 text-xs font-medium text-primary">
                    <StatusDot tone="success" />
                    {t('compressionComplete')}
                  </span>
                ) : undefined
              }
            />
            <PanelBody>
              {isBatch ? (
                batchResults.length > 0 && compressionResult ? (
                  <div className="space-y-4">
                    <Notice
                      tone="success"
                      title={t('batchCompressionSuccess')}
                      description={t('successCount', {
                        count: batchResults.length,
                        total: selectedFiles.length
                      })}
                    />
                    <dl className="grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-muted/25 py-3">
                      <div className="px-3">
                        <dt className="text-[11px] text-muted-foreground">{t('fileCount')}</dt>
                        <dd className="mt-1 text-lg font-semibold text-foreground">
                          {batchResults.length}
                        </dd>
                      </div>
                      <div className="px-3">
                        <dt className="text-[11px] text-muted-foreground">{t('originalSize')}</dt>
                        <dd
                          className="mt-1 truncate text-sm font-semibold text-foreground"
                          title={formatFileSize(totalOriginalSize)}
                        >
                          {formatFileSize(totalOriginalSize)}
                        </dd>
                      </div>
                      <div className="px-3">
                        <dt className="text-[11px] text-muted-foreground">{t('saved')}</dt>
                        <dd className="mt-1 text-lg font-semibold text-primary">
                          {totalSavedPercent}%
                        </dd>
                      </div>
                    </dl>
                    <dl className="divide-y divide-border border-y border-border">
                      <DataRow
                        label={t('totalOriginalSize')}
                        value={formatFileSize(totalOriginalSize)}
                      />
                      <DataRow
                        label={t('totalCompressedSize')}
                        value={formatFileSize(totalCompressedSize)}
                      />
                      <DataRow
                        label={t('saved')}
                        value={
                          <span className="text-primary">
                            {formatFileSize(totalOriginalSize - totalCompressedSize)}
                          </span>
                        }
                      />
                      <DataRow label={t('outputFolder')} value={compressionResult.outputPath} />
                    </dl>
                    <div className="max-h-56 divide-y divide-border overflow-y-auto border-y border-border">
                      {batchResults.map((result, index) => (
                        <div
                          key={`${result.outputPath}-${index}`}
                          className="flex items-center gap-3 py-2.5 text-xs"
                        >
                          <span
                            className="min-w-0 flex-1 truncate font-medium text-foreground"
                            title={result.outputPath}
                          >
                            {result.fileName || `${t('video')} ${index + 1}`}
                          </span>
                          <span className="shrink-0 text-muted-foreground">
                            {formatFileSize(result.originalSize)} →{' '}
                            {formatFileSize(result.compressedSize)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          window.electron.ipcRenderer.invoke(
                            'open-file-location',
                            compressionResult.outputPath
                          )
                        }
                      >
                        <FolderOpen className="mr-2 h-4 w-4" />
                        {t('openOutputFolder')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={handleReset}
                      >
                        <FileVideo className="mr-2 h-4 w-4" />
                        {t('compressMore')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedFiles.length > 0 && (
                      <dl className="grid grid-cols-2 divide-x divide-border rounded-lg border border-border bg-muted/25 py-4">
                        <div className="px-4">
                          <dt className="text-[11px] text-muted-foreground">{t('fileCount')}</dt>
                          <dd className="mt-1 text-lg font-semibold text-foreground">
                            {selectedFiles.length}
                          </dd>
                        </div>
                        <div className="px-4">
                          <dt className="text-[11px] text-muted-foreground">{t('originalSize')}</dt>
                          <dd className="mt-1 text-sm font-semibold text-foreground">
                            {formatFileSize(selectedBatchSize)}
                          </dd>
                        </div>
                      </dl>
                    )}
                    <EmptyState
                      icon={FileVideo}
                      title={t('compressionResult')}
                      description={
                        selectedFiles.length
                          ? t('videoBatchSettingsHint')
                          : t('selectVideosToCompress')
                      }
                      className="min-h-64"
                    />
                  </div>
                )
              ) : currentFile ? (
                compressionComplete && compressionResult ? (
                  <CompressedVideoPreview
                    compressionResult={compressionResult}
                    previewUrl={previewUrl}
                    onReset={handleReset}
                  />
                ) : (
                  <VideoPreview
                    videoUrl={videoUrl}
                    fileName={currentFile.name}
                    fileSize={currentFile.size}
                    videoInfo={videoInfo}
                  />
                )
              ) : (
                <EmptyState
                  icon={FileVideo}
                  title={t('preview')}
                  description={t('selectVideoFile')}
                  className="min-h-64"
                />
              )}
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  )
}
