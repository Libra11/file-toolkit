import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Archive,
  Download,
  File,
  FileArchive,
  FolderInput,
  FolderOutput,
  Loader2
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Field, Panel, PanelBody, PanelHeader } from '@renderer/components/ui/panel'
import { Progress } from '@renderer/components/ui/progress'
import { SegmentedControl } from '@renderer/components/ui/segmented-control'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { EmptyState, Notice, StatusDot } from '@renderer/components/ui/states'
import { ArchiveFormat, ArchiveFiles, CompressionResult, ArchiveEntry } from './types'
import FileUploader from './FileUploader'

interface ArchiveCompressionToolProps {
  onBack?: () => void
}

type ArchiveMode = 'compress' | 'extract'

export default function ArchiveCompressionTool({
  onBack
}: ArchiveCompressionToolProps): JSX.Element {
  // Navigation belongs to the outer workspace; keep the callback in the public API.
  void onBack
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<ArchiveMode>('compress')

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
    <div className="min-w-0 space-y-4">
      <div className="border-b border-border pb-4">
        <SegmentedControl<ArchiveMode>
          value={activeTab}
          onChange={setActiveTab}
          ariaLabel={t('archiveCompression')}
          className="w-full sm:w-auto"
          options={[
            { value: 'compress', label: t('compress'), icon: Archive },
            { value: 'extract', label: t('extract'), icon: FolderOutput }
          ]}
        />
      </div>

      {activeTab === 'compress' ? (
        <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(240px,0.75fr)_minmax(0,1fr)]">
          <Panel className="min-w-0">
            <PanelHeader
              eyebrow="01"
              title={t('compressFiles')}
              description={t('compressFilesDescription')}
              action={
                selectedFiles.length > 0 ? (
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <StatusDot tone="success" />
                    {selectedFiles.length} {t('items')}
                  </span>
                ) : undefined
              }
            />
            <PanelBody className="space-y-4">
              <FileUploader multiple onFilesSelected={handleFileSelect} />

              {selectedFiles.length > 0 && (
                <div className="overflow-hidden rounded-md border border-border">
                  <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
                    <span>
                      {selectedFiles.length} {t('items')}
                    </span>
                    <span className="font-medium text-foreground">
                      {formatSize(totalSelectedSize)}
                    </span>
                  </div>
                  <div className="max-h-72 divide-y divide-border overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-3 px-3 py-2.5"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
                          <File className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate text-xs font-medium text-foreground"
                            title={file.path}
                          >
                            {file.name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {formatSize(file.size)}
                          </p>
                        </div>
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
              description={t('chooseCompressionPreferences')}
            />
            <PanelBody className="space-y-5">
              <Field label={t('compressionFormat')}>
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
              </Field>

              {compressionFormat === ArchiveFormat.ZIP && (
                <Field label={t('compressionLevel')}>
                  <SegmentedControl
                    value={compressionLevel.toString()}
                    onChange={(value) => setCompressionLevel(parseInt(value))}
                    ariaLabel={t('compressionLevel')}
                    className="flex w-full [&>button]:flex-1"
                    options={[
                      { value: '1', label: t('low') },
                      { value: '5', label: t('medium') },
                      { value: '9', label: t('high') }
                    ]}
                  />
                </Field>
              )}

              <div className="border-t border-border pt-4">
                <Button
                  type="button"
                  size="lg"
                  onClick={handleCompress}
                  disabled={isCompressing || selectedFiles.length === 0}
                  className="w-full"
                >
                  {isCompressing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Archive className="mr-2 h-4 w-4" />
                  )}
                  {isCompressing ? t('compressing') : t('compressFiles')}
                </Button>
              </div>
            </PanelBody>
          </Panel>

          <Panel className="min-w-0">
            <PanelHeader
              eyebrow="03"
              title={t('outputFile')}
              action={
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <StatusDot
                    tone={isCompressing ? 'active' : compressComplete ? 'success' : 'neutral'}
                  />
                  {isCompressing
                    ? t('compressing')
                    : compressComplete
                      ? t('compressionComplete')
                      : compressionFormat.toUpperCase()}
                </span>
              }
            />
            <PanelBody className="space-y-4" aria-live="polite">
              {isCompressing ? (
                <div className="space-y-3">
                  <Notice
                    tone="loading"
                    title={t('compressing')}
                    description={`${compressProgress}%`}
                  />
                  <Progress value={compressProgress} />
                </div>
              ) : compressComplete && compressResult ? (
                <>
                  <Notice
                    tone="success"
                    title={t('compressionComplete')}
                    description={compressResult.outputPath}
                    action={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenLocation(compressResult.outputPath)}
                        aria-label={t('openLocation')}
                        title={t('openLocation')}
                      >
                        <FolderOutput className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <dl className="divide-y divide-border border-y border-border">
                    <div className="flex items-center justify-between gap-4 py-2.5 text-xs">
                      <dt className="text-muted-foreground">{t('originalSize')}</dt>
                      <dd className="font-medium text-foreground">
                        {formatSize(compressResult.originalSize)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 py-2.5 text-xs">
                      <dt className="text-muted-foreground">{t('compressedSize')}</dt>
                      <dd className="font-medium text-foreground">
                        {formatSize(compressResult.compressedSize)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 py-2.5 text-xs">
                      <dt className="text-muted-foreground">{t('compressionRatio')}</dt>
                      <dd className="font-medium text-primary">
                        {(
                          (1 - compressResult.compressedSize / compressResult.originalSize) *
                          100
                        ).toFixed(2)}
                        %
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 py-2.5 text-xs">
                      <dt className="text-muted-foreground">{t('fileCount')}</dt>
                      <dd className="font-medium text-foreground">{compressResult.entryCount}</dd>
                    </div>
                  </dl>
                </>
              ) : (
                <EmptyState
                  icon={Archive}
                  title={t('compressionResult')}
                  description={
                    selectedFiles.length > 0
                      ? t('chooseCompressionPreferences')
                      : t('selectFilesToCompress')
                  }
                  className="min-h-56"
                />
              )}
            </PanelBody>
          </Panel>
        </div>
      ) : (
        <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(240px,0.75fr)_minmax(0,1fr)]">
          <Panel className="min-w-0">
            <PanelHeader
              eyebrow="01"
              title={t('extractArchive')}
              description={t('extractArchiveDescription')}
              action={
                archiveFile ? (
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <StatusDot tone="success" />
                    {t('selected')}
                  </span>
                ) : undefined
              }
            />
            <PanelBody className="space-y-4">
              <FileUploader
                multiple={false}
                accept=".zip,.tar,.gz,.tgz"
                onFilesSelected={(files) => files.length > 0 && handleArchiveSelect(files[0].path)}
              />

              {archiveFile && (
                <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/20 p-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-primary">
                      <FileArchive className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">
                        {archiveFile.split(/[/\\]/).pop()}
                      </p>
                      <p
                        className="mt-1 truncate text-[11px] text-muted-foreground"
                        title={archiveFile}
                      >
                        {archiveFile}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleViewContents}
                    className="shrink-0"
                  >
                    {t('viewContents')}
                  </Button>
                </div>
              )}

              {showContents && archiveContents.length > 0 && (
                <div className="overflow-hidden rounded-md border border-border">
                  <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
                    <span>{t('archiveContents')}</span>
                    <span>
                      {archiveContents.length} {t('items')}
                    </span>
                  </div>
                  <div className="max-h-64 divide-y divide-border overflow-y-auto">
                    {archiveContents.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="flex items-center gap-3 px-3 py-2.5"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          {item.isDirectory ? (
                            <FolderInput className="h-3.5 w-3.5" />
                          ) : (
                            <File className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <span
                          className="min-w-0 flex-1 truncate text-xs text-foreground"
                          title={item.name}
                        >
                          {item.name}
                        </span>
                        {!item.isDirectory && (
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {formatSize(item.size)}
                          </span>
                        )}
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
              title={t('securityOptions')}
              description={t('optionalPasswordProtection')}
            />
            <PanelBody className="space-y-5">
              <Field label={t('password')} hint={t('optional')}>
                <Input
                  id="archive-password"
                  type="password"
                  value={archivePassword}
                  onChange={(event) => setArchivePassword(event.target.value)}
                  placeholder={t('enterPasswordIfNeeded')}
                />
              </Field>

              <div className="border-t border-border pt-4">
                <Button
                  type="button"
                  size="lg"
                  onClick={handleExtract}
                  disabled={isExtracting || !archiveFile}
                  className="w-full"
                >
                  {isExtracting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {isExtracting ? t('extracting') : t('extractArchive')}
                </Button>
              </div>
            </PanelBody>
          </Panel>

          <Panel className="min-w-0">
            <PanelHeader
              eyebrow="03"
              title={t('outputFolder')}
              action={
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <StatusDot
                    tone={isExtracting ? 'active' : extractComplete ? 'success' : 'neutral'}
                  />
                  {isExtracting
                    ? t('extracting')
                    : extractComplete
                      ? t('extractionComplete')
                      : archiveFile
                        ? t('selected')
                        : t('noFileChosen')}
                </span>
              }
            />
            <PanelBody className="space-y-4" aria-live="polite">
              {isExtracting ? (
                <div className="space-y-3">
                  <Notice
                    tone="loading"
                    title={t('extracting')}
                    description={`${extractProgress}%`}
                  />
                  <Progress value={extractProgress} />
                </div>
              ) : extractComplete ? (
                <Notice
                  tone="success"
                  title={t('extractionComplete')}
                  description={extractPath}
                  action={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenLocation(extractPath)}
                      aria-label={t('openLocation')}
                      title={t('openLocation')}
                    >
                      <FolderOutput className="h-4 w-4" />
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon={FolderOutput}
                  title={t('extractArchive')}
                  description={
                    archiveFile ? t('optionalPasswordProtection') : t('selectArchiveToExtract')
                  }
                  className="min-h-56"
                />
              )}
            </PanelBody>
          </Panel>
        </div>
      )}
    </div>
  )
}
