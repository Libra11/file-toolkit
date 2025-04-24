/**
 * Author: Libra
 * Date: 2024-03-31
 * LastEditors: Libra
 * Description: 音频压缩工具主组件
 */

import { motion } from 'framer-motion'
import { Card, CardContent } from '@renderer/components/ui/card'
import { useTranslation } from 'react-i18next'
import { useState, useRef, useEffect } from 'react'
import { Music, Loader2 } from 'lucide-react'
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
      className="max-w-5xl mx-auto p-4"
    >
      <h1 className="text-2xl font-bold mb-6 text-center">{t('audioCompressionTool')}</h1>

      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="single" onValueChange={handleModeToggle}>
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="single">{t('singleFileMode')}</TabsTrigger>
              <TabsTrigger value="batch">{t('batchMode')}</TabsTrigger>
            </TabsList>

            {/* 单文件模式 */}
            <TabsContent value="single" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 左侧：文件上传和预览 */}
                <div className="space-y-4">
                  <FileUploader onFileSelect={handleSingleFileSelect} fileInputRef={fileInputRef} />

                  {selectedFile && originalAudioUrl && (
                    <AudioPreview
                      audioUrl={originalAudioUrl}
                      fileName={selectedFile.name}
                      fileSize={selectedFile.size}
                      audioInfo={audioInfo}
                    />
                  )}

                  {compressionResult && previewUrl && (
                    <CompressedAudioPreview
                      compressionResult={compressionResult}
                      previewUrl={previewUrl}
                    />
                  )}
                </div>

                {/* 右侧：压缩设置 */}
                <div className="space-y-4">
                  {selectedFile && (
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
                        className="w-full mt-4"
                      >
                        {isCompressing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {t('compressing')}
                          </>
                        ) : (
                          t('compressAudio')
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* 批量模式 */}
            <TabsContent value="batch" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* 文件上传和列表 */}
                <div className="space-y-4">
                  <FileUploader onFileSelect={handleBatchFileSelect} isBatchMode={true} />

                  {selectedFiles.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">{t('fileList')}</h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900 rounded"
                          >
                            <div className="flex items-center">
                              <Music className="w-4 h-4 mr-2 text-gray-500" />
                              <span className="text-sm truncate max-w-md">{file.name}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFile(index)}
                            >
                              {t('remove')}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 压缩设置 */}
                  {selectedFiles.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">{t('compressionSettings')}</h3>
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
                    </div>
                  )}

                  {/* 批量压缩按钮 */}
                  {selectedFiles.length > 0 && (
                    <Button
                      onClick={batchCompressAudios}
                      disabled={isCompressing}
                      className="w-full mt-4"
                    >
                      {batchProgress > 0 && batchProgress < 100 ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t('batchCompressing')} {batchProgress}%
                        </>
                      ) : (
                        t('batchCompression')
                      )}
                    </Button>
                  )}

                  {/* 批量压缩进度 */}
                  {batchProgress > 0 && (
                    <div className="space-y-2">
                      <Progress value={batchProgress} />
                      {currentProcessingFile && (
                        <p className="text-xs text-center text-gray-500">
                          {t('processing')}: {currentProcessingFile}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 批量结果 */}
                  {batchResults.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">{t('batchCompressionSuccess')}</h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {batchResults.map((result, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-3 gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-sm"
                          >
                            <div className="truncate">
                              {selectedFiles[index]?.name || `${t('audio')} ${index + 1}`}
                            </div>
                            <div>
                              {(result.originalSize / 1024 / 1024).toFixed(2)} MB →{' '}
                              {(result.compressedSize / 1024 / 1024).toFixed(2)} MB
                            </div>
                            <div>
                              {t('saved')}:{' '}
                              {Math.round(
                                ((result.originalSize - result.compressedSize) /
                                  result.originalSize) *
                                  100
                              )}
                              %
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}
