import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { File, Files, FolderOpen, Loader2, Music, X } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { DataRow, Panel, PanelBody, PanelHeader } from '@renderer/components/ui/panel'
import { Progress } from '@renderer/components/ui/progress'
import { SegmentedControl } from '@renderer/components/ui/segmented-control'
import { EmptyState, Notice, StatusDot } from '@renderer/components/ui/states'
import { FileUploader } from './FileUploader'
import { CompressionSettings } from './CompressionSettings'
import { AudioPreview } from './AudioPreview'
import { CompressedAudioPreview } from './CompressedAudioPreview'
import {
  AudioFormat,
  AudioQualityPreset,
  CompressionResult,
  AudioInfo,
  CompressionOptions,
  AUDIO_FORMATS,
  AUDIO_QUALITY_PRESETS
} from './types'

interface AudioCompressionToolProps {
  onBack?: () => void
}

type CompressionMode = 'single' | 'batch'

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(2)} ${units[index]}`
}

export default function AudioCompressionTool({ onBack }: AudioCompressionToolProps): JSX.Element {
  // Navigation belongs to the outer workspace; keep the callback in the public API.
  void onBack
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeMode, setActiveMode] = useState<CompressionMode>('single')

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [batchResults, setBatchResults] = useState<CompressionResult[]>([])
  const [batchProgress, setBatchProgress] = useState(0)
  const [currentProcessingFile, setCurrentProcessingFile] = useState<string | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [originalAudioUrl, setOriginalAudioUrl] = useState<string | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [audioInfo, setAudioInfo] = useState<AudioInfo>({})

  const [qualityPreset, setQualityPreset] = useState<AudioQualityPreset>(
    AUDIO_QUALITY_PRESETS.MEDIUM
  )
  const [outputFormat, setOutputFormat] = useState<AudioFormat>('original')
  const [bitrate, setBitrate] = useState('128k')
  const [sampleRate, setSampleRate] = useState<number | ''>('')
  const [channels, setChannels] = useState<number | ''>('')

  const totalBatchOriginalSize = batchResults.reduce((sum, result) => sum + result.originalSize, 0)
  const totalBatchCompressedSize = batchResults.reduce(
    (sum, result) => sum + result.compressedSize,
    0
  )
  const totalBatchSavedPercent = totalBatchOriginalSize
    ? Math.round(
        ((totalBatchOriginalSize - totalBatchCompressedSize) / totalBatchOriginalSize) * 100
      )
    : 0

  useEffect(() => {
    if (!selectedFile || !originalAudioUrl) return

    const tempAudio = new Audio(originalAudioUrl)
    const handleLoadedMetadata = (): void => {
      const format = selectedFile.name.split('.').pop()?.toLowerCase() || ''
      const duration = tempAudio.duration
      setAudioInfo({
        duration: duration ? Math.round(duration) : undefined,
        format,
        bitrate: 128,
        channels: 2,
        sampleRate: 44100
      })
    }
    const handleError = (): void => {
      console.error('无法加载音频元数据')
    }

    tempAudio.addEventListener('loadedmetadata', handleLoadedMetadata)
    tempAudio.addEventListener('error', handleError)
    return (): void => {
      tempAudio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      tempAudio.removeEventListener('error', handleError)
    }
  }, [selectedFile, originalAudioUrl])

  const resetState = (): void => {
    setSelectedFile(null)
    setSelectedFiles([])
    setCompressionResult(null)
    setBatchResults([])
    setOriginalAudioUrl(null)
    setPreviewUrl(null)
    setQualityPreset(AUDIO_QUALITY_PRESETS.MEDIUM)
    setOutputFormat('original')
    setBitrate('128k')
    setSampleRate('')
    setChannels('')
    setAudioInfo({})
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleModeToggle = (value: CompressionMode): void => {
    if (value === activeMode) return
    resetState()
    setActiveMode(value)
  }

  const handlePresetChange = (value: AudioQualityPreset): void => {
    setQualityPreset(value)
    if (value === AUDIO_QUALITY_PRESETS.CUSTOM) return

    switch (value) {
      case AUDIO_QUALITY_PRESETS.HIGH:
        setBitrate('256k')
        break
      case AUDIO_QUALITY_PRESETS.MEDIUM:
        setBitrate('128k')
        break
      case AUDIO_QUALITY_PRESETS.LOW:
        setBitrate('64k')
        break
    }
  }

  const handleFormatChange = (value: AudioFormat): void => {
    setOutputFormat(value)
    if (qualityPreset !== AUDIO_QUALITY_PRESETS.CUSTOM) handlePresetChange(qualityPreset)
  }

  const handleBitrateChange = (value: string): void => {
    setQualityPreset(AUDIO_QUALITY_PRESETS.CUSTOM)
    setBitrate(value)
  }

  const handleSampleRateChange = (value: number | ''): void => {
    setSampleRate(value)
  }

  const handleChannelsChange = (value: number | ''): void => {
    setChannels(value)
  }

  const handleSingleFileSelect = (files: File[]): void => {
    if (!files.length) return
    const file = files[0]
    setCompressionResult(null)
    setPreviewUrl(null)
    setSelectedFile(file)
    setOriginalAudioUrl(URL.createObjectURL(file))
  }

  const handleBatchFileSelect = (files: File[]): void => {
    if (!files.length) return
    setSelectedFiles([...selectedFiles, ...files])
    setBatchResults([])
  }

  const handleRemoveFile = (index: number): void => {
    const newFiles = [...selectedFiles]
    newFiles.splice(index, 1)
    setSelectedFiles(newFiles)
  }

  const createCompressionOptions = (): CompressionOptions => {
    let formatToUse: 'mp3' | 'aac' | 'ogg' | 'wav' | undefined = undefined
    if (outputFormat === AUDIO_FORMATS.MP3) formatToUse = 'mp3'
    else if (outputFormat === AUDIO_FORMATS.AAC) formatToUse = 'aac'
    else if (outputFormat === AUDIO_FORMATS.OGG) formatToUse = 'ogg'
    else if (outputFormat === AUDIO_FORMATS.WAV) formatToUse = 'wav'

    const options: CompressionOptions = { bitrate, format: formatToUse }
    if (sampleRate) options.sampleRate = sampleRate
    if (channels) options.channels = channels
    return options
  }

  const compressSingleAudio = async (): Promise<void> => {
    if (!selectedFile) return
    setIsCompressing(true)

    try {
      const options = createCompressionOptions()
      const originalExt = selectedFile.name.split('.').pop()?.toLowerCase() || ''
      const formatToUse = options.format || (originalExt as 'mp3' | 'aac' | 'ogg' | 'wav')
      const outputPath = await window.system.saveFile(
        `compressed_${selectedFile.name}${options.format ? '.' + options.format : ''}`
      )
      if (!outputPath) throw new Error(t('noOutputFileSelected'))

      const response = await window.electron.ipcRenderer.invoke(
        'compress-audio',
        selectedFile.path,
        outputPath,
        bitrate,
        sampleRate || undefined,
        channels || undefined,
        outputFormat === 'original' ? undefined : formatToUse
      )

      const compressionData: CompressionResult = {
        originalSize: response.originalSize,
        compressedSize: response.compressedSize,
        compressionRatio: response.originalSize / response.compressedSize,
        outputPath: response.outputPath,
        format: formatToUse
      }
      setCompressionResult(compressionData)
      setPreviewUrl(`myapp:///${compressionData.outputPath}`)
    } catch (error) {
      console.error('音频压缩失败:', error)
    } finally {
      setIsCompressing(false)
    }
  }

  const batchCompressAudios = async (): Promise<void> => {
    if (!selectedFiles.length) return
    setBatchProgress(0)
    setBatchResults([])
    setCurrentProcessingFile(null)

    try {
      const options = createCompressionOptions()
      const outputDir = await window.system.selectDirectory()
      if (!outputDir) throw new Error(t('noOutputDirectorySelected'))

      setIsCompressing(true)
      const results: CompressionResult[] = []
      setCurrentProcessingFile(selectedFiles[0].name)

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        setCurrentProcessingFile(file.name)

        try {
          const originalExt = file.name.split('.').pop()?.toLowerCase() || ''
          const formatToUse = options.format || (originalExt as 'mp3' | 'aac' | 'ogg' | 'wav')
          const outputFileName = `${file.name.substring(
            0,
            file.name.lastIndexOf('.')
          )}_compressed.${formatToUse}`
          const outputPath = `${outputDir}/${outputFileName}`

          const response = await window.electron.ipcRenderer.invoke(
            'compress-audio',
            file.path,
            outputPath,
            bitrate,
            sampleRate || undefined,
            channels || undefined,
            outputFormat === 'original' ? undefined : formatToUse
          )

          results.push({
            originalSize: response.originalSize,
            compressedSize: response.compressedSize,
            compressionRatio: response.originalSize / response.compressedSize,
            outputPath: response.outputPath,
            format: formatToUse
          })
        } catch (error) {
          console.error(`压缩音频 ${file.name} 失败:`, error)
        }

        setBatchProgress(Math.round(((i + 1) / selectedFiles.length) * 100))
      }

      setBatchResults(results)
      setCurrentProcessingFile(null)
    } catch (error) {
      console.error('批量压缩过程中出错:', error)
    } finally {
      setIsCompressing(false)
    }
  }

  useEffect(() => {
    return (): void => {
      if (originalAudioUrl) URL.revokeObjectURL(originalAudioUrl)
      if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    }
  }, [originalAudioUrl, previewUrl])

  const isBatch = activeMode === 'batch'
  const hasInput = isBatch ? selectedFiles.length > 0 : Boolean(selectedFile)
  const hasResult = isBatch ? batchResults.length > 0 : Boolean(compressionResult)
  const selectedBatchSize = selectedFiles.reduce((sum, file) => sum + file.size, 0)
  const firstBatchPath = batchResults[0]?.outputPath || ''
  const batchPathSeparator = Math.max(
    firstBatchPath.lastIndexOf('/'),
    firstBatchPath.lastIndexOf('\\')
  )
  const batchOutputDir =
    batchPathSeparator >= 0 ? firstBatchPath.substring(0, batchPathSeparator) : ''

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="mx-auto max-w-[1680px] space-y-5 p-4 md:p-6">
        <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary">
              <Music className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-[-0.01em] text-foreground">
                {t('audioCompression')}
              </h1>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                {t('audioCompressionDescription')}
              </p>
            </div>
          </div>
          <SegmentedControl<CompressionMode>
            value={activeMode}
            onChange={handleModeToggle}
            ariaLabel={t('audioCompressionTool')}
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
              description={isBatch ? t('selectFilesToCompress') : t('selectFile')}
              action={
                hasInput ? (
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <StatusDot tone="success" />
                    {isBatch ? selectedFiles.length : 1}
                  </span>
                ) : undefined
              }
            />
            <PanelBody className="space-y-4">
              <FileUploader
                onFileSelect={isBatch ? handleBatchFileSelect : handleSingleFileSelect}
                fileInputRef={fileInputRef}
                isBatchMode={isBatch}
              />

              {!isBatch && selectedFile && (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/25 px-3 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-card text-primary">
                    <Music className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-xs font-medium text-foreground"
                      title={selectedFile.name}
                    >
                      {selectedFile.name}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
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
                          <Music className="h-4 w-4" />
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
                          onClick={() => handleRemoveFile(index)}
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
                isBatch ? t('audioBatchSettingsHint') : t('audioCompressionSettingsHint')
              }
            />
            <PanelBody className="space-y-5">
              <CompressionSettings
                originalSize={isBatch ? selectedBatchSize : selectedFile?.size || 0}
                qualityPreset={qualityPreset}
                outputFormat={outputFormat}
                bitrate={bitrate}
                sampleRate={sampleRate}
                channels={channels}
                onQualityPresetChange={handlePresetChange}
                onFormatChange={handleFormatChange}
                onBitrateChange={handleBitrateChange}
                onSampleRateChange={handleSampleRateChange}
                onChannelsChange={handleChannelsChange}
              />

              {!hasInput && (
                <Notice
                  title={t('noFileChosen')}
                  description={isBatch ? t('selectFilesToCompress') : t('selectFile')}
                />
              )}

              <div className="space-y-3 border-t border-border pt-4">
                <Button
                  type="button"
                  className="w-full"
                  onClick={isBatch ? batchCompressAudios : compressSingleAudio}
                  disabled={!hasInput || isCompressing}
                >
                  {isCompressing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Music className="mr-2 h-4 w-4" />
                  )}
                  {isCompressing
                    ? isBatch
                      ? t('batchCompressing')
                      : t('compressing')
                    : isBatch
                      ? t('batchCompression')
                      : t('compressAudio')}
                </Button>

                {isBatch && isCompressing && (
                  <div className="space-y-2">
                    <Notice
                      tone="loading"
                      title={currentProcessingFile || t('processing')}
                      description={`${batchProgress}%`}
                    />
                    <Progress value={batchProgress} className="h-1.5" />
                  </div>
                )}
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              eyebrow="03"
              title={hasResult ? t('compressionResult') : t('preview')}
              description={hasResult ? t('outputFiles') : t('audioCompressionTool')}
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
                batchResults.length > 0 ? (
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
                          title={formatFileSize(totalBatchOriginalSize)}
                        >
                          {formatFileSize(totalBatchOriginalSize)}
                        </dd>
                      </div>
                      <div className="px-3">
                        <dt className="text-[11px] text-muted-foreground">{t('saved')}</dt>
                        <dd className="mt-1 text-lg font-semibold text-primary">
                          {totalBatchSavedPercent}%
                        </dd>
                      </div>
                    </dl>
                    <dl className="divide-y divide-border border-y border-border">
                      <DataRow
                        label={t('originalSize')}
                        value={formatFileSize(totalBatchOriginalSize)}
                      />
                      <DataRow
                        label={t('compressedSize')}
                        value={formatFileSize(totalBatchCompressedSize)}
                      />
                      <DataRow
                        label={t('saved')}
                        value={
                          <span className="text-primary">
                            {formatFileSize(totalBatchOriginalSize - totalBatchCompressedSize)}
                          </span>
                        }
                      />
                      {batchOutputDir && (
                        <DataRow label={t('outputFolder')} value={batchOutputDir} />
                      )}
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
                            {selectedFiles[index]?.name || `${t('audio')} ${index + 1}`}
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
                        disabled={!batchOutputDir}
                        onClick={() => {
                          if (
                            batchOutputDir &&
                            window.system &&
                            typeof window.system.openFileLocation === 'function'
                          ) {
                            window.system.openFileLocation(batchOutputDir)
                          }
                        }}
                      >
                        <FolderOpen className="mr-2 h-4 w-4" />
                        {t('openOutputFolder')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={resetState}
                      >
                        <Music className="mr-2 h-4 w-4" />
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
                      icon={Music}
                      title={t('compressionResult')}
                      description={
                        selectedFiles.length
                          ? t('audioBatchSettingsHint')
                          : t('selectFilesToCompress')
                      }
                      className="min-h-64"
                    />
                  </div>
                )
              ) : selectedFile ? (
                compressionResult && previewUrl ? (
                  <div className="space-y-3">
                    <CompressedAudioPreview
                      compressionResult={compressionResult}
                      previewUrl={previewUrl}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={resetState}
                    >
                      <Music className="mr-2 h-4 w-4" />
                      {t('compressAnother')}
                    </Button>
                  </div>
                ) : originalAudioUrl ? (
                  <AudioPreview
                    audioUrl={originalAudioUrl}
                    fileName={selectedFile.name}
                    fileSize={selectedFile.size}
                    audioInfo={audioInfo}
                  />
                ) : (
                  <EmptyState
                    icon={Music}
                    title={t('audioPreview')}
                    description={selectedFile.name}
                  />
                )
              ) : (
                <EmptyState
                  icon={Music}
                  title={t('audioPreview')}
                  description={t('selectFile')}
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
