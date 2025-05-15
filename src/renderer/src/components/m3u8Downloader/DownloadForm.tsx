/**
 * Author: Libra
 * Date: 2025-05-15 17:33:23
 * LastEditors: Libra
 * Description:
 */
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, AlertCircle, FileVideo, FolderOpen, Settings } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@renderer/components/ui/tabs'
import { Slider } from '@renderer/components/ui/slider'
import { Switch } from '@renderer/components/ui/switch'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@renderer/components/ui/accordion'

interface DownloadOptions {
  maxRetries: number
  retryDelay: number
  maxConcurrent: number
  segmentTimeout: number
  continueOnError: boolean
}

interface DownloadFormProps {
  onSingleDownload: (
    url: string,
    fileName: string,
    outputDir: string,
    options: DownloadOptions
  ) => Promise<void>
  onBatchDownload: (
    batchInput: string,
    outputDir: string,
    options: DownloadOptions
  ) => Promise<void>
  onSetActiveTab: (tabName: string) => void
}

export default function DownloadForm({
  onSingleDownload,
  onBatchDownload
}: DownloadFormProps): JSX.Element {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<string>('single')
  const [m3u8Url, setM3u8Url] = useState('')
  const [fileName, setFileName] = useState('')
  const [batchInput, setBatchInput] = useState('')
  const [outputDir, setOutputDir] = useState('')
  const [error, setError] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [downloadOptions, setDownloadOptions] = useState<DownloadOptions>({
    maxRetries: 3,
    retryDelay: 3000,
    maxConcurrent: 5,
    segmentTimeout: 30000,
    continueOnError: true
  })

  // 选择下载目录
  const handleSelectOutputDirectory = async (): Promise<void> => {
    try {
      const directory = await (activeTab === 'batch'
        ? window.m3u8Download.selectBatchOutputDirectory()
        : window.m3u8Download.selectM3u8OutputDirectory())

      if (directory) {
        setOutputDir(directory)
      }
    } catch (error) {
      console.error('选择目录错误:', error)
      setError(`${t('selectDirectoryError')}: ${error}`)
    }
  }

  // 处理单个下载
  const handleSingleDownload = async (): Promise<void> => {
    if (!m3u8Url.trim()) {
      setError(t('pleaseEnterM3u8Url'))
      return
    }

    // 检查URL中是否包含 ---- 分隔符
    let url = m3u8Url.trim()
    let name = fileName.trim()

    if (url.includes('----')) {
      // 如果URL中包含分隔符，尝试解析文件名
      const parts = url.split('----').map((part) => part.trim())
      if (parts.length >= 2 && parts[0] && parts[1]) {
        url = parts[0]
        // 如果用户已经手动输入了文件名，优先使用用户输入的
        if (!name) {
          name = parts[1]
        }
      }
    }

    // 如果仍然没有文件名，则提示用户
    if (!name) {
      setError(t('pleaseEnterFileName'))
      return
    }

    if (!outputDir) {
      setError(t('pleaseSelectOutputDirectory'))
      return
    }

    try {
      setError('')
      await onSingleDownload(url, name, outputDir, downloadOptions)

      // 清空输入框，准备下一个下载
      setM3u8Url('')
      setFileName('')
    } catch (error) {
      console.error('下载错误:', error)
      setError(`${t('downloadError')}: ${error}`)
    }
  }

  // 当URL变化时，尝试自动解析文件名
  useEffect(() => {
    // 检查URL中是否包含 ---- 分隔符
    const url = m3u8Url.trim()
    if (url.includes('----')) {
      // 如果URL中包含分隔符，尝试解析文件名
      const parts = url.split('----').map((part) => part.trim())
      if (parts.length >= 2 && parts[0] && parts[1] && !fileName) {
        // 只有当用户尚未手动输入文件名时才自动填充
        setM3u8Url(parts[0])
        setFileName(parts[1])
      }
    }
  }, [m3u8Url])

  // 处理批量下载
  const handleBatchDownload = async (): Promise<void> => {
    if (!batchInput.trim()) {
      setError(t('pleaseEnterBatchInput'))
      return
    }

    if (!outputDir) {
      setError(t('pleaseSelectOutputDirectory'))
      return
    }

    try {
      setError('')
      await onBatchDownload(batchInput, outputDir, downloadOptions)

      // 清空批量输入
      setBatchInput('')
    } catch (error) {
      console.error('批量下载错误:', error)
      setError(`${t('batchDownloadError')}: ${error}`)
    }
  }

  // 切换模式时重置表单
  useEffect(() => {
    setM3u8Url('')
    setFileName('')
    setBatchInput('')
    setOutputDir('')
    setError('')
  }, [activeTab])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <FileVideo className="mr-2 h-6 w-6 text-indigo-500" />
          {t('m3u8Download')}
        </CardTitle>
        <CardDescription>{t('m3u8DownloadDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="single" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="single">{t('singleFileMode')}</TabsTrigger>
            <TabsTrigger value="batch">{t('batchMode')}</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="m3u8Url" className="text-sm font-medium">
                  {t('m3u8Url')}
                </label>
                <Input
                  id="m3u8Url"
                  value={m3u8Url}
                  onChange={(e) => setM3u8Url(e.target.value)}
                  placeholder={t('enterM3u8Url')}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="fileName" className="text-sm font-medium">
                  {t('fileName')}
                </label>
                <Input
                  id="fileName"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder={t('enterFileName')}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="batch" className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="batchInput" className="text-sm font-medium">
                {t('batchInput')}
              </label>
              <textarea
                id="batchInput"
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
                className="w-full min-h-[200px] p-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={t('batchInputPlaceholder')}
              />
              <p className="text-sm text-muted-foreground mt-1">{t('batchInputFormat')}</p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <label htmlFor="outputDir" className="text-sm font-medium">
            {t('outputDirectory')}
          </label>
          <div className="flex">
            <Input
              id="outputDir"
              value={outputDir}
              readOnly
              className="rounded-r-none"
              placeholder={t('outputDirectoryPlaceholder')}
            />
            <Button
              variant="secondary"
              className="rounded-l-none flex items-center"
              onClick={handleSelectOutputDirectory}
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              {t('browse')}
            </Button>
          </div>
        </div>

        {/* 高级选项 */}
        <Accordion
          type="single"
          collapsible
          value={showAdvanced ? 'advanced' : ''}
          onValueChange={(value) => setShowAdvanced(value === 'advanced')}
        >
          <AccordionItem value="advanced">
            <AccordionTrigger className="text-sm font-medium">
              <Settings className="h-4 w-4 mr-2" />
              {t('advancedOptions')}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label htmlFor="maxRetries" className="text-sm">
                      {t('maxRetries')}
                    </label>
                    <span className="text-sm text-muted-foreground">
                      {downloadOptions.maxRetries}
                    </span>
                  </div>
                  <Slider
                    id="maxRetries"
                    value={[downloadOptions.maxRetries]}
                    min={0}
                    max={10}
                    step={1}
                    onValueChange={(value) =>
                      setDownloadOptions({
                        ...downloadOptions,
                        maxRetries: value[0]
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label htmlFor="maxConcurrent" className="text-sm">
                      {t('maxConcurrentDownloads') || '最大并发下载数'}
                    </label>
                    <span className="text-sm text-muted-foreground">
                      {downloadOptions.maxConcurrent}
                    </span>
                  </div>
                  <Slider
                    id="maxConcurrent"
                    value={[downloadOptions.maxConcurrent]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={(value) =>
                      setDownloadOptions({
                        ...downloadOptions,
                        maxConcurrent: value[0]
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="continueOnError"
                      checked={downloadOptions.continueOnError}
                      onCheckedChange={(checked) =>
                        setDownloadOptions({
                          ...downloadOptions,
                          continueOnError: checked
                        })
                      }
                    />
                    <label htmlFor="continueOnError" className="text-sm">
                      {t('continueOnError')}
                    </label>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* 错误提示 */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button
          size="lg"
          onClick={activeTab === 'batch' ? handleBatchDownload : handleSingleDownload}
          className="min-w-[200px]"
        >
          <Download className="w-5 h-5 mr-2" />
          {activeTab === 'batch' ? t('batchDownload') : t('download')}
        </Button>
      </CardFooter>
    </Card>
  )
}
