import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import {
  ArrowRight,
  Download,
  File,
  Files,
  FileUp,
  FolderOpen,
  Loader2,
  Music,
  Settings,
  Upload,
  X
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import ConversionTypeSelect from '@renderer/components/ConversionTypeSelect'
import FileInput from '@renderer/components/FileInput'
import {
  CONVERSION_TYPES,
  ConversionCategory,
  ConversionType,
  getDefaultOutputExtension
} from '@renderer/lib/conversionTypes'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { DataRow, Field, Panel, PanelBody, PanelHeader } from '@renderer/components/ui/panel'
import { SegmentedControl } from '@renderer/components/ui/segmented-control'
import { EmptyState, Notice } from '@renderer/components/ui/states'

interface ConversionFormProps {
  categories: ConversionCategory[]
  activeCategory: string
}

type ConversionMode = 'single' | 'batch'

const ACCEPTED_FILE_TYPES =
  '.mp4, .png, .jpg, .jpeg, .gif, .webp, .mp3, .wav, .m4a, .flac, .avi, .mov, .webm'

export default function ConversionForm({
  categories,
  activeCategory
}: ConversionFormProps): JSX.Element {
  const { t } = useTranslation()
  const defaultCategory =
    (categories.find((category) => category.name === activeCategory) ?? categories[0])?.name ?? ''
  const [selectedCategory, setSelectedCategory] = useState<string>(defaultCategory)
  const [selectedConversion, setSelectedConversion] = useState<ConversionType | ''>('')
  const [isConverting, setIsConverting] = useState(false)
  const [convertedFilePath, setConvertedFilePath] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [isBatchConverting, setIsBatchConverting] = useState(false)
  const [batchResults, setBatchResults] = useState<string[]>([])
  const [batchProgress, setBatchProgress] = useState(0)
  const [gifSettings, setGifSettings] = useState({
    size: 'medium', // small, medium, large, original
    quality: 'normal', // low, normal, high
    frameRate: 10 // fps
  })
  const batchFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const resolvedCategory =
      (categories.find((category) => category.name === activeCategory) ?? categories[0])?.name ?? ''
    setSelectedCategory(resolvedCategory)
    setSelectedConversion('')
    setConvertedFilePath(null)
    setSelectedFile(null)
    setSelectedFiles([])
    setBatchResults([])
    setBatchProgress(0)
  }, [activeCategory, categories])

  const saveOutputFile = async (conversionType: ConversionType): Promise<string> => {
    const extension = getDefaultOutputExtension(conversionType)
    const defaultFileName = `output.${extension}`
    const outputPath = await window.system.saveFile(defaultFileName)
    if (!outputPath) {
      throw new Error(t('noOutputFileSelected'))
    }
    return outputPath
  }

  const convertMp4ToGif = async (
    inputPath: string,
    outputPath: string,
    settings?: any
  ): Promise<string> => {
    if (settings) {
      return await window.ffmpeg.convertMp4ToGifWithSettings(inputPath, outputPath, settings)
    }
    return await window.ffmpeg.convertMp4ToGif(inputPath, outputPath)
  }

  const convertAviToMp4 = async (inputPath: string, outputPath: string): Promise<string> => {
    return await window.ffmpeg.convertAviToMp4(inputPath, outputPath)
  }

  const convertMovToMp4 = async (inputPath: string, outputPath: string): Promise<string> => {
    return await window.ffmpeg.convertMovToMp4(inputPath, outputPath)
  }

  const convertWebmToMp4 = async (inputPath: string, outputPath: string): Promise<string> => {
    return await window.ffmpeg.convertWebmToMp4(inputPath, outputPath)
  }

  const convertPngToJpg = async (inputPath: string, outputPath: string): Promise<string> => {
    return await window.ffmpeg.convertPngToJpg(inputPath, outputPath)
  }

  const convertJpgToPng = async (inputPath: string, outputPath: string): Promise<string> => {
    return await window.ffmpeg.convertJpgToPng(inputPath, outputPath)
  }

  const convertWebpToJpg = async (inputPath: string, outputPath: string): Promise<string> => {
    return await window.ffmpeg.convertWebpToJpg(inputPath, outputPath)
  }

  const convertJpgToWebp = async (inputPath: string, outputPath: string): Promise<string> => {
    return await window.ffmpeg.convertJpgToWebp(inputPath, outputPath)
  }

  const convertPngToWebp = async (inputPath: string, outputPath: string): Promise<string> => {
    return await window.ffmpeg.convertPngToWebp(inputPath, outputPath)
  }

  const convertWebpToPng = async (inputPath: string, outputPath: string): Promise<string> => {
    return await window.ffmpeg.convertWebpToPng(inputPath, outputPath)
  }

  const openFileLocation = async (filePath: string): Promise<boolean> => {
    try {
      // 使用electron.ipcRenderer直接调用IPC处理程序
      return await window.electron.ipcRenderer.invoke('open-file-location', filePath)
    } catch (error) {
      console.error('打开文件位置错误:', error)
      return false
    }
  }

  const performConversion = async (
    conversionType: ConversionType,
    inputPath: string,
    outputPath: string
  ): Promise<string> => {
    switch (conversionType) {
      // 图片转换
      case CONVERSION_TYPES.JPG_TO_PNG:
        return await convertJpgToPng(inputPath, outputPath)
      case CONVERSION_TYPES.PNG_TO_JPG:
        return await convertPngToJpg(inputPath, outputPath)
      case CONVERSION_TYPES.WEBP_TO_JPG:
        return await convertWebpToJpg(inputPath, outputPath)
      case CONVERSION_TYPES.JPG_TO_WEBP:
        return await convertJpgToWebp(inputPath, outputPath)
      case CONVERSION_TYPES.PNG_TO_WEBP:
        return await convertPngToWebp(inputPath, outputPath)
      case CONVERSION_TYPES.WEBP_TO_PNG:
        return await convertWebpToPng(inputPath, outputPath)

      // 视频转换
      case CONVERSION_TYPES.MP4_TO_GIF:
        return await convertMp4ToGif(
          inputPath,
          outputPath,
          selectedConversion === CONVERSION_TYPES.MP4_TO_GIF ? gifSettings : undefined
        )
      case CONVERSION_TYPES.AVI_TO_MP4:
        return await convertAviToMp4(inputPath, outputPath)
      case CONVERSION_TYPES.MOV_TO_MP4:
        return await convertMovToMp4(inputPath, outputPath)
      case CONVERSION_TYPES.WEBM_TO_MP4:
        return await convertWebmToMp4(inputPath, outputPath)

      // 音频转换
      case CONVERSION_TYPES.MP3_TO_WAV:
        return await window.electron.ipcRenderer.invoke('convert-mp3-to-wav', inputPath, outputPath)
      case CONVERSION_TYPES.WAV_TO_MP3:
        return await window.electron.ipcRenderer.invoke('convert-wav-to-mp3', inputPath, outputPath)
      case CONVERSION_TYPES.FLAC_TO_MP3:
        return await window.electron.ipcRenderer.invoke(
          'convert-flac-to-mp3',
          inputPath,
          outputPath
        )
      case CONVERSION_TYPES.MP3_TO_FLAC:
        return await window.electron.ipcRenderer.invoke(
          'convert-mp3-to-flac',
          inputPath,
          outputPath
        )
      case CONVERSION_TYPES.M4A_TO_MP3:
        return await window.electron.ipcRenderer.invoke('convert-m4a-to-mp3', inputPath, outputPath)

      // 默认处理
      default:
        throw new Error(t('unsupportedConversionType', { type: conversionType }))
    }
  }

  const selectBatchOutputDirectory = async (): Promise<string> => {
    const outputDir = await window.system.selectDirectory()
    if (!outputDir) {
      throw new Error(t('noOutputDirectorySelected'))
    }
    return outputDir
  }

  const performBatchConversion = async (
    conversionType: ConversionType,
    inputPaths: string[],
    outputDir: string
  ): Promise<string[]> => {
    const results: string[] = []
    const extension = getDefaultOutputExtension(conversionType)
    for (let i = 0; i < inputPaths.length; i++) {
      const inputPath = inputPaths[i]
      const fileName = inputPath.split('/').pop()?.split('\\').pop() || `file-${i}`
      const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'))
      const outputPath = `${outputDir}/${nameWithoutExt}.${extension}`

      try {
        const result = await performConversion(conversionType, inputPath, outputPath)
        results.push(result)
        // 更新进度
        setBatchProgress(Math.round(((i + 1) / inputPaths.length) * 100))
      } catch (error) {
        console.error(`批量转换文件 ${inputPath} 失败:`, error)
      }
    }

    return results
  }

  const handleConvert = async (): Promise<void> => {
    console.log(selectedFile, selectedConversion)
    if (!selectedFile || !selectedConversion) return

    setIsConverting(true)
    setConvertedFilePath(null)

    try {
      const inputPath = selectedFile.path

      // 检查输入文件是否存在
      const fileExists = await window.system.checkFileExists(inputPath)
      if (!fileExists) {
        console.error('输入文件不存在:', inputPath)
        throw new Error(t('inputFileNotFound'))
      }

      // 保存文件对话框
      const outputPath = await saveOutputFile(selectedConversion)

      // 确保用户没有取消保存对话框
      if (!outputPath) {
        console.log('用户取消了保存对话框')
        setIsConverting(false)
        return
      }

      console.log('开始转换文件:', inputPath, '->', outputPath, selectedConversion)
      const convertedPath = await performConversion(selectedConversion, inputPath, outputPath)
      console.log('转换完成:', convertedPath)
      // 移除路径中可能存在的引号
      const cleanedPath = convertedPath.replace(/["']/g, '')
      setConvertedFilePath(cleanedPath)
    } catch (error) {
      console.error('Conversion error:', error)
      // Handle error (e.g., show error message to user)
    } finally {
      setIsConverting(false)
    }
  }

  const handleBatchConvert = async (): Promise<void> => {
    if (selectedFiles.length === 0 || !selectedConversion) return

    setIsBatchConverting(true)
    setBatchResults([])
    setBatchProgress(0)

    try {
      const inputPaths = selectedFiles.map((file) => file.path)

      // 选择输出目录
      const outputDir = await selectBatchOutputDirectory()

      console.log(`开始批量转换文件, 文件数: ${inputPaths.length}, 输出目录: ${outputDir}`)

      // 执行批量转换
      const results = await performBatchConversion(selectedConversion, inputPaths, outputDir)

      console.log('批量转换完成, 成功数量:', results.length)
      setBatchResults(results)
      setBatchProgress(100)
    } catch (error) {
      console.error('批量转换错误:', error)
    } finally {
      setIsBatchConverting(false)
    }
  }

  const handleConversionChange = (conversion: ConversionType | ''): void => {
    setSelectedConversion(conversion)
    setConvertedFilePath(null)
  }

  const handleModeChange = (mode: ConversionMode): void => {
    const isBatch = mode === 'batch'
    setIsBatchMode(isBatch)

    // 清除相关状态
    setConvertedFilePath(null)
    setBatchResults([])

    if (!isBatch) {
      setSelectedFiles([])
    } else {
      setSelectedFile(null)
    }
  }

  const handleBatchFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFiles([...selectedFiles, ...Array.from(event.target.files)])
    }
    event.target.value = ''
  }

  const handleBatchDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files)
    setSelectedFiles(files)
  }

  const removeBatchFile = (index: number): void => {
    const newFiles = [...selectedFiles]
    newFiles.splice(index, 1)
    setSelectedFiles(newFiles.length ? newFiles : [])
  }

  const currentCategory = categories.find((category) => category.name === selectedCategory)
  const CurrentCategoryIcon = currentCategory?.icon
  const convertedExtension = convertedFilePath?.split('.').pop()?.toLowerCase() ?? ''
  const isImageOutput = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(convertedExtension)
  const isAudioOutput = ['mp3', 'wav', 'flac', 'm4a'].includes(convertedExtension)
  const isVideoOutput = ['mp4', 'avi', 'mov', 'webm'].includes(convertedExtension)
  const isUnknownOutput =
    convertedFilePath !== null && !isImageOutput && !isAudioOutput && !isVideoOutput

  return (
    <div className="min-w-0 space-y-4">
      <Panel>
        <PanelHeader
          eyebrow="01"
          title={t('conversionType')}
          description={t('selectConversion')}
          action={
            selectedConversion ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                <ArrowRight className="h-3.5 w-3.5" />
                {t(selectedConversion)}
              </span>
            ) : undefined
          }
        />
        <PanelBody className="grid gap-4 md:grid-cols-[minmax(160px,0.35fr)_minmax(0,1fr)]">
          <Field label={t('category')}>
            <div className="flex h-10 min-w-0 items-center gap-2 rounded-md border border-border bg-muted/30 px-3 text-sm text-foreground">
              {CurrentCategoryIcon && (
                <CurrentCategoryIcon className="h-4 w-4 shrink-0 text-primary" />
              )}
              <span className="truncate">{selectedCategory ? t(selectedCategory) : '—'}</span>
            </div>
          </Field>
          <ConversionTypeSelect
            categories={categories}
            selectedCategory={selectedCategory}
            selectedConversion={selectedConversion}
            onConversionChange={handleConversionChange}
          />
        </PanelBody>
      </Panel>

      {!selectedConversion ? (
        <EmptyState
          icon={ArrowRight}
          title={t('selectConversion')}
          description={t('fileConversionDescription')}
          className="min-h-36 bg-card"
        />
      ) : (
        <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <Panel className="min-w-0">
            <PanelHeader
              eyebrow="02"
              title={t('selectSourceFile')}
              description={isBatchMode ? t('selectFilesToConvert') : t('selectFile')}
              action={
                <SegmentedControl<ConversionMode>
                  value={isBatchMode ? 'batch' : 'single'}
                  onChange={handleModeChange}
                  ariaLabel={t('selectSourceFile')}
                  options={[
                    { value: 'single', label: t('singleFileMode'), icon: File },
                    { value: 'batch', label: t('batchMode'), icon: Files }
                  ]}
                />
              }
            />
            <PanelBody>
              {isBatchMode ? (
                <div
                  className="rounded-lg border border-dashed border-input bg-muted/20 p-2 transition-colors hover:border-primary/40"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleBatchDrop}
                >
                  <input
                    ref={batchFileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept={ACCEPTED_FILE_TYPES}
                    onChange={handleBatchFileChange}
                  />

                  {selectedFiles.length === 0 ? (
                    <EmptyState
                      icon={Upload}
                      title={t('selectFilesToConvert')}
                      description={t('dropFilesHere')}
                      className="min-h-36 border-0 bg-transparent px-3 py-4"
                      action={
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-md"
                          onClick={() => batchFileInputRef.current?.click()}
                        >
                          <Upload className="mr-1.5 h-3.5 w-3.5" />
                          {t('selectFile')}
                        </Button>
                      }
                    />
                  ) : (
                    <div className="overflow-hidden rounded-md border border-border bg-card">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-3 py-2.5">
                        <div className="flex min-w-0 items-center gap-2">
                          <Files className="h-4 w-4 shrink-0 text-primary" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground">
                              {selectedFiles.length} {t('selectedFiles')}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {t('readyForConversion')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-md px-2 text-xs"
                            onClick={() => batchFileInputRef.current?.click()}
                          >
                            <Upload className="mr-1.5 h-3.5 w-3.5" />
                            {t('selectFile')}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setSelectedFiles([])}
                            aria-label={t('remove')}
                            title={t('remove')}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <ol className="max-h-56 divide-y divide-border/70 overflow-y-auto">
                        {selectedFiles.map((file, index) => (
                          <li
                            key={`${file.name}-${file.lastModified}-${index}`}
                            className="group flex min-w-0 items-center gap-2 px-3 py-2 hover:bg-muted/30"
                          >
                            <span className="w-5 shrink-0 font-mono text-[10px] text-muted-foreground">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <File className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span
                              className="min-w-0 flex-1 truncate text-xs text-foreground"
                              title={file.name}
                            >
                              {file.name}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0 rounded-md hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => removeBatchFile(index)}
                              aria-label={`${t('remove')} ${file.name}`}
                              title={t('remove')}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ) : (
                <FileInput onFileSelect={setSelectedFile} />
              )}
            </PanelBody>
          </Panel>

          <div className="min-w-0 space-y-4">
            <Panel>
              <PanelHeader
                eyebrow="03"
                title={`${t('settings')} / ${t('preview')}`}
                description={
                  selectedConversion === CONVERSION_TYPES.MP4_TO_GIF
                    ? t('gifSettingsDescription')
                    : t(selectedConversion)
                }
              />
              <PanelBody className="space-y-4">
                <dl className="divide-y divide-border/70 rounded-md border border-border bg-muted/20 px-3">
                  <DataRow
                    label={t('category')}
                    value={selectedCategory ? t(selectedCategory) : '—'}
                  />
                  <DataRow label={t('conversionType')} value={t(selectedConversion)} />
                  <DataRow
                    label={t('selectSourceFile')}
                    value={
                      isBatchMode
                        ? `${selectedFiles.length} ${t('selectedFiles')}`
                        : (selectedFile?.name ?? t('selectFile'))
                    }
                  />
                </dl>

                {selectedConversion === CONVERSION_TYPES.MP4_TO_GIF && (
                  <div className="space-y-3 border-t border-border pt-4">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-primary" />
                      <h3 className="text-xs font-medium text-foreground">{t('gifSettings')}</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <Field label={t('gifSize')}>
                        <Select
                          value={gifSettings.size}
                          onValueChange={(value) =>
                            setGifSettings((prev) => ({ ...prev, size: value }))
                          }
                        >
                          <SelectTrigger className="h-9 rounded-md bg-card">
                            <SelectValue placeholder={t('gifSize')} />
                          </SelectTrigger>
                          <SelectContent className="rounded-md">
                            <SelectItem value="small">{t('small')}</SelectItem>
                            <SelectItem value="medium">{t('medium')}</SelectItem>
                            <SelectItem value="large">{t('large')}</SelectItem>
                            <SelectItem value="original">{t('original')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field label={t('gifQuality')}>
                        <Select
                          value={gifSettings.quality}
                          onValueChange={(value) =>
                            setGifSettings((prev) => ({ ...prev, quality: value }))
                          }
                        >
                          <SelectTrigger className="h-9 rounded-md bg-card">
                            <SelectValue placeholder={t('gifQuality')} />
                          </SelectTrigger>
                          <SelectContent className="rounded-md">
                            <SelectItem value="low">{t('low')}</SelectItem>
                            <SelectItem value="normal">{t('normal')}</SelectItem>
                            <SelectItem value="high">{t('high')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field label={t('gifFrameRate')}>
                        <Select
                          value={gifSettings.frameRate.toString()}
                          onValueChange={(value) =>
                            setGifSettings((prev) => ({ ...prev, frameRate: parseInt(value) }))
                          }
                        >
                          <SelectTrigger className="h-9 rounded-md bg-card">
                            <SelectValue placeholder={t('gifFrameRate')} />
                          </SelectTrigger>
                          <SelectContent className="rounded-md">
                            <SelectItem value="5">5 {t('fps')}</SelectItem>
                            <SelectItem value="10">10 {t('fps')}</SelectItem>
                            <SelectItem value="15">15 {t('fps')}</SelectItem>
                            <SelectItem value="24">24 {t('fps')}</SelectItem>
                            <SelectItem value="30">30 {t('fps')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>

                    <dl className="divide-y divide-border/70 rounded-md border border-border bg-muted/30 px-3">
                      <DataRow label={t('gifSize')} value={t(gifSettings.size)} />
                      <DataRow label={t('gifQuality')} value={t(gifSettings.quality)} />
                      <DataRow
                        label={t('gifFrameRate')}
                        value={`${gifSettings.frameRate} ${t('fps')}`}
                      />
                    </dl>
                  </div>
                )}

                <div className="border-t border-border pt-4">
                  {isBatchMode ? (
                    <Button
                      type="button"
                      className="h-11 w-full rounded-md"
                      onClick={handleBatchConvert}
                      disabled={isBatchConverting || selectedFiles.length === 0}
                    >
                      {isBatchConverting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>{t('batchConverting')}</span>
                          <span className="ml-1">{batchProgress}%</span>
                        </>
                      ) : (
                        <>
                          <Files className="mr-2 h-4 w-4" />
                          {t('batchConvertFiles')}
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="h-11 w-full rounded-md"
                      onClick={handleConvert}
                      disabled={isConverting || !selectedFile}
                    >
                      {isConverting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>{t('converting')}</span>
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          {t('convertFile')}
                        </>
                      )}
                    </Button>
                  )}

                  {isBatchMode && isBatchConverting && (
                    <div
                      className="mt-3 h-1.5 overflow-hidden rounded-sm bg-muted"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={batchProgress}
                    >
                      <div
                        className="h-full bg-primary transition-[width]"
                        style={{ width: `${batchProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              </PanelBody>
            </Panel>

            {isBatchMode && batchResults.length > 0 && (
              <Panel>
                <PanelHeader eyebrow={t('preview')} title={t('outputFiles')} />
                <PanelBody className="space-y-4">
                  <Notice
                    tone="success"
                    title={t('batchConversionSuccess')}
                    description={t('successCount', {
                      count: batchResults.length,
                      total: selectedFiles.length
                    })}
                  />

                  <ol className="max-h-48 divide-y divide-border/70 overflow-y-auto rounded-md border border-border bg-muted/20">
                    {batchResults.map((path, index) => (
                      <li key={`${path}-${index}`} className="flex items-start gap-2 px-3 py-2">
                        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="min-w-0 break-all font-mono text-[11px] leading-relaxed text-foreground">
                          {path}
                        </span>
                      </li>
                    ))}
                  </ol>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-md"
                      onClick={async () => {
                        if (batchResults.length > 0) {
                          // 打开第一个文件所在的文件夹
                          try {
                            await openFileLocation(batchResults[0])
                          } catch (error) {
                            console.error('打开文件位置失败:', error)
                          }
                        }
                      }}
                    >
                      <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
                      {t('openOutputFolder')}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-md"
                      onClick={() => {
                        setSelectedFiles([])
                        setBatchResults([])
                      }}
                    >
                      {t('convertMoreFiles')}
                    </Button>
                  </div>
                </PanelBody>
              </Panel>
            )}

            {!isBatchMode && convertedFilePath && (
              <Panel>
                <PanelHeader eyebrow={t('preview')} title={t('outputFile')} />
                <PanelBody className="space-y-4">
                  <Notice
                    tone="success"
                    title={t('conversionSuccess')}
                    description={t(selectedConversion)}
                  />

                  <div className="flex min-h-32 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/30 p-3">
                    {isImageOutput && (
                      <img
                        src={`myapp:///${convertedFilePath}`}
                        alt={t('preview')}
                        className="max-h-52 max-w-full object-contain"
                        onError={(event) => {
                          console.error('图片加载失败:', convertedFilePath)
                          event.currentTarget.src =
                            'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWltYWdlIj48cmVjdCB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHg9IjMiIHk9IjMiIHJ4PSIyIiByeT0iMiIvPjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ii8+PHBvbHlsaW5lIHBvaW50cz0iMjEgMTUgMTYgMTAgNSAyMSIvPjwvc3ZnPg=='
                        }}
                      />
                    )}

                    {isAudioOutput && (
                      <div className="flex w-full flex-col items-center justify-center py-2 text-center">
                        <Music className="mb-2 h-8 w-8 text-primary" />
                        <p className="mb-3 text-xs text-muted-foreground">{t('audioConverted')}</p>
                        <audio
                          controls
                          className="w-full max-w-[360px]"
                          src={`myapp:///${convertedFilePath}`}
                        >
                          <source src={`myapp:///${convertedFilePath}`} />
                          {t('audioConverted')}
                        </audio>
                      </div>
                    )}

                    {isVideoOutput && (
                      <div className="flex w-full flex-col items-center justify-center text-center">
                        <p className="mb-2 text-xs text-muted-foreground">{t('videoConverted')}</p>
                        <video
                          controls
                          className="max-h-52 max-w-full object-contain"
                          src={`myapp:///${convertedFilePath}`}
                        >
                          <source src={`myapp:///${convertedFilePath}`} />
                          {t('videoConverted')}
                        </video>
                      </div>
                    )}

                    {isUnknownOutput && (
                      <div className="py-3 text-center">
                        <FileUp className="mx-auto mb-2 h-10 w-10 text-primary" />
                        <p className="text-xs text-muted-foreground">{t('fileConverted')}</p>
                      </div>
                    )}
                  </div>

                  <div className="rounded-md border border-border bg-muted/20 p-3">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      {t('outputFile')}
                    </p>
                    <p className="mt-1.5 break-all font-mono text-[11px] leading-relaxed text-foreground">
                      {convertedFilePath}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-md"
                      onClick={async () => {
                        if (convertedFilePath) {
                          console.log('打开文件位置:', convertedFilePath)
                          // 使用electron.shell.showItemInFolder API
                          try {
                            await openFileLocation(convertedFilePath)
                          } catch (error) {
                            console.error('打开文件位置失败:', error)
                          }
                        }
                      }}
                    >
                      <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
                      {t('openFileLocation')}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-md"
                      onClick={() => {
                        // 保留转换类型，但清除文件选择
                        setSelectedFile(null)
                        setConvertedFilePath(null)

                        // 重新聚焦到文件输入框，提示用户选择新文件
                        const fileInput = document.querySelector(
                          'input[type="file"]'
                        ) as HTMLInputElement | null
                        if (fileInput) {
                          fileInput.click()
                        }
                      }}
                    >
                      {t('convertAnother')}
                    </Button>
                  </div>
                </PanelBody>
              </Panel>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
