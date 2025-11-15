/**
 * Author: Libra
 * Date: 2025-05-15 17:33:23
 * LastEditors: Libra
 * Description:
 */
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Download,
  AlertCircle,
  FileVideo,
  FolderOpen,
  Settings,
  ListChecks,
  Sparkles
} from 'lucide-react'
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
import { Badge } from '@renderer/components/ui/badge'
import { Textarea } from '@renderer/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@renderer/components/ui/alert'
import { DownloadOptions } from './types'

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
  onBatchDownload,
  onSetActiveTab
}: DownloadFormProps): JSX.Element {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<string>('single')
  const [m3u8Url, setM3u8Url] = useState('')
  const [fileName, setFileName] = useState('')
  const [batchInput, setBatchInput] = useState('')
  const [outputDir, setOutputDir] = useState('')
  const [error, setError] = useState('')
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
    <Card className="w-full border border-blue-100/70 bg-white/95 shadow-xl shadow-blue-900/10 backdrop-blur-sm dark:border-blue-500/20 dark:bg-slate-900/70">
      <CardHeader className="space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="flex items-center text-2xl text-slate-900 dark:text-white">
              <FileVideo className="mr-2 h-7 w-7 text-blue-500" />
              {t('m3u8Download')}
            </CardTitle>
            <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
              {t('m3u8DownloadDescription')}
            </CardDescription>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-2xl border border-blue-100/70 bg-blue-50/60 p-3 text-blue-700 shadow-inner dark:border-blue-500/30 dark:bg-blue-900/30 dark:text-blue-100">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4" />
                {t('singleFileMode')}
              </div>
              <p className="mt-1 text-xs text-blue-700/80 dark:text-blue-100/80">
                {t('enterM3u8Url')}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-white/85 p-3 text-slate-600 shadow-inner dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ListChecks className="h-4 w-4" />
                {t('batchMode')}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t('batchInputFormat')}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="single" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-start">
            <TabsList className="mb-6 grid h-12 w-full max-w-xs grid-cols-2 rounded-full bg-blue-100/60 p-1 text-sm font-medium dark:bg-blue-900/40">
              <TabsTrigger
                value="single"
                className="rounded-full text-slate-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm dark:text-slate-300 dark:data-[state=active]:bg-slate-900/80 dark:data-[state=active]:text-blue-200"
              >
                {t('singleFileMode')}
              </TabsTrigger>
              <TabsTrigger
                value="batch"
                className="rounded-full text-slate-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm dark:text-slate-300 dark:data-[state=active]:bg-slate-900/80 dark:data-[state=active]:text-blue-200"
              >
                {t('batchMode')}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="single" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="m3u8Url" className="text-sm font-medium text-slate-600 dark:text-slate-200">
                  {t('m3u8Url')}
                </label>
                <Input
                  id="m3u8Url"
                  value={m3u8Url}
                  onChange={(e) => setM3u8Url(e.target.value)}
                  placeholder={t('enterM3u8Url')}
                  className="h-11 rounded-2xl border-slate-200/70 shadow-sm dark:border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="fileName" className="text-sm font-medium text-slate-600 dark:text-slate-200">
                  {t('fileName')}
                </label>
                <Input
                  id="fileName"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder={t('enterFileName')}
                  className="h-11 rounded-2xl border-slate-200/70 shadow-sm dark:border-slate-700"
                />
              </div>
            </div>
            <div className="rounded-2xl border border-dashed border-blue-200/80 bg-blue-50/40 px-4 py-3 text-xs text-blue-700 dark:border-blue-500/30 dark:bg-blue-900/20 dark:text-blue-100/90">
              {t('batchInputFormat') || 'Tip: URL 后可跟 "----文件名" 自动解析名称'}
            </div>
          </TabsContent>

          <TabsContent value="batch" className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="batchInput" className="text-sm font-medium text-slate-600 dark:text-slate-200">
                {t('batchInput')}
              </label>
              <Textarea
                id="batchInput"
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
                className="min-h-[220px] rounded-2xl border border-dashed border-blue-200/80 bg-blue-50/40 p-4 text-sm shadow-inner dark:border-blue-500/40 dark:bg-blue-900/20"
                placeholder={t('batchInputPlaceholder')}
              />
              <div className="rounded-xl border border-slate-200/70 bg-white/80 p-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                <p className="font-medium text-slate-700 dark:text-slate-200">
                  {t('batchInputFormat')}
                </p>
                <p className="mt-1 font-mono text-[13px] text-slate-600 dark:text-slate-300">
                  https://example.com/video/index.m3u8 ---- 自定义文件名
                </p>
                <p className="mt-1">
                  {t('batchInputPlaceholder')}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="rounded-2xl border border-slate-200/70 bg-white/85 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
          <label htmlFor="outputDir" className="text-sm font-medium text-slate-600 dark:text-slate-200">
            {t('outputDirectory')}
          </label>
          <div className="mt-2 flex flex-col gap-3 md:flex-row">
            <Input
              id="outputDir"
              value={outputDir}
              readOnly
              className="h-11 flex-1 rounded-2xl border-slate-200/70 bg-slate-50/70 text-sm shadow-inner dark:border-slate-700 dark:bg-slate-900/60"
              placeholder={t('outputDirectoryPlaceholder')}
            />
            <Button
              variant="secondary"
              className="h-11 rounded-2xl border border-blue-200/70 bg-blue-500/90 text-white hover:bg-blue-500 dark:border-blue-500/40"
              onClick={handleSelectOutputDirectory}
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              {t('browse')}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 shadow-inner dark:border-slate-700 dark:bg-slate-900/60">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {t('advancedOptions')}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('advancedOptionsDescription', {
                  defaultValue: '配置重试策略、并发数量与容错逻辑'
                })}
              </p>
            </div>
            <Badge variant="outline" className="w-fit text-[11px] uppercase tracking-wide">
              <Settings className="mr-1 h-3 w-3" />
              QoS
            </Badge>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{t('maxRetries')}</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">
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
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{t('maxConcurrentDownloads') || '最大并发下载数'}</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">
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
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="retryDelay" className="text-sm font-medium text-slate-600 dark:text-slate-200">
                {t('retryDelay')}
              </label>
              <Input
                id="retryDelay"
                type="number"
                min={0}
                value={downloadOptions.retryDelay}
                onChange={(event) =>
                  setDownloadOptions({
                    ...downloadOptions,
                    retryDelay: Number(event.target.value) || 0
                  })
                }
                className="h-11 rounded-2xl border-slate-200/70 shadow-sm dark:border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="segmentTimeout"
                className="text-sm font-medium text-slate-600 dark:text-slate-200"
              >
                {t('segmentTimeout')}
              </label>
              <Input
                id="segmentTimeout"
                type="number"
                min={1000}
                step={1000}
                value={downloadOptions.segmentTimeout}
                onChange={(event) =>
                  setDownloadOptions({
                    ...downloadOptions,
                    segmentTimeout: Number(event.target.value) || 0
                  })
                }
                className="h-11 rounded-2xl border-slate-200/70 shadow-sm dark:border-slate-700"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-slate-300/80 px-4 py-3 dark:border-slate-600">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('continueOnError')}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('continueOnErrorTip', { defaultValue: '网络抖动时跳过错误片段继续合并' })}
              </p>
            </div>
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
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-2xl border border-destructive/40 bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('downloadError') || '下载出错'}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Button
          size="lg"
          onClick={activeTab === 'batch' ? handleBatchDownload : handleSingleDownload}
          className="w-full rounded-2xl bg-blue-600 text-base font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 md:w-auto"
        >
          <Download className="w-5 h-5 mr-2" />
          {activeTab === 'batch' ? t('batchDownload') : t('download')}
        </Button>
        <Button
          variant="ghost"
          className="w-full text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white md:w-auto"
          onClick={() => onSetActiveTab('tasks')}
        >
          {t('downloadTasks') || '查看任务列表'}
        </Button>
      </CardFooter>
    </Card>
  )
}
