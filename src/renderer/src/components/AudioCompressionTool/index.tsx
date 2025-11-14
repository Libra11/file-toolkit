/**
 * Author: Libra
 * Date: 2024-03-31
 * LastEditors: Libra
 * Description: 音频压缩工具主组件
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
import { Music, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Progress } from '@renderer/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@renderer/components/ui/tabs'

// 导入子组件
import { FileUploader } from './FileUploader'
import { CompressionSettings } from './CompressionSettings'
import { AudioPreview } from './AudioPreview'
import { CompressedAudioPreview } from './CompressedAudioPreview'

// 导入类型和工具函数
import {
  AudioFormat,
  AudioQualityPreset,
  CompressionResult,
  AudioInfo,
  CompressionOptions,
  AUDIO_FORMATS,
  AUDIO_QUALITY_PRESETS
} from './types'

export default function AudioCompressionTool(): JSX.Element {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // 批量模式状态
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [batchResults, setBatchResults] = useState<CompressionResult[]>([])
  const [batchProgress, setBatchProgress] = useState(0)
  const [currentProcessingFile, setCurrentProcessingFile] = useState<string | null>(null)

  // 单文件模式状态
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [originalAudioUrl, setOriginalAudioUrl] = useState<string | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [audioInfo, setAudioInfo] = useState<AudioInfo>({})

  // 音频压缩选项
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

  // 获取音频信息
  useEffect(() => {
    if (selectedFile && originalAudioUrl && audioRef.current) {
      // 创建一个临时的音频元素来获取元数据
      const tempAudio = new Audio(originalAudioUrl)

      tempAudio.addEventListener('loadedmetadata', () => {
        const format = selectedFile.name.split('.').pop()?.toLowerCase() || ''
        const duration = tempAudio.duration

        // 更新音频信息
        setAudioInfo({
          duration: duration ? Math.round(duration) : undefined,
          format: format,
          // 这些信息可能无法从Audio对象获取，但我们添加示例值
          bitrate: 128, // 示例值，无法直接从浏览器API获取
          channels: 2, // 示例值，实际上可能需要使用音频分析器来获取
          sampleRate: 44100 // 示例值
        })
      })

      tempAudio.addEventListener('error', () => {
        console.error('无法加载音频元数据')
      })
    }
  }, [selectedFile, originalAudioUrl])

  // 重置所有状态
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '' // 重置文件输入
    }
  }

  // 处理模式切换
  const handleModeToggle = (): void => {
    resetState()
  }

  // 处理预设变更
  const handlePresetChange = (value: AudioQualityPreset): void => {
    setQualityPreset(value)

    if (value === AUDIO_QUALITY_PRESETS.CUSTOM) {
      return // 自定义模式不改变当前值
    }

    // 根据预设设置比特率
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

  // 处理格式变更
  const handleFormatChange = (value: AudioFormat): void => {
    setOutputFormat(value)
    if (qualityPreset !== AUDIO_QUALITY_PRESETS.CUSTOM) {
      handlePresetChange(qualityPreset) // 重新应用当前预设的值
    }
  }

  // 处理比特率变更
  const handleBitrateChange = (value: string): void => {
    setQualityPreset(AUDIO_QUALITY_PRESETS.CUSTOM)
    setBitrate(value)
  }

  // 处理采样率变更
  const handleSampleRateChange = (value: number | ''): void => {
    setSampleRate(value)
  }

  // 处理声道数变更
  const handleChannelsChange = (value: number | ''): void => {
    setChannels(value)
  }

  // 处理文件选择 - 单文件模式
  const handleSingleFileSelect = (files: File[]): void => {
    if (!files.length) return
    const file = files[0]

    // 重置压缩相关的状态
    setCompressionResult(null)
    setPreviewUrl(null)
    setSelectedFile(file)

    // 创建预览URL
    const objectUrl = URL.createObjectURL(file)
    setOriginalAudioUrl(objectUrl)
  }

  // 处理文件选择 - 批量模式
  const handleBatchFileSelect = (files: File[]): void => {
    if (!files.length) return
    setSelectedFiles([...selectedFiles, ...files])
    setBatchResults([])
  }

  // 处理批量模式中的文件移除
  const handleRemoveFile = (index: number): void => {
    const newFiles = [...selectedFiles]
    newFiles.splice(index, 1)
    setSelectedFiles(newFiles)
  }

  // 创建压缩选项
  const createCompressionOptions = (): CompressionOptions => {
    // 确保传递的format值符合后端期望的类型
    let formatToUse: 'mp3' | 'aac' | 'ogg' | 'wav' | undefined = undefined
    if (outputFormat === AUDIO_FORMATS.MP3) formatToUse = 'mp3'
    else if (outputFormat === AUDIO_FORMATS.AAC) formatToUse = 'aac'
    else if (outputFormat === AUDIO_FORMATS.OGG) formatToUse = 'ogg'
    else if (outputFormat === AUDIO_FORMATS.WAV) formatToUse = 'wav'

    // 创建选项对象
    const options: CompressionOptions = {
      bitrate,
      format: formatToUse
    }

    // 添加额外设置
    if (sampleRate) options.sampleRate = sampleRate
    if (channels) options.channels = channels

    return options
  }

  // 压缩单个音频
  const compressSingleAudio = async (): Promise<void> => {
    if (!selectedFile) return

    setIsCompressing(true)

    try {
      const options = createCompressionOptions()

      // 获取原始文件扩展名
      const originalExt = selectedFile.name.split('.').pop()?.toLowerCase() || ''
      const formatToUse = options.format || (originalExt as 'mp3' | 'aac' | 'ogg' | 'wav')

      // 让用户选择保存位置
      const outputPath = await window.system.saveFile(
        `compressed_${selectedFile.name}${options.format ? '.' + options.format : ''}`
      )
      if (!outputPath) {
        throw new Error('未选择输出路径')
      }
      console.log(outputPath, bitrate, sampleRate, channels, formatToUse)
      // 调用后端API
      const response = await window.electron.ipcRenderer.invoke(
        'compress-audio',
        selectedFile.path,
        outputPath,
        bitrate,
        sampleRate || undefined,
        channels || undefined,
        outputFormat === 'original' ? undefined : formatToUse
      )

      // 更新压缩结果
      const compressionData: CompressionResult = {
        originalSize: response.originalSize,
        compressedSize: response.compressedSize,
        compressionRatio: response.originalSize / response.compressedSize,
        outputPath: response.outputPath,
        format: formatToUse
      }
      setCompressionResult(compressionData)

      // 使用myapp协议设置预览URL
      setPreviewUrl(`myapp:///${compressionData.outputPath}`)

      // 打印路径以便调试
      console.log('压缩后音频路径:', compressionData.outputPath)
    } catch (error) {
      console.error('音频压缩失败:', error)
      // 这里可以添加错误处理逻辑
    } finally {
      setIsCompressing(false)
    }
  }

  // 批量压缩音频
  const batchCompressAudios = async (): Promise<void> => {
    if (!selectedFiles.length) return

    setBatchProgress(0)
    setBatchResults([])
    setCurrentProcessingFile(null)

    try {
      const options = createCompressionOptions()

      // 让用户选择输出目录
      const outputDir = await window.system.selectDirectory()
      if (!outputDir) {
        throw new Error('未选择输出目录')
      }

      // 开始批量处理
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

          // 构建输出路径
          const outputPath = `${outputDir}/${outputFileName}`

          // 调用后端API
          const response = await window.electron.ipcRenderer.invoke(
            'compress-audio',
            file.path,
            outputPath,
            bitrate,
            sampleRate || undefined,
            channels || undefined,
            outputFormat === 'original' ? undefined : formatToUse
          )

          // 添加到结果列表
          const compressionData: CompressionResult = {
            originalSize: response.originalSize,
            compressedSize: response.compressedSize,
            compressionRatio: response.originalSize / response.compressedSize,
            outputPath: response.outputPath,
            format: formatToUse
          }
          results.push(compressionData)
        } catch (error) {
          console.error(`压缩音频 ${file.name} 失败:`, error)
          // 可以添加错误处理逻辑
        }

        // 更新进度
        setBatchProgress(Math.round(((i + 1) / selectedFiles.length) * 100))
      }

      // 完成所有文件处理
      setBatchResults(results)
      setCurrentProcessingFile(null)
    } catch (error) {
      console.error('批量压缩过程中出错:', error)
    } finally {
      setIsCompressing(false)
    }
  }

  // 在组件卸载时清理
  useEffect(() => {
    return (): void => {
      // 清理预览URL
      if (originalAudioUrl) {
        URL.revokeObjectURL(originalAudioUrl)
      }
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [originalAudioUrl, previewUrl])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-6 shadow-2xl shadow-indigo-900/10 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/60 md:p-8">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-indigo-100/60 via-white to-transparent dark:from-indigo-900/25 dark:via-slate-900" />
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-indigo-100/70 px-3 py-1 text-sm font-medium text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-200">
              <Music className="h-4 w-4" />
              {t('audioCompressionTool')}
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                {t('audioCompression')}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('audioCompressionDescription')}
              </p>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-indigo-100/70 bg-indigo-50/60 p-4 text-sm text-indigo-700 shadow-inner dark:border-indigo-500/30 dark:bg-indigo-900/20 dark:text-indigo-100 md:flex-row md:items-start md:gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-indigo-500 shadow-sm dark:bg-white/10 dark:text-indigo-200">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold">{t('audioCompressionTipTitle')}</p>
                <p className="text-xs leading-relaxed text-indigo-600/80 dark:text-indigo-100/80">
                  {t('audioCompressionTipDescription')}
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="single" onValueChange={handleModeToggle} className="w-full">
            <div className="flex justify-center">
              <TabsList className="mb-6 h-[3.2rem] grid w-full max-w-lg grid-cols-2 items-center overflow-hidden rounded-full bg-indigo-100/60 p-1 text-sm font-medium dark:bg-indigo-900/40">
                <TabsTrigger
                  value="single"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-slate-600 transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm dark:text-slate-300 dark:data-[state=active]:bg-slate-900/80 dark:data-[state=active]:text-indigo-300"
                >
                  {t('singleFileMode')}
                </TabsTrigger>
                <TabsTrigger
                  value="batch"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-slate-600 transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm dark:text-slate-300 dark:data-[state=active]:bg-slate-900/80 dark:data-[state=active]:text-indigo-300"
                >
                  {t('batchMode')}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="single" className="mt-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
                <Card className="border border-indigo-100/70 bg-white/90 shadow-xl shadow-indigo-900/10 dark:border-indigo-500/20 dark:bg-slate-900/70">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                      {t('selectFiles')}
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                      {t('selectFile')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FileUploader
                      onFileSelect={handleSingleFileSelect}
                      fileInputRef={fileInputRef}
                    />

                    {selectedFile && originalAudioUrl && (
                      <AudioPreview
                        audioUrl={originalAudioUrl}
                        fileName={selectedFile.name}
                        fileSize={selectedFile.size}
                        audioInfo={audioInfo}
                        className="rounded-2xl border border-indigo-100/70 bg-white/95 shadow-sm shadow-indigo-900/5 dark:border-indigo-500/30 dark:bg-slate-900/70"
                      />
                    )}

                    {compressionResult && previewUrl && (
                      <CompressedAudioPreview
                        compressionResult={compressionResult}
                        previewUrl={previewUrl}
                        className="rounded-2xl border border-emerald-100/70 bg-emerald-50/60 shadow-sm shadow-emerald-900/10 dark:border-emerald-500/30 dark:bg-emerald-900/30"
                      />
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-slate-200/70 bg-white/95 shadow-xl shadow-indigo-900/10 dark:border-slate-700/60 dark:bg-slate-900/70">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                      {t('compressionSettings')}
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                      {t('audioCompressionSettingsHint')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedFile ? (
                      <>
                        <CompressionSettings
                          originalSize={selectedFile.size}
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

                        <Button
                          onClick={compressSingleAudio}
                          disabled={isCompressing}
                          className="mt-4 h-11 w-full rounded-xl bg-indigo-600 text-sm font-semibold shadow-lg shadow-indigo-900/20 transition hover:bg-indigo-700 disabled:bg-slate-300 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                        >
                          {isCompressing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {t('compressing')}
                            </>
                          ) : (
                            <>
                              <Music className="mr-2 h-4 w-4" />
                              {t('compressAudio')}
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <p className="rounded-xl border border-dashed border-slate-200/70 bg-slate-50/80 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
                        {t('selectFile')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="batch" className="mt-6">
              {selectedFiles.length === 0 && batchResults.length === 0 ? (
                <Card className="border border-indigo-100/70 bg-white/95 shadow-xl shadow-indigo-900/10 dark:border-indigo-500/20 dark:bg-slate-900/70">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                      {t('selectFiles')}
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                      {t('selectFilesToCompress')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUploader onFileSelect={handleBatchFileSelect} isBatchMode={true} />
                  </CardContent>
                </Card>
              ) : batchResults.length > 0 ? (
                <Card className="border border-emerald-200/70 bg-white/95 shadow-xl shadow-emerald-900/10 dark:border-emerald-500/30 dark:bg-emerald-900/30">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-emerald-700 dark:text-emerald-200">
                      {t('batchCompressionSuccess')}
                    </CardTitle>
                    <CardDescription className="text-sm text-emerald-600/80 dark:text-emerald-200/80">
                      {t('audioBatchSettingsHint')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 text-sm sm:grid-cols-3">
                      <div className="rounded-xl bg-emerald-50/80 p-3 dark:bg-emerald-900/40">
                        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                          {t('successCount', {
                            count: batchResults.length,
                            total: batchResults.length
                          })}
                        </span>
                      </div>
                      <div className="rounded-xl bg-emerald-50/80 p-3 dark:bg-emerald-900/40">
                        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                          {t('originalSize')}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                          {(totalBatchOriginalSize / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <div className="rounded-xl bg-emerald-50/80 p-3 dark:bg-emerald-900/40">
                        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                          {t('saved')}
                        </span>
                        <p className="mt-1 text-base font-semibold text-emerald-600 dark:text-emerald-300">
                          {totalBatchSavedPercent}%
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {batchResults.map((result, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-xl border border-emerald-100/70 bg-white/90 px-3 py-2 text-sm shadow-sm dark:border-emerald-500/30 dark:bg-emerald-900/40"
                        >
                          <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                            {selectedFiles[index]?.name || `${t('audio')} ${index + 1}`}
                          </span>
                          <span className="text-xs text-slate-500">
                            {(result.originalSize / 1024 / 1024).toFixed(2)} MB →{' '}
                            {(result.compressedSize / 1024 / 1024).toFixed(2)} MB
                          </span>
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                            {Math.round(
                              ((result.originalSize - result.compressedSize) / result.originalSize) *
                                100
                            )}
                            %
                          </span>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={handleModeToggle}
                      className="h-10 w-full rounded-xl border border-emerald-200/70 bg-white text-sm font-semibold text-emerald-600 shadow-sm transition hover:bg-emerald-50 dark:border-emerald-500/30 dark:bg-transparent dark:text-emerald-300 dark:hover:bg-emerald-900/40"
                    >
                      {t('compressMore')}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  <Card className="border border-indigo-100/70 bg-white/90 shadow-xl shadow-indigo-900/10 dark:border-indigo-500/20 dark:bg-slate-900/70">
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
                            className="flex items-center justify-between rounded-xl border border-indigo-100/70 bg-white/90 px-3 py-2 text-sm shadow-sm dark:border-indigo-500/30 dark:bg-slate-900/70"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100/70 text-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-200">
                                <Music className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p
                                  className="truncate font-medium text-slate-700 dark:text-slate-200"
                                  title={file.name}
                                >
                                  {file.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFile(index)}
                              className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200"
                            >
                              {t('remove')}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-200/70 bg-white/95 shadow-xl shadow-indigo-900/10 dark:border-slate-700/60 dark:bg-slate-900/70">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                        {t('compressionSettings')}
                      </CardTitle>
                      <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                        {t('audioBatchSettingsHint')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <CompressionSettings
                        originalSize={selectedFiles.reduce((sum, file) => sum + file.size, 0)}
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

                      <Button
                        onClick={batchCompressAudios}
                        disabled={isCompressing}
                        className="mt-2 h-11 w-full rounded-xl bg-indigo-600 text-sm font-semibold shadow-lg shadow-indigo-900/20 transition hover:bg-indigo-700 disabled:bg-slate-300 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                      >
                        {isCompressing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('batchCompressing')}
                          </>
                        ) : (
                          <>
                            <Music className="mr-2 h-4 w-4" />
                            {t('batchCompression')}
                          </>
                        )}
                      </Button>

                      {batchProgress > 0 && (
                        <div className="space-y-2 rounded-xl border border-indigo-100/70 bg-indigo-50/60 p-3 text-xs text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-900/20 dark:text-indigo-100">
                          <div className="flex items-center justify-between font-medium">
                            <span>{currentProcessingFile || t('processing')}</span>
                            <span>{batchProgress}%</span>
                          </div>
                          <Progress value={batchProgress} className="h-1.5 bg-indigo-100/60" />
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
