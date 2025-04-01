/**
 * Author: Libra
 * Date: 2024-04-01
 * LastEditors: Libra
 * Description: 视频压缩工具主组件
 */

import { motion } from 'framer-motion'
import { Card, CardContent } from '@renderer/components/ui/card'
import { useTranslation } from 'react-i18next'
import { useState, useRef, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border border-slate-200/30 dark:border-slate-700/30 shadow-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-6">
            <Tabs defaultValue="single" value={activeTab} onValueChange={handleModeToggle}>
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg">
                <TabsTrigger
                  value="single"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 rounded-md py-2"
                >
                  {t('singleFileMode')}
                </TabsTrigger>
                <TabsTrigger
                  value="batch"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 rounded-md py-2"
                >
                  {t('batchMode')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="space-y-6">
                {!selectedFiles.length ? (
                  // 文件上传区域
                  <FileUploader
                    onFileSelect={handleFileSelect}
                    fileInputRef={fileInputRef}
                    batchMode={false}
                  />
                ) : compressionComplete && compressionResult ? (
                  // 压缩结果预览
                  <CompressedVideoPreview
                    compressionResult={compressionResult}
                    previewUrl={previewUrl}
                    onReset={handleReset}
                  />
                ) : (
                  // 视频预览和压缩选项
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* 视频预览区域 */}
                      <div className="w-full md:w-1/2">
                        <VideoPreview
                          videoUrl={videoUrl}
                          fileName={selectedFiles[0].name}
                          fileSize={selectedFiles[0].size}
                          videoInfo={videoInfo}
                        />
                      </div>

                      {/* 压缩设置区域 */}
                      <div className="w-full md:w-1/2 bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                        <h3 className="text-sm font-medium mb-3">{t('compressionSettings')}</h3>

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
                          className="w-full mt-4 bg-red-500 hover:bg-red-600"
                          onClick={compressVideo}
                          disabled={isCompressing}
                        >
                          {isCompressing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              {t('compressing')}
                            </>
                          ) : (
                            t('compress')
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="batch" className="space-y-6">
                {!selectedFiles.length ? (
                  // 批量模式文件上传
                  <FileUploader
                    onFileSelect={handleFileSelect}
                    fileInputRef={fileInputRef}
                    batchMode={true}
                  />
                ) : compressionComplete && compressionResult?.batchResults ? (
                  // 批量压缩结果
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                    <div className="flex flex-col items-center justify-center space-y-4 mb-6">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-800/30 rounded-full flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-green-600 dark:text-green-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-green-800 dark:text-green-300">
                        {t('compressionComplete')}
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        {t('batchCompressionSuccess', {
                          count: compressionResult.fileCount || selectedFiles.length
                        })}
                      </p>

                      <div className="w-full grid grid-cols-2 gap-4 text-sm">
                        <div className="text-gray-600 dark:text-gray-400">
                          {t('totalOriginalSize')}:
                        </div>
                        <div className="font-medium">
                          {formatFileSize(compressionResult.totalOriginalSize || 0)}
                        </div>

                        <div className="text-gray-600 dark:text-gray-400">
                          {t('totalCompressedSize')}:
                        </div>
                        <div className="font-medium">
                          {formatFileSize(compressionResult.totalCompressedSize || 0)}
                        </div>

                        <div className="text-gray-600 dark:text-gray-400">{t('saved')}:</div>
                        <div className="font-medium text-green-600 dark:text-green-400">
                          {Math.round(
                            (((compressionResult.totalOriginalSize || 0) -
                              (compressionResult.totalCompressedSize || 0)) /
                              (compressionResult.totalOriginalSize || 1)) *
                              100
                          )}
                          %
                        </div>
                      </div>

                      <div className="max-h-60 overflow-y-auto w-full space-y-2 mt-4">
                        {compressionResult.batchResults.map((result, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center text-sm border-b border-slate-200 dark:border-slate-700 pb-2"
                          >
                            <span className="truncate">{result.fileName}</span>
                            <span className="text-xs whitespace-nowrap">
                              {formatFileSize(result.originalSize)} →{' '}
                              {formatFileSize(result.compressedSize)}
                              <span className="text-green-600 dark:text-green-400 ml-2">
                                (
                                {Math.round(
                                  ((result.originalSize - result.compressedSize) /
                                    result.originalSize) *
                                    100
                                )}
                                %)
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>

                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={handleReset}
                      >
                        {t('compressMore')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // 批量压缩设置
                  <div className="space-y-6">
                    <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <h3 className="text-sm font-medium mb-3">{t('selectedFiles')}</h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center text-sm border-b border-slate-200 dark:border-slate-700 pb-2"
                          >
                            <span className="truncate">{file.name}</span>
                            <span className="text-xs text-slate-500 ml-2">
                              {formatFileSize(file.size)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <h3 className="text-sm font-medium mb-3">{t('batchSettings')}</h3>

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

                      {isCompressing && batchProgress.total > 0 && (
                        <div className="mt-4 space-y-2">
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${(batchProgress.current / batchProgress.total) * 100}%`
                              }}
                            />
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {t('processingFile', {
                              current: batchProgress.current,
                              total: batchProgress.total,
                              filename: batchProgress.currentFileName
                            })}
                          </div>
                        </div>
                      )}

                      <Button
                        className="w-full mt-4 bg-red-500 hover:bg-red-600"
                        onClick={batchCompressVideos}
                        disabled={isCompressing}
                      >
                        {isCompressing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t('compressingBatch')} ({batchProgress.current}/{batchProgress.total})
                          </>
                        ) : (
                          t('compressAll')
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
