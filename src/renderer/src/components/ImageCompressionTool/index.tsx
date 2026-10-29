import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { File, Files, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Panel, PanelBody, PanelHeader } from '@renderer/components/ui/panel'
import { Progress } from '@renderer/components/ui/progress'
import { SegmentedControl } from '@renderer/components/ui/segmented-control'
import { EmptyState, Notice, StatusDot } from '@renderer/components/ui/states'
import { FileUploader } from './FileUploader'
import { ImagePreview } from './ImagePreview'
import { CompressionSettings } from './CompressionSettings'
import { CompressedPreview } from './CompressedPreview'
import { FileList } from './FileList'
import { BatchCompressionResult } from './BatchCompressionResult'
import {
  ImageFormat,
  ImageQualityPreset,
  WebpPreset,
  CompressionResult,
  ImageInfo,
  CompressionOptions,
  IMAGE_FORMATS,
  IMAGE_QUALITY_PRESETS,
  WEBP_PRESETS
} from './types'
import { estimateCompressedSize, formatBytes } from './utils'

interface ImageCompressionToolProps {
  onBack?: () => void
}

type CompressionMode = 'single' | 'batch'

export default function ImageCompressionTool({ onBack }: ImageCompressionToolProps): JSX.Element {
  // Navigation belongs to the outer workspace; keep the callback in the public API.
  void onBack
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [activeMode, setActiveMode] = useState<CompressionMode>('single')

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [batchResults, setBatchResults] = useState<CompressionResult[]>([])
  const [batchProgress, setBatchProgress] = useState(0)
  const [currentProcessingFile, setCurrentProcessingFile] = useState<string | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [imageInfo, setImageInfo] = useState<ImageInfo>({})

  const [qualityPreset, setQualityPreset] = useState<ImageQualityPreset>(
    IMAGE_QUALITY_PRESETS.MEDIUM
  )
  const [outputFormat, setOutputFormat] = useState<ImageFormat>('original')
  const [qualityValue, setQualityValue] = useState(75)
  const [compressionLevel, setCompressionLevel] = useState(6)
  const [outputWidth, setOutputWidth] = useState<number | ''>('')
  const [outputHeight, setOutputHeight] = useState<number | ''>('')
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true)
  const [webpPreset, setWebpPreset] = useState<WebpPreset>(WEBP_PRESETS.DEFAULT)
  const [webpLossless, setWebpLossless] = useState(false)
  const [enableBatchResize, setEnableBatchResize] = useState(false)

  const resetState = (): void => {
    setSelectedFile(null)
    setSelectedFiles([])
    setCompressionResult(null)
    setBatchResults([])
    setOriginalImageUrl(null)
    setPreviewUrl(null)
    setQualityPreset(IMAGE_QUALITY_PRESETS.MEDIUM)
    setOutputFormat('original')
    setQualityValue(75)
    setCompressionLevel(6)
    setOutputWidth('')
    setOutputHeight('')
    setMaintainAspectRatio(true)
    setWebpPreset(WEBP_PRESETS.DEFAULT)
    setWebpLossless(false)
    setEnableBatchResize(false)
    setImageInfo({})
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleModeToggle = (value: CompressionMode): void => {
    if (value === activeMode) return
    resetState()
    setActiveMode(value)
  }

  const handlePresetChange = (value: ImageQualityPreset): void => {
    setQualityPreset(value)
    if (value === IMAGE_QUALITY_PRESETS.CUSTOM) return

    switch (value) {
      case IMAGE_QUALITY_PRESETS.HIGH:
        setQualityValue(90)
        setCompressionLevel(3)
        break
      case IMAGE_QUALITY_PRESETS.MEDIUM:
        setQualityValue(75)
        setCompressionLevel(6)
        break
      case IMAGE_QUALITY_PRESETS.LOW:
        setQualityValue(50)
        setCompressionLevel(9)
        break
    }
  }

  const handleFormatChange = (value: ImageFormat): void => {
    setOutputFormat(value)
    if (qualityPreset !== IMAGE_QUALITY_PRESETS.CUSTOM) handlePresetChange(qualityPreset)
  }

  const handleQualityChange = (value: number): void => {
    setQualityPreset(IMAGE_QUALITY_PRESETS.CUSTOM)
    setQualityValue(value)
    if (outputFormat === IMAGE_FORMATS.PNG) {
      setCompressionLevel(Math.round(((100 - value) * 9) / 100))
    }
  }

  const handleCompressionLevelChange = (value: number): void => {
    setQualityPreset(IMAGE_QUALITY_PRESETS.CUSTOM)
    setCompressionLevel(value)
    if (outputFormat === IMAGE_FORMATS.PNG) {
      setQualityValue(Math.round(((9 - value) * 100) / 9))
    }
  }

  const handleSingleFileSelect = (files: File[]): void => {
    if (!files.length) return
    const file = files[0]
    setCompressionResult(null)
    setPreviewUrl(null)
    setSelectedFile(file)

    const objectUrl = URL.createObjectURL(file)
    setOriginalImageUrl(objectUrl)

    const img = new Image()
    img.onload = (): void => {
      setImageInfo({ width: img.width, height: img.height })
      setOutputWidth('')
      setOutputHeight('')
    }
    img.src = objectUrl
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

  const createCompressionOptions = (isBatch: boolean = false): CompressionOptions => {
    let formatToUse: 'jpg' | 'png' | 'webp' | undefined = undefined
    if (outputFormat === IMAGE_FORMATS.JPG) formatToUse = 'jpg'
    else if (outputFormat === IMAGE_FORMATS.PNG) formatToUse = 'png'
    else if (outputFormat === IMAGE_FORMATS.WEBP) formatToUse = 'webp'

    const options: CompressionOptions = { format: formatToUse }

    if (formatToUse === 'jpg') {
      options.quality = Math.round(((100 - qualityValue) * 29) / 100 + 2)
    } else if (formatToUse === 'webp') {
      if (webpLossless) {
        options.lossless = true
        options.compressionLevel = compressionLevel
      } else {
        options.quality = qualityValue
        options.lossless = false
      }
      options.preset = webpPreset
    } else if (formatToUse === 'png') {
      options.compressionLevel = compressionLevel
    }

    if (isBatch) {
      if (enableBatchResize) {
        if (outputWidth && Number(outputWidth) > 0) options.width = Number(outputWidth)
        if (outputHeight && Number(outputHeight) > 0) options.height = Number(outputHeight)
      }
    } else {
      if (outputWidth && Number(outputWidth) > 0) options.width = Number(outputWidth)
      if (outputHeight && Number(outputHeight) > 0) options.height = Number(outputHeight)
    }

    return options
  }

  const compressSingleImage = async (): Promise<void> => {
    if (!selectedFile) return
    setIsCompressing(true)

    try {
      const options = createCompressionOptions(false)
      const originalExt = selectedFile.name.split('.').pop()?.toLowerCase() || ''
      const formatToUse = options.format || (originalExt as 'jpg' | 'png' | 'webp')
      const outputPath = await window.system.saveFile(
        `compressed_${selectedFile.name}${options.format ? '.' + options.format : ''}`
      )
      if (!outputPath) throw new Error(t('noOutputFileSelected'))

      const originalSize = selectedFile.size
      const apiResult = await window.compression.compressImage(
        selectedFile.path,
        outputPath,
        options
      )

      let compressedSize = apiResult.compressedSize
      if (!compressedSize || compressedSize <= 0) {
        try {
          compressedSize = estimateCompressedSize(originalSize, qualityPreset)
        } catch (err) {
          console.error('估计文件大小失败:', err)
          compressedSize = Math.round(originalSize * 0.7)
        }
      }

      const compressionData: CompressionResult = {
        originalSize,
        compressedSize,
        compressionRatio: originalSize / (compressedSize || 1),
        outputPath: apiResult.outputPath || outputPath,
        newWidth: apiResult.newWidth,
        newHeight: apiResult.newHeight,
        format: formatToUse || 'jpg'
      }

      setCompressionResult(compressionData)
      if (compressionData.outputPath) {
        setPreviewUrl(`myapp:///${compressionData.outputPath}`)
      }
    } catch (error) {
      console.error('压缩过程中出错:', error)
    } finally {
      setIsCompressing(false)
    }
  }

  const batchCompressImages = async (): Promise<void> => {
    if (!selectedFiles.length) return
    setIsCompressing(true)
    setBatchResults([])
    setBatchProgress(0)
    setCurrentProcessingFile(null)

    try {
      const options = createCompressionOptions(true)
      const outputDir = await window.system.selectDirectory()
      if (!outputDir) throw new Error(t('noOutputDirectorySelected'))

      const results: CompressionResult[] = []
      const totalFiles = selectedFiles.length
      let completedFiles = 0
      const concurrencyLimit = 3
      const fileQueue = [...selectedFiles]
      const activePromises: Promise<void>[] = []

      const processFile = async (file: File): Promise<void> => {
        try {
          setCurrentProcessingFile(file.name)
          const originalExt = file.name.split('.').pop()?.toLowerCase() || ''
          const formatToUse = options.format || (originalExt as 'jpg' | 'png' | 'webp')
          const outputPath = `${outputDir}/compressed_${file.name}${options.format ? '.' + options.format : ''}`
          const originalSize = file.size
          const apiResult = await window.compression.compressImage(file.path, outputPath, options)

          let compressedSize = apiResult.compressedSize
          if (!compressedSize || compressedSize <= 0) {
            compressedSize = estimateCompressedSize(originalSize, qualityPreset)
          }

          results.push({
            originalSize,
            compressedSize,
            compressionRatio: originalSize / (compressedSize || 1),
            outputPath: apiResult.outputPath || outputPath,
            newWidth: apiResult.newWidth,
            newHeight: apiResult.newHeight,
            format: formatToUse || 'jpg'
          })
        } catch (err) {
          console.error(`处理文件 ${file.name} 时出错:`, err)
        } finally {
          completedFiles++
          setBatchProgress(Math.round((completedFiles / totalFiles) * 100))
        }
      }

      while (fileQueue.length > 0 || activePromises.length > 0) {
        while (fileQueue.length > 0 && activePromises.length < concurrencyLimit) {
          const file = fileQueue.shift()!
          const promise = processFile(file).then(() => {
            const index = activePromises.indexOf(promise)
            if (index > -1) activePromises.splice(index, 1)
          })
          activePromises.push(promise)
        }
        if (activePromises.length > 0) await Promise.race(activePromises)
      }

      setBatchProgress(100)
      setCurrentProcessingFile(null)
      setBatchResults(results)
    } catch (error) {
      console.error('批量压缩过程中出错:', error)
    } finally {
      setIsCompressing(false)
    }
  }

  useEffect(() => {
    return (): void => {
      if (originalImageUrl) URL.revokeObjectURL(originalImageUrl)
      if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    }
  }, [originalImageUrl, previewUrl])

  const isBatch = activeMode === 'batch'
  const hasInput = isBatch ? selectedFiles.length > 0 : Boolean(selectedFile)
  const hasResult = isBatch ? batchResults.length > 0 : Boolean(compressionResult)
  const totalBatchSize = selectedFiles.reduce((sum, file) => sum + file.size, 0)

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="mx-auto max-w-[1680px] space-y-5 p-4 md:p-6">
        <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-[-0.01em] text-foreground">
                {t('imageCompression')}
              </h1>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                {t('imageCompressionDescription')}
              </p>
            </div>
          </div>
          <SegmentedControl<CompressionMode>
            value={activeMode}
            onChange={handleModeToggle}
            ariaLabel={t('imageCompressionTool')}
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
              description={isBatch ? t('selectFilesToCompress') : t('selectImage')}
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
                batchMode={isBatch}
              />

              {!isBatch && selectedFile && (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/25 px-3 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-card text-primary">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-xs font-medium text-foreground"
                      title={selectedFile.name}
                    >
                      {selectedFile.name}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatBytes(selectedFile.size)}
                    </p>
                  </div>
                </div>
              )}

              {isBatch && selectedFiles.length > 0 && (
                <FileList files={selectedFiles} onRemoveFile={handleRemoveFile} />
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              eyebrow="02"
              title={t('compressionSettings')}
              description={
                isBatch ? t('imageBatchSettingsHint') : t('imageCompressionSettingsHint')
              }
            />
            <PanelBody className="space-y-5">
              <CompressionSettings
                qualityPreset={qualityPreset}
                outputFormat={outputFormat}
                qualityValue={qualityValue}
                compressionLevel={compressionLevel}
                outputWidth={outputWidth}
                outputHeight={outputHeight}
                maintainAspectRatio={maintainAspectRatio}
                webpPreset={webpPreset}
                webpLossless={webpLossless}
                showAdvanced={showAdvanced}
                imageInfo={imageInfo}
                isBatchMode={isBatch}
                enableBatchResize={enableBatchResize}
                onEnableBatchResizeChange={setEnableBatchResize}
                onQualityPresetChange={handlePresetChange}
                onFormatChange={handleFormatChange}
                onQualityChange={handleQualityChange}
                onCompressionLevelChange={handleCompressionLevelChange}
                onWidthChange={setOutputWidth}
                onHeightChange={setOutputHeight}
                onMaintainAspectRatioChange={setMaintainAspectRatio}
                onWebpPresetChange={setWebpPreset}
                onWebpLosslessChange={setWebpLossless}
                onShowAdvancedChange={setShowAdvanced}
              />

              {!hasInput && (
                <Notice
                  title={t('noFileChosen')}
                  description={isBatch ? t('selectFilesToCompress') : t('selectImage')}
                />
              )}

              <div className="space-y-3 border-t border-border pt-4">
                <Button
                  type="button"
                  className="w-full"
                  onClick={isBatch ? batchCompressImages : compressSingleImage}
                  disabled={!hasInput || isCompressing}
                >
                  {isCompressing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ImageIcon className="mr-2 h-4 w-4" />
                  )}
                  {isCompressing
                    ? isBatch
                      ? t('batchCompressing')
                      : t('compressing')
                    : isBatch
                      ? t('compressAll')
                      : t('compress')}
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
              description={hasResult ? t('outputFile') : t('imageCompressionTool')}
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
                  <BatchCompressionResult results={batchResults} onReset={resetState} />
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
                            {formatBytes(totalBatchSize)}
                          </dd>
                        </div>
                      </dl>
                    )}
                    <EmptyState
                      icon={ImageIcon}
                      title={t('compressionResult')}
                      description={
                        selectedFiles.length
                          ? t('imageBatchSettingsHint')
                          : t('selectFilesToCompress')
                      }
                      className="min-h-64"
                    />
                  </div>
                )
              ) : selectedFile ? (
                compressionResult ? (
                  <CompressedPreview
                    compressionResult={compressionResult}
                    previewUrl={previewUrl}
                    onReset={resetState}
                  />
                ) : (
                  <ImagePreview
                    imageUrl={originalImageUrl}
                    fileName={selectedFile.name}
                    fileSize={selectedFile.size}
                    imageInfo={imageInfo}
                  />
                )
              ) : (
                <EmptyState
                  icon={ImageIcon}
                  title={t('preview')}
                  description={t('selectImage')}
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
