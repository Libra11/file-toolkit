/**
 * Author: Libra
 * Date: 2024-04-01
 * LastEditors: Libra
 * Description: 视频压缩工具主组件
 */

import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@renderer/components/ui/card'
import { useTranslation } from 'react-i18next'
import { useState, useRef, useEffect } from 'react'
import { Loader2, FileVideo, Sparkles } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Progress } from '@renderer/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@renderer/components/ui/tabs'

// 导入组件
import { FileUploader } from './FileUploader'
import { VideoPreview } from './VideoPreview'
import { CompressionSettings } from './CompressionSettings'
import { CompressedVideoPreview } from './CompressedVideoPreview'

// 导入类型和工具函数
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

export default function VideoCompressionTool(): JSX.Element {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 状态管理
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionComplete, setCompressionComplete] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('single')
  const [videoInfo, setVideoInfo] = useState<VideoInfo>({})
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null)

  // 视频压缩选项
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

  // 添加进度状态
  const [batchProgress, setBatchProgress] = useState<{
    current: number
    total: number
    currentFileName: string
  }>({
    current: 0,
    total: 0,
    currentFileName: ''
  })

  // 重置状态
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 处理模式切换
  const handleModeToggle = (value: string): void => {
    resetState()
    setActiveTab(value)
  }

  // 文件上传处理函数
  const handleFileSelect = async (files: File[]): Promise<void> => {
    if (!files.length) return

    setSelectedFiles(files)

    // 单文件模式下，加载视频预览和信息
    if (activeTab === 'single' && files.length === 1) {
      const file = files[0]

      // 创建文件预览URL
      const url = URL.createObjectURL(file)
      setVideoUrl(url)

      try {
        // 获取真实视频信息
        const videoInfo = await window.compression.getVideoInfo(file.path)
        setVideoInfo({
          duration: videoInfo.duration,
          width: videoInfo.width,
          height: videoInfo.height,
          bitrate: videoInfo.bitrate,
          fps: videoInfo.fps,
          codec: videoInfo.codec,
          format: videoInfo.format || file.name.split('.').pop()
        })
      } catch (error) {
        console.error('获取视频信息失败:', error)
        // 如果获取失败，使用基本信息
        setVideoInfo({
          format: file.name.split('.').pop()
        })
      }
    }
  }

  // 清理URL对象
  useEffect(() => {
    return (): void => {
      if (videoUrl) URL.revokeObjectURL(videoUrl)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [videoUrl, previewUrl])

  // 压缩视频处理函数
  const compressVideo = async (): Promise<void> => {
    if (!selectedFiles.length) return

    setIsCompressing(true)

    try {
      // 获取输入文件路径
      const inputFile = selectedFiles[0]

      // 确定输出格式和文件名
      const inputFileName = inputFile.name
      const extension = outputFormat === 'original' ? inputFileName.split('.').pop() : outputFormat

      // 让用户选择保存位置
      const outputPath = await window.system.saveFile(
        `compressed_${inputFileName.split('.')[0]}.${extension}`
      )
      if (!outputPath) {
        throw new Error('未选择输出路径')
      }

      // 准备压缩选项
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

      // 调用主进程的压缩方法
      const result = await window.compression.compressVideo(inputFile.path, outputPath, options)

      // 设置压缩结果
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

      // 创建预览URL
      const previewUrl = `myapp:///${result.outputPath}`
      setPreviewUrl(previewUrl)

      setIsCompressing(false)
      setCompressionComplete(true)
    } catch (error) {
      console.error('视频压缩失败:', error)
      setIsCompressing(false)
    }
  }

  // 批量压缩视频处理函数
  const batchCompressVideos = async (): Promise<void> => {
    if (!selectedFiles.length) return

    setIsCompressing(true)
    setCompressionComplete(false)
    setBatchProgress({
      current: 0,
      total: selectedFiles.length,
      currentFileName: ''
    })

    try {
      const outputDir = await window.system.selectDirectory()
      if (!outputDir) {
        throw new Error('未选择输出目录')
      }

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

      // 完成所有处理
      if (results.length > 0) {
        setCompressionResult({
          batchResults: results,
          totalOriginalSize: results.reduce((sum, r) => sum + r.originalSize, 0),
          totalCompressedSize: results.reduce((sum, r) => sum + r.compressedSize, 0),
          fileCount: results.length,
          // 要满足CompressionResult类型要求的其他必填字段
          originalSize: results.reduce((sum, r) => sum + r.originalSize, 0),
          compressedSize: results.reduce((sum, r) => sum + r.compressedSize, 0),
          compressionRatio:
            results.reduce((sum, r) => sum + r.originalSize, 0) /
            results.reduce((sum, r) => sum + r.compressedSize, 0),
          outputPath: outputDir,
          format: ''
        })
        setCompressionComplete(true)
      }
    } catch (error) {
      console.error('批量压缩过程中出错:', error)
    } finally {
      setIsCompressing(false)
      setBatchProgress({
        current: 0,
        total: 0,
        currentFileName: ''
      })
    }
  }

  // 重置为压缩新的视频
  const handleReset = (): void => {
    resetState()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-6 shadow-2xl shadow-purple-900/10 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/60 md:p-8">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-purple-100/60 via-white to-transparent dark:from-purple-900/25 dark:via-slate-900" />
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-purple-100/70 px-3 py-1 text-sm font-medium text-purple-600 dark:bg-purple-900/40 dark:text-purple-200">
              <FileVideo className="h-4 w-4" />
              {t('videoCompressionTool')}
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                {t('videoCompression')}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('videoCompressionDescription')}
              </p>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-purple-100/70 bg-purple-50/60 p-4 text-sm text-purple-700 shadow-inner dark:border-purple-500/30 dark:bg-purple-900/20 dark:text-purple-100 md:flex-row md:items-start md:gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-purple-500 shadow-sm dark:bg-white/10 dark:text-purple-200">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold">{t('videoCompressionTipTitle')}</p>
                <p className="text-xs leading-relaxed text-purple-600/80 dark:text-purple-100/80">
                  {t('videoCompressionTipDescription')}
                </p>
              </div>
            </div>
          </div>

          <Tabs
            defaultValue="single"
            value={activeTab}
            onValueChange={handleModeToggle}
            className="w-full"
          >
            <div className="flex justify-center">
              <TabsList className="mb-6 h-[3.2rem] grid w-full max-w-lg grid-cols-2 items-center overflow-hidden rounded-full bg-purple-100/60 p-1 text-sm font-medium dark:bg-purple-900/40">
                <TabsTrigger
                  value="single"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-slate-600 transition-all data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm dark:text-slate-300 dark:data-[state=active]:bg-slate-900/80 dark:data-[state=active]:text-purple-300"
                >
                  {t('singleFileMode')}
                </TabsTrigger>
                <TabsTrigger
                  value="batch"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-slate-600 transition-all data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm dark:text-slate-300 dark:data-[state=active]:bg-slate-900/80 dark:data-[state=active]:text-purple-300"
                >
                  {t('batchMode')}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="single" className="mt-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
                <Card className="border border-purple-100/70 bg-white/90 shadow-xl shadow-purple-900/10 dark:border-purple-500/20 dark:bg-slate-900/70">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                      {t('selectFiles')}
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                      {t('selectVideoFile')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!selectedFiles.length ? (
                      <FileUploader
                        onFileSelect={handleFileSelect}
                        fileInputRef={fileInputRef}
                        batchMode={false}
                      />
                    ) : compressionComplete && compressionResult ? (
                      <CompressedVideoPreview
                        compressionResult={compressionResult}
                        previewUrl={previewUrl}
                        onReset={handleReset}
                      />
                    ) : (
                      <VideoPreview
                        videoUrl={videoUrl}
                        fileName={selectedFiles[0].name}
                        fileSize={selectedFiles[0].size}
                        videoInfo={videoInfo}
                      />
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-slate-200/70 bg-white/95 shadow-xl shadow-purple-900/10 dark:border-slate-700/60 dark:bg-slate-900/70">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                      {t('compressionSettings')}
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                      {t('videoCompressionSettingsHint')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedFiles.length > 0 && !compressionComplete ? (
                      <>
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

                        <Button
                          onClick={compressVideo}
                          disabled={isCompressing}
                          className="mt-4 h-11 w-full rounded-xl bg-purple-600 text-sm font-semibold shadow-lg shadow-purple-900/20 transition hover:bg-purple-700 disabled:bg-slate-300 dark:bg-purple-500 dark:hover:bg-purple-400"
                        >
                          {isCompressing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {t('compressing')}
                            </>
                          ) : (
                            <>
                              <FileVideo className="mr-2 h-4 w-4" />
                              {t('compressVideo')}
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <p className="rounded-xl border border-dashed border-slate-200/70 bg-slate-50/80 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
                        {t('selectVideoFile')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="batch" className="mt-6">
              {selectedFiles.length === 0 && !compressionResult?.batchResults ? (
                <Card className="border border-purple-100/70 bg-white/95 shadow-xl shadow-purple-900/10 dark:border-purple-500/20 dark:bg-slate-900/70">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                      {t('selectFiles')}
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                      {t('selectVideosToCompress')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUploader
                      onFileSelect={handleFileSelect}
                      fileInputRef={fileInputRef}
                      batchMode={true}
                    />
                  </CardContent>
                </Card>
              ) : compressionResult?.batchResults ? (
                <Card className="border border-violet-200/70 bg-white/95 shadow-xl shadow-violet-900/10 dark:border-violet-500/30 dark:bg-violet-900/30">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-violet-700 dark:text-violet-200">
                      {t('batchCompressionSuccess')}
                    </CardTitle>
                    <CardDescription className="text-sm text-violet-600/80 dark:text-violet-200/80">
                      {t('videoBatchSettingsHint')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 text-sm sm:grid-cols-3">
                      <div className="rounded-xl bg-violet-50/80 p-3 dark:bg-violet-900/40">
                        <span className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-300">
                          {t('successCount', {
                            count: compressionResult.batchResults.length,
                            total: compressionResult.batchResults.length
                          })}
                        </span>
                      </div>
                      <div className="rounded-xl bg-violet-50/80 p-3 dark:bg-violet-900/40">
                        <span className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-300">
                          {t('originalSize')}
                        </span>
                        <p className="mt-1 text-base font-semibold text-violet-600 dark:text-violet-300">
                          {formatFileSize(compressionResult.totalOriginalSize || 0)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-violet-50/80 p-3 dark:bg-violet-900/40">
                        <span className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-300">
                          {t('saved')}
                        </span>
                        <p className="mt-1 text-base font-semibold text-violet-600 dark:text-violet-300">
                          {Math.round(
                            (((compressionResult.totalOriginalSize || 0) -
                              (compressionResult.totalCompressedSize || 0)) /
                              (compressionResult.totalOriginalSize || 1)) *
                              100
                          )}
                          %
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {compressionResult.batchResults.map((result, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-xl border border-violet-100/70 bg-white/90 px-3 py-2 text-sm shadow-sm dark:border-violet-500/30 dark:bg-violet-900/40"
                        >
                          <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                            {result.fileName || `${t('video')} ${index + 1}`}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatFileSize(result.originalSize)} →{' '}
                            {formatFileSize(result.compressedSize)}
                          </span>
                          <span className="text-xs font-semibold text-violet-600 dark:text-violet-300">
                            {Math.round(
                              ((result.originalSize - result.compressedSize) /
                                result.originalSize) *
                                100
                            )}
                            %
                          </span>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={handleReset}
                      className="h-10 w-full rounded-xl border border-violet-200/70 bg-white text-sm font-semibold text-violet-600 shadow-sm transition hover:bg-violet-50 dark:border-violet-500/30 dark:bg-transparent dark:text-violet-300 dark:hover:bg-violet-900/40"
                    >
                      {t('compressMore')}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  <Card className="border border-purple-100/70 bg-white/90 shadow-xl shadow-purple-900/10 dark:border-purple-500/20 dark:bg-slate-900/70">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                        {t('fileList')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between rounded-xl border border-purple-100/70 bg-white/90 px-3 py-2 text-sm shadow-sm dark:border-purple-500/30 dark:bg-slate-900/70"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100/70 text-purple-500 dark:bg-purple-900/30 dark:text-purple-200">
                                <FileVideo className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p
                                  className="truncate font-medium text-slate-700 dark:text-slate-200"
                                  title={file.name}
                                >
                                  {file.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newFiles = [...selectedFiles]
                                newFiles.splice(index, 1)
                                setSelectedFiles(newFiles)
                              }}
                              className="text-purple-600 hover:text-purple-700 dark:text-purple-300 dark:hover:text-purple-200"
                            >
                              {t('remove')}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-200/70 bg-white/95 shadow-xl shadow-purple-900/10 dark:border-slate-700/60 dark:bg-slate-900/70">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                        {t('compressionSettings')}
                      </CardTitle>
                      <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                        {t('videoBatchSettingsHint')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <CompressionSettings
                        qualityPreset={qualityPreset}
                        outputFormat={outputFormat}
                        encoder={encoder}
                        crf={crf}
                        preset={preset}
                        maintainAspectRatio={maintainAspectRatio}
                        showAdvanced={showAdvanced}
                        isBatchMode={true}
                        onQualityPresetChange={setQualityPreset}
                        onFormatChange={setOutputFormat}
                        onEncoderChange={setEncoder}
                        onCrfChange={setCrf}
                        onPresetChange={setPreset}
                        onMaintainAspectRatioChange={setMaintainAspectRatio}
                        onShowAdvancedChange={setShowAdvanced}
                      />

                      <Button
                        onClick={batchCompressVideos}
                        disabled={isCompressing}
                        className="mt-2 h-11 w-full rounded-xl bg-purple-600 text-sm font-semibold shadow-lg shadow-purple-900/20 transition hover:bg-purple-700 disabled:bg-slate-300 dark:bg-purple-500 dark:hover:bg-purple-400"
                      >
                        {isCompressing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('batchCompressing')}
                          </>
                        ) : (
                          <>
                            <FileVideo className="mr-2 h-4 w-4" />
                            {t('batchCompression')}
                          </>
                        )}
                      </Button>

                      {batchProgress.total > 0 && isCompressing && (
                        <div className="space-y-2 rounded-xl border border-purple-100/70 bg-purple-50/60 p-3 text-xs text-purple-700 dark:border-purple-500/30 dark:bg-purple-900/20 dark:text-purple-100">
                          <div className="flex items-center justify-between font-medium">
                            <span>{batchProgress.currentFileName || t('processing')}</span>
                            <span>
                              {Math.round((batchProgress.current / batchProgress.total) * 100)}%
                            </span>
                          </div>
                          <Progress
                            value={(batchProgress.current / batchProgress.total) * 100}
                            className="h-1.5 bg-purple-100/60"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </motion.div>
  )
}
