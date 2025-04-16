/**
 * Author: Libra
 * Date: 2025-04-15 17:57:20
 * LastEditors: Libra
 * Description: 压缩/解压工具组件
 */
/*
 * @Author: Libra
 * @Date: 2024-10-23
 * @LastEditors: Libra
 * @Description: 压缩/解压工具组件
 */
import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Archive, File, FileArchive, FolderInput, FolderOutput, Download } from 'lucide-react'
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Progress } from '@renderer/components/ui/progress'
import { Label } from '@renderer/components/ui/label'
import { Input } from '@renderer/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { ArchiveFormat, ArchiveFiles, CompressionResult, ArchiveEntry } from './types'
import FileUploader from './FileUploader'

export default function ArchiveCompressionTool(): JSX.Element {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'compress' | 'extract'>('compress')

  // 压缩相关状态
  const [selectedFiles, setSelectedFiles] = useState<ArchiveFiles[]>([])
  const [compressionFormat, setCompressionFormat] = useState<ArchiveFormat>(ArchiveFormat.ZIP)
  const [compressionLevel, setCompressionLevel] = useState<number>(5)
  const [isCompressing, setIsCompressing] = useState<boolean>(false)
  const [compressProgress, setCompressProgress] = useState<number>(0)
  const [compressComplete, setCompressComplete] = useState<boolean>(false)
  const [compressResult, setCompressResult] = useState<CompressionResult | null>(null)

  // 解压相关状态
  const [archiveFile, setArchiveFile] = useState<string>('')
  const [archivePassword, setArchivePassword] = useState<string>('')
  const [extractPath, setExtractPath] = useState<string>('')
  const [isExtracting, setIsExtracting] = useState<boolean>(false)
  const [extractProgress, setExtractProgress] = useState<number>(0)
  const [extractComplete, setExtractComplete] = useState<boolean>(false)
  const [archiveContents, setArchiveContents] = useState<ArchiveEntry[]>([])
  const [showContents, setShowContents] = useState<boolean>(false)

  // 获取支持的压缩格式
  const [supportedFormats, setSupportedFormats] = useState<string[]>([])

  useEffect(() => {
    const fetchSupportedFormats = async (): Promise<void> => {
      try {
        const formats = await window.archiveCompression.getSupportedFormats()
        setSupportedFormats(formats)
      } catch (error) {
        console.error('获取支持的压缩格式失败:', error)
      }
    }

    fetchSupportedFormats()
  }, [])

  // 处理文件上传
  const handleFileSelect = useCallback((files: ArchiveFiles[]): void => {
    setSelectedFiles(files)
  }, [])

  // 处理压缩包选择
  const handleArchiveSelect = useCallback((file: string): void => {
    setArchiveFile(file)
    setShowContents(false)
    setArchiveContents([])
  }, [])

  // 查看压缩包内容
  const handleViewContents = async (): Promise<void> => {
    if (!archiveFile) return

    try {
      const contents = await window.archiveCompression.listArchiveContents(
        archiveFile,
        archivePassword || undefined
      )
      setArchiveContents(contents)
      setShowContents(true)
    } catch (error) {
      console.error('查看压缩包内容失败:', error)
    }
  }

  // 执行压缩
  const handleCompress = async (): Promise<void> => {
    if (selectedFiles.length === 0) return

    try {
      setIsCompressing(true)
      setCompressProgress(10)
      setCompressComplete(false)
      setCompressResult(null)

      // 构建输出文件路径和扩展名
      let extension = '.zip'
      switch (compressionFormat) {
        case ArchiveFormat.TAR:
          extension = '.tar'
          break
        case ArchiveFormat.GZIP:
          extension = '.gz'
          break
        case ArchiveFormat.TGZ:
          extension = '.tgz'
          break
      }

      // 生成默认文件名
      let defaultFileName = 'archive'
      if (selectedFiles.length === 1) {
        // 使用第一个文件的名称作为默认文件名
        const fileName = selectedFiles[0].name
        defaultFileName = fileName.includes('.')
          ? fileName.substring(0, fileName.lastIndexOf('.'))
          : fileName
      }

      // 使用system.saveFile获取保存路径（与图像工具一致）
      const outputFilePath = await window.system.saveFile(`${defaultFileName}${extension}`)

      if (!outputFilePath) {
        setIsCompressing(false)
        return
      }

      setCompressProgress(30)

      // 获取所有文件路径
      const filePaths = selectedFiles.map((file) => file.path)

      // 执行压缩
      const result = await window.archiveCompression.compressFiles(filePaths, outputFilePath, {
        format: compressionFormat,
        level: compressionLevel
      })

      setCompressProgress(100)
      setCompressComplete(true)
      setCompressResult(result)
    } catch (error) {
      console.error('压缩文件失败:', error)
    } finally {
      setIsCompressing(false)
    }
  }

  // 执行解压
  const handleExtract = async (): Promise<void> => {
    if (!archiveFile) return

    try {
      // 让用户选择解压位置
      const outputDir = await window.system.selectDirectory()
      if (!outputDir) return

      setIsExtracting(true)
      setExtractProgress(10)
      setExtractComplete(false)

      // 执行解压
      await window.archiveCompression.extractArchive(
        archiveFile,
        outputDir,
        archivePassword || undefined
      )

      setExtractPath(outputDir) // 保存解压路径用于显示结果
      setExtractProgress(100)
      setExtractComplete(true)
    } catch (error) {
      console.error('解压文件失败:', error)
    } finally {
      setIsExtracting(false)
    }
  }

  // 打开目录
  const handleOpenLocation = async (path: string): Promise<void> => {
    try {
      await window.archiveCompression.openFileLocation(path)
    } catch (error) {
      console.error('打开文件位置失败:', error)
    }
  }

  // 格式化文件大小
  const formatSize = (size: number): string => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  return (
    <Tabs
      defaultValue="compress"
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as 'compress' | 'extract')}
      className="w-full"
    >
      <TabsList className="grid grid-cols-2 w-full mb-6">
        <TabsTrigger
          value="compress"
          className="text-sm font-medium flex items-center justify-center"
        >
          <Archive className="mr-2 h-4 w-4" />
          {t('compress')}
        </TabsTrigger>
        <TabsTrigger
          value="extract"
          className="text-sm font-medium flex items-center justify-center"
        >
          <FolderOutput className="mr-2 h-4 w-4" />
          {t('extract')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="compress" className="mt-0">
        <Card className="border border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold">{t('compressFiles')}</CardTitle>
            <CardDescription>{t('compressFilesDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 文件选择区域 */}
            <div className="space-y-4">
              <Label>{t('selectFilesToCompress')}</Label>
              <FileUploader multiple onFilesSelected={handleFileSelect} />

              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label>{t('selectedFiles')}</Label>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center text-sm py-1 border-b last:border-b-0 dark:border-slate-700"
                      >
                        <File className="h-4 w-4 mr-2 text-slate-400" />
                        <span className="truncate flex-1">{file.name}</span>
                        <span className="text-xs text-slate-500">{formatSize(file.size)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 压缩设置 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="compression-format">{t('compressionFormat')}</Label>
                <Select
                  value={compressionFormat}
                  onValueChange={(value) => setCompressionFormat(value as ArchiveFormat)}
                >
                  <SelectTrigger id="compression-format">
                    <SelectValue placeholder={t('selectFormat')} />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedFormats.map((format) => (
                      <SelectItem key={format} value={format}>
                        {format.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {compressionFormat === ArchiveFormat.ZIP && (
                <div className="space-y-2">
                  <Label htmlFor="compression-level">{t('compressionLevel')}</Label>
                  <RadioGroup
                    value={compressionLevel.toString()}
                    onValueChange={(value) => setCompressionLevel(parseInt(value))}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1" id="level-low" />
                      <Label htmlFor="level-low">{t('low')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="5" id="level-medium" />
                      <Label htmlFor="level-medium">{t('medium')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="9" id="level-high" />
                      <Label htmlFor="level-high">{t('high')}</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>

            {/* 压缩按钮和进度 */}
            <div className="space-y-4">
              <Button
                type="button"
                onClick={handleCompress}
                disabled={isCompressing || selectedFiles.length === 0}
                className="w-full"
              >
                {isCompressing ? (
                  <>
                    <div className="animate-spin mr-2">
                      <Archive className="h-4 w-4" />
                    </div>
                    {t('compressing')}
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4 mr-2" />
                    {t('compressFiles')}
                  </>
                )}
              </Button>

              {isCompressing && <Progress value={compressProgress} className="h-2" />}

              {compressComplete && compressResult && (
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4 mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{t('compressionComplete')}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenLocation(compressResult.outputPath)}
                    >
                      <FolderOutput className="h-4 w-4 mr-2" />
                      {t('openLocation')}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="block text-slate-500 dark:text-slate-400">
                        {t('originalSize')}
                      </span>
                      <span className="font-medium">{formatSize(compressResult.originalSize)}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 dark:text-slate-400">
                        {t('compressedSize')}
                      </span>
                      <span className="font-medium">
                        {formatSize(compressResult.compressedSize)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-500 dark:text-slate-400">
                        {t('compressionRatio')}
                      </span>
                      <span className="font-medium">
                        {(
                          (1 - compressResult.compressedSize / compressResult.originalSize) *
                          100
                        ).toFixed(2)}
                        %
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-500 dark:text-slate-400">
                        {t('fileCount')}
                      </span>
                      <span className="font-medium">{compressResult.entryCount}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="extract" className="mt-0">
        <Card className="border border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold">{t('extractArchive')}</CardTitle>
            <CardDescription>{t('extractArchiveDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 压缩包选择 */}
            <div className="space-y-4">
              <Label>{t('selectArchiveToExtract')}</Label>
              <FileUploader
                multiple={false}
                accept=".zip,.tar,.gz,.tgz"
                onFilesSelected={(files) => files.length > 0 && handleArchiveSelect(files[0].path)}
              />

              {archiveFile && (
                <div className="flex items-center justify-between mt-2 p-2 border rounded-md">
                  <div className="flex items-center">
                    <FileArchive className="h-5 w-5 mr-2 text-blue-500" />
                    <span className="truncate max-w-xs">{archiveFile.split('/').pop()}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleViewContents}>
                    {t('viewContents')}
                  </Button>
                </div>
              )}

              {/* 显示压缩包内容 */}
              {showContents && archiveContents.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t('archiveContents')}</Label>
                    <span className="text-xs text-slate-500">
                      {archiveContents.length} {t('items')}
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2 text-sm">
                    {archiveContents.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center py-1 border-b last:border-b-0 dark:border-slate-700"
                      >
                        {item.isDirectory ? (
                          <FolderInput className="h-4 w-4 mr-2 text-slate-400" />
                        ) : (
                          <File className="h-4 w-4 mr-2 text-slate-400" />
                        )}
                        <span className="truncate flex-1">{item.name}</span>
                        {!item.isDirectory && (
                          <span className="text-xs text-slate-500">{formatSize(item.size)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 解压设置 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="archive-password">{t('password')}</Label>
                  <span className="text-xs text-slate-500">{t('optional')}</span>
                </div>
                <Input
                  id="archive-password"
                  type="password"
                  value={archivePassword}
                  onChange={(e) => setArchivePassword(e.target.value)}
                  placeholder={t('enterPasswordIfNeeded')}
                />
              </div>
            </div>

            {/* 解压按钮和进度 */}
            <div className="space-y-4">
              <Button
                type="button"
                onClick={handleExtract}
                disabled={isExtracting || !archiveFile}
                className="w-full"
              >
                {isExtracting ? (
                  <>
                    <div className="animate-spin mr-2">
                      <FolderOutput className="h-4 w-4" />
                    </div>
                    {t('extracting')}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    {t('extractArchive')}
                  </>
                )}
              </Button>

              {isExtracting && <Progress value={extractProgress} className="h-2" />}

              {extractComplete && (
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{t('extractionComplete')}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenLocation(extractPath)}
                    >
                      <FolderOutput className="h-4 w-4 mr-2" />
                      {t('openLocation')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
