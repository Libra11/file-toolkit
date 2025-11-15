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
import {
  Archive,
  File,
  FileArchive,
  FolderInput,
  FolderOutput,
  Download,
  Sparkles
} from 'lucide-react'
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
import { BackToHomeButton } from '@renderer/components/ui/BackToHomeButton'
import { ArchiveFormat, ArchiveFiles, CompressionResult, ArchiveEntry } from './types'
import FileUploader from './FileUploader'

interface ArchiveCompressionToolProps {
  onBack?: () => void
}

export default function ArchiveCompressionTool({
  onBack
}: ArchiveCompressionToolProps): JSX.Element {
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

  const totalSelectedSize = selectedFiles.reduce((sum, file) => sum + file.size, 0)

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-6 shadow-2xl shadow-purple-900/10 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/60 md:p-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-purple-100/60 via-white to-transparent dark:from-purple-900/20 dark:via-slate-900" />
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex gap-3 flex-row items-center justify-between">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-purple-100/70 px-3 py-1 text-sm font-medium text-purple-600 dark:bg-purple-900/40 dark:text-purple-200">
              <Archive className="h-4 w-4" />
              {t('archiveCompression')}
            </div>
            {onBack && (
              <BackToHomeButton
                onClick={onBack}
                className="bg-purple-100/70 text-purple-600 hover:bg-purple-100 hover:text-purple-700 dark:bg-purple-900/30 dark:text-purple-200 dark:hover:bg-purple-900/50"
              />
            )}
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              {t('archiveCompression')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('archiveCompressionDescription')}
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-purple-100/70 bg-purple-50/60 p-4 text-sm text-purple-700 shadow-inner dark:border-purple-500/30 dark:bg-purple-900/25 dark:text-purple-100 md:flex-row md:items-start md:gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-purple-500 shadow-sm dark:bg-white/10 dark:text-purple-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold">{t('archiveCompressionTipTitle')}</p>
              <p className="text-xs leading-relaxed text-purple-600/80 dark:text-purple-100/80">
                {t('archiveCompressionTipDescription')}
              </p>
            </div>
          </div>
        </div>

        <Tabs
          defaultValue="compress"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'compress' | 'extract')}
          className="w-full"
        >
          <div className="flex justify-center">
            <TabsList className="mb-6 h-[3.2rem] grid w-full max-w-lg grid-cols-2 items-center overflow-hidden rounded-full bg-purple-100/60 p-1 text-sm font-medium dark:bg-purple-900/40">
              <TabsTrigger
                value="compress"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-slate-600 transition-all data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm dark:text-slate-300 dark:data-[state=active]:bg-slate-900/80 dark:data-[state=active]:text-purple-300"
              >
                <Archive className="h-4 w-4" />
                {t('compress')}
              </TabsTrigger>
              <TabsTrigger
                value="extract"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-slate-600 transition-all data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm dark:text-slate-300 dark:data-[state=active]:bg-slate-900/80 dark:data-[state=active]:text-purple-300"
              >
                <FolderOutput className="h-4 w-4" />
                {t('extract')}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="compress" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
              <Card className="border border-purple-100/70 bg-white/90 shadow-xl shadow-purple-900/10 backdrop-blur dark:border-purple-500/20 dark:bg-slate-900/70">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                    {t('compressFiles')}
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                    {t('compressFilesDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-200">
                      {t('selectFilesToCompress')}
                    </Label>
                    <FileUploader multiple onFilesSelected={handleFileSelect} />
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-700/60 dark:bg-slate-800/60">
                      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <span>
                          {selectedFiles.length} {t('items')}
                        </span>
                        <span>{formatSize(totalSelectedSize)}</span>
                      </div>
                      <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="flex items-center gap-3 rounded-xl bg-white/90 px-3 py-2 text-sm shadow-sm ring-1 ring-slate-200/70 transition hover:ring-purple-200 dark:bg-slate-900/80 dark:ring-slate-700/60 dark:hover:ring-purple-500/40"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100/70 text-purple-500 dark:bg-purple-900/30 dark:text-purple-200">
                              <File className="h-4 w-4" />
                            </div>
                            <div className="flex flex-1 flex-col">
                              <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                                {file.name}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {formatSize(file.size)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border border-slate-200/70 bg-white/95 shadow-xl shadow-purple-900/10 dark:border-slate-700/60 dark:bg-slate-900/70">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                      {t('compressionSettings')}
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                      {t('chooseCompressionPreferences')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <Label
                        htmlFor="compression-format"
                        className="text-sm font-medium text-slate-600 dark:text-slate-200"
                      >
                        {t('compressionFormat')}
                      </Label>
                      <Select
                        value={compressionFormat}
                        onValueChange={(value) => setCompressionFormat(value as ArchiveFormat)}
                      >
                        <SelectTrigger
                          id="compression-format"
                          className="h-11 rounded-xl border-slate-200/70 bg-white/80 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/80"
                        >
                          <SelectValue placeholder={t('selectFormat')} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200/60 bg-white/95 shadow-xl dark:border-slate-700 dark:bg-slate-900/95">
                          {supportedFormats.map((format) => (
                            <SelectItem key={format} value={format} className="rounded-lg text-sm">
                              {format.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {compressionFormat === ArchiveFormat.ZIP && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-600 dark:text-slate-200">
                          {t('compressionLevel')}
                        </Label>
                        <RadioGroup
                          value={compressionLevel.toString()}
                          onValueChange={(value) => setCompressionLevel(parseInt(value))}
                          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
                        >
                          {[
                            { value: '1', id: 'level-low', label: t('low') },
                            { value: '5', id: 'level-medium', label: t('medium') },
                            { value: '9', id: 'level-high', label: t('high') }
                          ].map((option) => (
                            <Label
                              key={option.value}
                              htmlFor={option.id}
                              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200/70 bg-white/90 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:border-purple-200 hover:text-purple-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-purple-500/40 dark:hover:text-purple-300"
                            >
                              <RadioGroupItem
                                value={option.value}
                                id={option.id}
                                className="sr-only"
                              />
                              <span>{option.label}</span>
                            </Label>
                          ))}
                        </RadioGroup>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-purple-100/70 bg-gradient-to-br from-purple-500/10 via-white/95 to-white shadow-xl shadow-purple-900/10 dark:border-purple-500/30 dark:from-purple-500/10 dark:via-slate-900/80 dark:to-slate-900/80">
                  <CardContent className="space-y-4 p-5">
                    <Button
                      type="button"
                      onClick={handleCompress}
                      disabled={isCompressing || selectedFiles.length === 0}
                      className="h-11 w-full rounded-xl bg-purple-600 text-sm font-semibold shadow-lg shadow-purple-900/20 transition hover:bg-purple-700 disabled:bg-slate-300 dark:bg-purple-500 dark:hover:bg-purple-400"
                    >
                      {isCompressing ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin">
                            <Archive className="h-4 w-4" />
                          </div>
                          {t('compressing')}
                        </>
                      ) : (
                        <>
                          <Archive className="mr-2 h-4 w-4" />
                          {t('compressFiles')}
                        </>
                      )}
                    </Button>

                    {isCompressing && (
                      <Progress
                        value={compressProgress}
                        className="h-2 rounded-full bg-purple-100/60"
                      />
                    )}

                    {compressComplete && compressResult && (
                      <div className="space-y-4 rounded-2xl border border-purple-100/70 bg-white/90 p-4 shadow-inner dark:border-purple-500/30 dark:bg-slate-900/80">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-base font-semibold text-slate-800 dark:text-white">
                            {t('compressionComplete')}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenLocation(compressResult.outputPath)}
                            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 dark:text-purple-300 dark:hover:text-purple-200"
                          >
                            <FolderOutput className="h-4 w-4" />
                            {t('openLocation')}
                          </Button>
                        </div>

                        <div className="grid gap-3 text-sm sm:grid-cols-2">
                          <div className="rounded-xl bg-purple-50/70 p-3 dark:bg-purple-900/20">
                            <span className="text-xs uppercase tracking-wide text-purple-600 dark:text-purple-300">
                              {t('originalSize')}
                            </span>
                            <p className="mt-1 text-base font-semibold text-slate-800 dark:text-white">
                              {formatSize(compressResult.originalSize)}
                            </p>
                          </div>
                          <div className="rounded-xl bg-purple-50/70 p-3 dark:bg-purple-900/20">
                            <span className="text-xs uppercase tracking-wide text-purple-600 dark:text-purple-300">
                              {t('compressedSize')}
                            </span>
                            <p className="mt-1 text-base font-semibold text-slate-800 dark:text-white">
                              {formatSize(compressResult.compressedSize)}
                            </p>
                          </div>
                          <div className="rounded-xl bg-purple-50/70 p-3 dark:bg-purple-900/20">
                            <span className="text-xs uppercase tracking-wide text-purple-600 dark:text-purple-300">
                              {t('compressionRatio')}
                            </span>
                            <p className="mt-1 text-base font-semibold text-slate-800 dark:text-white">
                              {(
                                (1 - compressResult.compressedSize / compressResult.originalSize) *
                                100
                              ).toFixed(2)}
                              %
                            </p>
                          </div>
                          <div className="rounded-xl bg-purple-50/70 p-3 dark:bg-purple-900/20">
                            <span className="text-xs uppercase tracking-wide text-purple-600 dark:text-purple-300">
                              {t('fileCount')}
                            </span>
                            <p className="mt-1 text-base font-semibold text-slate-800 dark:text-white">
                              {compressResult.entryCount}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="extract" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
              <Card className="border border-purple-100/70 bg-white/90 shadow-xl shadow-purple-900/10 backdrop-blur dark:border-purple-500/20 dark:bg-slate-900/70">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                    {t('extractArchive')}
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                    {t('extractArchiveDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-200">
                      {t('selectArchiveToExtract')}
                    </Label>
                    <FileUploader
                      multiple={false}
                      accept=".zip,.tar,.gz,.tgz"
                      onFilesSelected={(files) =>
                        files.length > 0 && handleArchiveSelect(files[0].path)
                      }
                    />
                  </div>

                  {archiveFile && (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-sm shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100/70 text-blue-500 dark:bg-blue-900/30 dark:text-blue-200">
                          <FileArchive className="h-5 w-5" />
                        </div>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                            {archiveFile.split('/').pop()}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {archiveFile}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleViewContents}
                        className="flex items-center gap-2 text-purple-600 hover:text-purple-700 dark:text-purple-300 dark:hover:text-purple-200"
                      >
                        {t('viewContents')}
                      </Button>
                    </div>
                  )}

                  {showContents && archiveContents.length > 0 && (
                    <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-sm dark:border-slate-700/60 dark:bg-slate-800/60">
                      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <span>{t('archiveContents')}</span>
                        <span>
                          {archiveContents.length} {t('items')}
                        </span>
                      </div>
                      <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                        {archiveContents.map((item, index) => (
                          <div
                            key={`${item.name}-${index}`}
                            className="flex items-center gap-3 rounded-xl bg-white/90 px-3 py-2 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900/80 dark:ring-slate-700/60"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                              {item.isDirectory ? (
                                <FolderInput className="h-4 w-4" />
                              ) : (
                                <File className="h-4 w-4" />
                              )}
                            </div>
                            <span className="flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                              {item.name}
                            </span>
                            {!item.isDirectory && (
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {formatSize(item.size)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border border-slate-200/70 bg-white/95 shadow-xl shadow-purple-900/10 dark:border-slate-700/60 dark:bg-slate-900/70">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                      {t('securityOptions')}
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                      {t('optionalPasswordProtection')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="archive-password"
                          className="text-sm font-medium text-slate-600 dark:text-slate-200"
                        >
                          {t('password')}
                        </Label>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {t('optional')}
                        </span>
                      </div>
                      <Input
                        id="archive-password"
                        type="password"
                        value={archivePassword}
                        onChange={(e) => setArchivePassword(e.target.value)}
                        placeholder={t('enterPasswordIfNeeded')}
                        className="h-11 rounded-xl border-slate-200/70 bg-white/80 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/80"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-purple-100/70 bg-gradient-to-br from-purple-500/10 via-white/95 to-white shadow-xl shadow-purple-900/10 dark:border-purple-500/30 dark:from-purple-500/10 dark:via-slate-900/80 dark:to-slate-900/80">
                  <CardContent className="space-y-4 p-5">
                    <Button
                      type="button"
                      onClick={handleExtract}
                      disabled={isExtracting || !archiveFile}
                      className="h-11 w-full rounded-xl bg-purple-600 text-sm font-semibold shadow-lg shadow-purple-900/20 transition hover:bg-purple-700 disabled:bg-slate-300 dark:bg-purple-500 dark:hover:bg-purple-400"
                    >
                      {isExtracting ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin">
                            <FolderOutput className="h-4 w-4" />
                          </div>
                          {t('extracting')}
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          {t('extractArchive')}
                        </>
                      )}
                    </Button>

                    {isExtracting && (
                      <Progress
                        value={extractProgress}
                        className="h-2 rounded-full bg-purple-100/60"
                      />
                    )}

                    {extractComplete && (
                      <div className="space-y-3 rounded-2xl border border-purple-100/70 bg-white/90 p-4 shadow-inner dark:border-purple-500/30 dark:bg-slate-900/80">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-base font-semibold text-slate-800 dark:text-white">
                            {t('extractionComplete')}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenLocation(extractPath)}
                            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 dark:text-purple-300 dark:hover:text-purple-200"
                          >
                            <FolderOutput className="h-4 w-4" />
                            {t('openLocation')}
                          </Button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{extractPath}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
