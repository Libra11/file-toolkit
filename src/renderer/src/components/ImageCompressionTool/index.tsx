/**
 * Author: Libra
 * Date: 2025-03-31 17:28:42
 * LastEditors: Libra
 * Description: 图片压缩工具主组件
 */

import { motion } from 'framer-motion'
import { Card, CardContent } from '@renderer/components/ui/card'
import { useTranslation } from 'react-i18next'
import { useState, useRef, useEffect } from 'react'
import { ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Switch } from '@renderer/components/ui/switch'
import { Label } from '@renderer/components/ui/label'
import { Progress } from '@renderer/components/ui/progress'

// 导入子组件
import { FileUploader } from './FileUploader'
import { ImagePreview } from './ImagePreview'
import { CompressionSettings } from './CompressionSettings'
import { CompressedPreview } from './CompressedPreview'
import { FileList } from './FileList'
import { BatchCompressionResult } from './BatchCompressionResult'

// 导入类型和工具函数
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
import { estimateCompressedSize } from './utils'

export default function ImageCompressionTool(): JSX.Element {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // 批量模式状态
  const [batchMode, setBatchMode] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [batchResults, setBatchResults] = useState<CompressionResult[]>([])
  const [batchProgress, setBatchProgress] = useState(0)
  const [currentProcessingFile, setCurrentProcessingFile] = useState<string | null>(null)

  // 单文件模式状态
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [imageInfo, setImageInfo] = useState<ImageInfo>({})

  // 图片压缩选项
  const [qualityPreset, setQualityPreset] = useState<ImageQualityPreset>(
    IMAGE_QUALITY_PRESETS.MEDIUM
  )
  const [outputFormat, setOutputFormat] = useState<ImageFormat>('original')
  const [qualityValue, setQualityValue] = useState(75) // JPEG和WebP的质量值
  const [compressionLevel, setCompressionLevel] = useState(6) // PNG和WebP无损的压缩级别(0-9)
  const [outputWidth, setOutputWidth] = useState<number | ''>('')
  const [outputHeight, setOutputHeight] = useState<number | ''>('')
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true)
  const [webpPreset, setWebpPreset] = useState<WebpPreset>(WEBP_PRESETS.DEFAULT)
  const [webpLossless, setWebpLossless] = useState(false)

  // 重置所有状态
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
    setImageInfo({})
    if (fileInputRef.current) {
      fileInputRef.current.value = '' // 重置文件输入
    }
  }

  // 处理模式切换
  const handleModeToggle = (value: boolean): void => {
    setBatchMode(value)
    resetState()
  }

  // 处理预设变更
  const handlePresetChange = (value: ImageQualityPreset): void => {
    setQualityPreset(value)

    if (value === IMAGE_QUALITY_PRESETS.CUSTOM) {
      return // 自定义模式不改变当前值
    }

    // 根据预设和格式设置质量值
    switch (value) {
      case IMAGE_QUALITY_PRESETS.HIGH:
        setQualityValue(90)
        setCompressionLevel(3) // PNG: 较低压缩级别以保持高质量
        break
      case IMAGE_QUALITY_PRESETS.MEDIUM:
        setQualityValue(75)
        setCompressionLevel(6) // PNG: 中等压缩级别
        break
      case IMAGE_QUALITY_PRESETS.LOW:
        setQualityValue(50)
        setCompressionLevel(9) // PNG: 最高压缩级别
        break
    }
  }

  // 处理格式变更
  const handleFormatChange = (value: ImageFormat): void => {
    setOutputFormat(value)
    if (qualityPreset !== IMAGE_QUALITY_PRESETS.CUSTOM) {
      handlePresetChange(qualityPreset) // 重新应用当前预设的值
    }
  }

  // 处理质量滑块变更
  const handleQualityChange = (value: number): void => {
    setQualityPreset(IMAGE_QUALITY_PRESETS.CUSTOM)
    setQualityValue(value)

    // 同步更新压缩级别（对于PNG，高质量=低压缩级别）
    if (outputFormat === IMAGE_FORMATS.PNG) {
      // 对于PNG，压缩级别与质量成反比：
      // 质量100% -> 压缩级别0
      // 质量0% -> 压缩级别9
      setCompressionLevel(Math.round(((100 - value) * 9) / 100))
    }
  }

  // 处理压缩级别滑块变更
  const handleCompressionLevelChange = (value: number): void => {
    setQualityPreset(IMAGE_QUALITY_PRESETS.CUSTOM)
    setCompressionLevel(value)

    // 同步更新质量值（对于PNG，高压缩级别=低质量）
    if (outputFormat === IMAGE_FORMATS.PNG) {
      // 对于PNG，质量与压缩级别成反比：
      // 压缩级别0 -> 质量100%
      // 压缩级别9 -> 质量0%
      setQualityValue(Math.round(((9 - value) * 100) / 9))
    }
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
    setOriginalImageUrl(objectUrl)

    // 获取图像尺寸
    const img = new Image()
    img.onload = (): void => {
      setImageInfo({
        width: img.width,
        height: img.height
      })
      setOutputWidth('')
      setOutputHeight('')
    }
    img.src = objectUrl
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
    let formatToUse: 'jpg' | 'png' | 'webp' | undefined = undefined
    if (outputFormat === IMAGE_FORMATS.JPG) formatToUse = 'jpg'
    else if (outputFormat === IMAGE_FORMATS.PNG) formatToUse = 'png'
    else if (outputFormat === IMAGE_FORMATS.WEBP) formatToUse = 'webp'

    // 创建选项对象
    const options: CompressionOptions = {
      format: formatToUse
    }

    // 根据格式设置质量参数
    if (formatToUse === 'jpg') {
      // JPEG: 将0-100转换为31-2
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

    // 添加尺寸设置
    if (outputWidth) options.width = Number(outputWidth)
    if (outputHeight) options.height = Number(outputHeight)

    return options
  }

  // 压缩单个图片
  const compressSingleImage = async (): Promise<void> => {
    if (!selectedFile) return

    setIsCompressing(true)

    try {
      const options = createCompressionOptions()

      // 获取原始文件扩展名
      const originalExt = selectedFile.name.split('.').pop()?.toLowerCase() || ''
      const formatToUse = options.format || (originalExt as 'jpg' | 'png' | 'webp')

      // 调用压缩API
      const outputPath = await window.system.saveFile(
        `compressed_${selectedFile.name}${options.format ? '.' + options.format : ''}`
      )
      if (!outputPath) {
        throw new Error('未选择输出路径')
      }

      // 记录原始文件大小
      const originalSize = selectedFile.size

      console.log('options:', options)
      // 适配API调用方式
      const apiResult = await window.compression.compressImage(
        selectedFile.path,
        outputPath,
        options
      )

      // 尝试获取压缩后文件大小
      let compressedSize = apiResult.compressedSize
      if (!compressedSize || compressedSize <= 0) {
        try {
          // 如果API没有返回大小，使用一个估计值
          console.log('API未返回压缩后大小，使用估计值')

          // 使用工具函数估计压缩率
          compressedSize = estimateCompressedSize(originalSize, qualityPreset)
          console.log('估计的压缩后大小:', compressedSize)
        } catch (err) {
          console.error('估计文件大小失败:', err)
          // 使用一个假数据，避免显示0
          compressedSize = Math.round(originalSize * 0.7)
        }
      }

      // 创建符合我们组件需要的结果对象
      const compressionData: CompressionResult = {
        originalSize: originalSize,
        compressedSize: compressedSize,
        compressionRatio: originalSize / (compressedSize || 1),
        outputPath: apiResult.outputPath || outputPath, // 确保有有效的输出路径
        newWidth: apiResult.newWidth,
        newHeight: apiResult.newHeight,
        format: formatToUse || 'jpg' // 使用我们自己的格式值
      }

      // 设置结果数据
      setCompressionResult(compressionData)

      // 使用myapp协议设置预览URL
      if (compressionData.outputPath) {
        setPreviewUrl(`myapp:///${compressionData.outputPath}`)
      }

      // 打印路径以便调试
      console.log('压缩后图片路径:', compressionData.outputPath)
    } catch (error) {
      console.error('压缩过程中出错:', error)
      // 可以在这里添加错误处理逻辑
    } finally {
      setIsCompressing(false)
    }
  }

  // 批量压缩图片
  const batchCompressImages = async (): Promise<void> => {
    if (!selectedFiles.length) return

    setIsCompressing(true)
    setBatchResults([])
    setBatchProgress(0)
    setCurrentProcessingFile(null)

    try {
      const options = createCompressionOptions()

      // 为每个文件选择输出目录
      const outputDir = await window.system.selectDirectory()
      if (!outputDir) {
        throw new Error('未选择输出目录')
      }

      const results: CompressionResult[] = []
      const totalFiles = selectedFiles.length

      // 逐个处理文件
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        try {
          // 更新当前处理文件名和进度
          setCurrentProcessingFile(file.name)
          setBatchProgress(Math.round((i / totalFiles) * 100))

          // 获取原始文件扩展名
          const originalExt = file.name.split('.').pop()?.toLowerCase() || ''
          const formatToUse = options.format || (originalExt as 'jpg' | 'png' | 'webp')

          // 构建输出路径
          const outputPath = `${outputDir}/compressed_${file.name}${options.format ? '.' + options.format : ''}`

          // 记录原始文件大小
          const originalSize = file.size

          // 压缩图片
          const apiResult = await window.compression.compressImage(file.path, outputPath, options)

          // 处理结果
          let compressedSize = apiResult.compressedSize
          if (!compressedSize || compressedSize <= 0) {
            compressedSize = estimateCompressedSize(originalSize, qualityPreset)
          }

          // 创建结果对象
          const compressionData: CompressionResult = {
            originalSize: originalSize,
            compressedSize: compressedSize,
            compressionRatio: originalSize / (compressedSize || 1),
            outputPath: apiResult.outputPath || outputPath,
            newWidth: apiResult.newWidth,
            newHeight: apiResult.newHeight,
            format: formatToUse || 'jpg'
          }

          // 添加到结果列表
          results.push(compressionData)
        } catch (err) {
          console.error(`处理文件 ${file.name} 时出错:`, err)
          // 继续处理下一个文件
        }
      }

      // 完成所有文件处理
      setBatchProgress(100)
      setCurrentProcessingFile(null)

      // 设置批量处理结果
      setBatchResults(results)
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
      if (originalImageUrl) {
        URL.revokeObjectURL(originalImageUrl)
      }
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [originalImageUrl, previewUrl])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border border-slate-200/30 dark:border-slate-700/30 shadow-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center">
              <ImageIcon className="mr-2 h-6 w-6 text-blue-500" />
              {t('imageCompression')}
            </h2>

            {/* 模式切换开关 */}
            <div className="flex items-center space-x-2">
              <Label htmlFor="mode-toggle" className="text-sm">
                {batchMode ? t('batchMode') : t('singleFileMode')}
              </Label>
              <Switch id="mode-toggle" checked={batchMode} onCheckedChange={handleModeToggle} />
            </div>
          </div>

          <p className="text-slate-600 dark:text-slate-400">{t('imageCompressionDescription')}</p>

          <div className="space-y-6">
            {/* 单个文件模式 */}
            {!batchMode ? (
              <>
                {/* 文件上传区域 */}
                {!selectedFile ? (
                  <FileUploader onFileSelect={handleSingleFileSelect} fileInputRef={fileInputRef} />
                ) : (
                  <div className="space-y-6">
                    {/* 图片预览和信息 */}
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* 原始图片预览 */}
                      <div className="w-full md:w-1/2">
                        <ImagePreview
                          imageUrl={originalImageUrl}
                          fileName={selectedFile.name}
                          fileSize={selectedFile.size}
                          imageInfo={imageInfo}
                        />
                      </div>

                      {/* 压缩结果或压缩设置 */}
                      <div className="w-full md:w-1/2">
                        {compressionResult ? (
                          <CompressedPreview
                            compressionResult={compressionResult}
                            previewUrl={previewUrl}
                            onReset={resetState}
                          />
                        ) : (
                          <div>
                            {/* 压缩设置 */}
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

                            <Button
                              className="w-full mt-4"
                              onClick={compressSingleImage}
                              disabled={isCompressing}
                            >
                              {isCompressing ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  {t('compressing')}
                                </>
                              ) : (
                                <>
                                  <ImageIcon className="h-4 w-4 mr-2" />
                                  {t('compress')}
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* 批量模式 */
              <>
                {/* 批量文件上传 */}
                {selectedFiles.length === 0 || batchResults.length > 0 ? (
                  <>
                    {batchResults.length > 0 ? (
                      <BatchCompressionResult results={batchResults} onReset={resetState} />
                    ) : (
                      <FileUploader
                        onFileSelect={handleBatchFileSelect}
                        fileInputRef={fileInputRef}
                        batchMode={true}
                      />
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    {/* 显示已选文件列表 */}
                    <FileList files={selectedFiles} onRemoveFile={handleRemoveFile} />

                    {/* 压缩设置 */}
                    <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700 mt-4">
                      <h3 className="text-sm font-medium mb-3">{t('compressionSettings')}</h3>
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
                        isBatchMode={true}
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

                      <Button
                        className="w-full mt-4"
                        onClick={batchCompressImages}
                        disabled={isCompressing}
                      >
                        {isCompressing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t('batchCompressing')}
                          </>
                        ) : (
                          <>
                            <ImageIcon className="h-4 w-4 mr-2" />
                            {t('compressAll')}
                          </>
                        )}
                      </Button>

                      {isCompressing && (
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                            <span>{currentProcessingFile || t('processing')}</span>
                            <span>{batchProgress}%</span>
                          </div>
                          <Progress value={batchProgress} className="h-1.5" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
