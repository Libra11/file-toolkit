import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, FileVideo, FolderOpen, ListChecks, Loader2, Settings2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Slider } from '@renderer/components/ui/slider'
import { Switch } from '@renderer/components/ui/switch'
import { Panel, PanelBody, PanelHeader, Field } from '@renderer/components/ui/panel'
import { SegmentedControl } from '@renderer/components/ui/segmented-control'
import { Notice } from '@renderer/components/ui/states'
import type { DownloadOptions } from './types'

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
  const [activeTab, setActiveTab] = useState('single')
  const [m3u8Url, setM3u8Url] = useState('')
  const [fileName, setFileName] = useState('')
  const [batchInput, setBatchInput] = useState('')
  const [outputDir, setOutputDir] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [downloadOptions, setDownloadOptions] = useState<DownloadOptions>({
    maxRetries: 3,
    retryDelay: 3000,
    maxConcurrent: 5,
    segmentTimeout: 30000,
    continueOnError: true
  })

  const handleSelectOutputDirectory = async (): Promise<void> => {
    try {
      const directory = await (activeTab === 'batch'
        ? window.m3u8Download.selectBatchOutputDirectory()
        : window.m3u8Download.selectM3u8OutputDirectory())
      if (directory) {
        setOutputDir(directory)
      }
    } catch (selectError) {
      console.error('选择目录错误:', selectError)
      setError(`${t('selectDirectoryError')}: ${selectError}`)
    }
  }

  const handleSingleDownload = async (): Promise<void> => {
    if (!m3u8Url.trim()) {
      setError(t('pleaseEnterM3u8Url'))
      return
    }

    let url = m3u8Url.trim()
    let name = fileName.trim()
    if (url.includes('----')) {
      const parts = url.split('----').map((part) => part.trim())
      if (parts.length >= 2 && parts[0] && parts[1]) {
        url = parts[0]
        if (!name) {
          name = parts[1]
        }
      }
    }

    if (!name) {
      setError(t('pleaseEnterFileName'))
      return
    }
    if (!outputDir) {
      setError(t('pleaseSelectOutputDirectory'))
      return
    }

    setIsSubmitting(true)
    try {
      setError('')
      await onSingleDownload(url, name, outputDir, downloadOptions)
      setM3u8Url('')
      setFileName('')
    } catch (downloadError) {
      console.error('下载错误:', downloadError)
      setError(`${t('downloadError')}: ${downloadError}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    const url = m3u8Url.trim()
    if (url.includes('----')) {
      const parts = url.split('----').map((part) => part.trim())
      if (parts.length >= 2 && parts[0] && parts[1] && !fileName) {
        setM3u8Url(parts[0])
        setFileName(parts[1])
      }
    }
  }, [m3u8Url, fileName])

  const handleBatchDownload = async (): Promise<void> => {
    if (!batchInput.trim()) {
      setError(t('pleaseEnterBatchInput'))
      return
    }
    if (!outputDir) {
      setError(t('pleaseSelectOutputDirectory'))
      return
    }

    setIsSubmitting(true)
    try {
      setError('')
      await onBatchDownload(batchInput, outputDir, downloadOptions)
      setBatchInput('')
    } catch (downloadError) {
      console.error('批量下载错误:', downloadError)
      setError(`${t('batchDownloadError')}: ${downloadError}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    setM3u8Url('')
    setFileName('')
    setBatchInput('')
    setOutputDir('')
    setError('')
  }, [activeTab])

  return (
    <Panel>
      <PanelHeader
        eyebrow={t('createDownload')}
        title={t('createDownload')}
        description={t('m3u8DownloadDescription')}
        action={<FileVideo className="h-4 w-4 text-muted-foreground" />}
      />
      <PanelBody className="space-y-5 p-4">
        <SegmentedControl
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { value: 'single', label: t('singleFileMode'), icon: FileVideo },
            { value: 'batch', label: t('batchMode'), icon: ListChecks }
          ]}
          ariaLabel={t('createDownload')}
          className="grid w-full grid-cols-2"
        />

        {activeTab === 'single' ? (
          <div className="space-y-4">
            <Field label={t('m3u8Url')}>
              <Input
                id="m3u8Url"
                value={m3u8Url}
                onChange={(event) => setM3u8Url(event.target.value)}
                placeholder={t('enterM3u8Url')}
                className="bg-background/50 font-mono text-xs"
              />
            </Field>
            <Field label={t('fileName')} hint="----">
              <Input
                id="fileName"
                value={fileName}
                onChange={(event) => setFileName(event.target.value)}
                placeholder={t('enterFileName')}
                className="bg-background/50"
              />
            </Field>
            <p className="border-l-2 border-border pl-3 text-[11px] leading-relaxed text-muted-foreground">
              {t('batchInputFormat')}
            </p>
          </div>
        ) : (
          <Field
            label={t('batchInput')}
            hint={`${batchInput.split('\n').filter((line) => line.trim()).length}`}
          >
            <Textarea
              id="batchInput"
              value={batchInput}
              onChange={(event) => setBatchInput(event.target.value)}
              className="min-h-44 resize-y bg-background/50 font-mono text-xs"
              placeholder={t('batchInputPlaceholder')}
            />
          </Field>
        )}

        <Field label={t('outputDirectory')}>
          <div className="flex gap-2">
            <Input
              id="outputDir"
              value={outputDir}
              readOnly
              className="min-w-0 bg-background/50 font-mono text-xs"
              placeholder={t('outputDirectoryPlaceholder')}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleSelectOutputDirectory}
              title={t('browse')}
              aria-label={t('browse')}
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
          </div>
        </Field>

        <section className="space-y-4 border-t border-border pt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-medium text-foreground">{t('advancedOptions')}</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {t('advancedOptionsDescription')}
              </p>
            </div>
            <Settings2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t('maxRetries')} hint={downloadOptions.maxRetries}>
              <Slider
                id="maxRetries"
                value={[downloadOptions.maxRetries]}
                min={0}
                max={10}
                step={1}
                onValueChange={([value]) =>
                  setDownloadOptions((prev) => ({ ...prev, maxRetries: value }))
                }
                className="py-2"
              />
            </Field>
            <Field label={t('maxConcurrentDownloads')} hint={downloadOptions.maxConcurrent}>
              <Slider
                id="maxConcurrent"
                value={[downloadOptions.maxConcurrent]}
                min={1}
                max={10}
                step={1}
                onValueChange={([value]) =>
                  setDownloadOptions((prev) => ({ ...prev, maxConcurrent: value }))
                }
                className="py-2"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('retryDelay')}>
              <Input
                id="retryDelay"
                type="number"
                min={0}
                value={downloadOptions.retryDelay}
                onChange={(event) =>
                  setDownloadOptions((prev) => ({
                    ...prev,
                    retryDelay: Number(event.target.value) || 0
                  }))
                }
                className="bg-background/50 text-xs"
              />
            </Field>
            <Field label={t('segmentTimeout')}>
              <Input
                id="segmentTimeout"
                type="number"
                min={1000}
                step={1000}
                value={downloadOptions.segmentTimeout}
                onChange={(event) =>
                  setDownloadOptions((prev) => ({
                    ...prev,
                    segmentTimeout: Number(event.target.value) || 0
                  }))
                }
                className="bg-background/50 text-xs"
              />
            </Field>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 px-3 py-3">
            <label htmlFor="continueOnError" className="text-xs font-medium text-foreground">
              {t('continueOnError')}
              <span className="mt-1 block text-[11px] font-normal leading-relaxed text-muted-foreground">
                {t('continueOnErrorTip')}
              </span>
            </label>
            <Switch
              id="continueOnError"
              checked={downloadOptions.continueOnError}
              onCheckedChange={(checked) =>
                setDownloadOptions((prev) => ({ ...prev, continueOnError: checked }))
              }
            />
          </div>
        </section>

        {error && <Notice tone="error" title={t('downloadError')} description={error} />}

        <div className="space-y-2 border-t border-border pt-4">
          <Button
            className="w-full"
            disabled={isSubmitting}
            onClick={activeTab === 'batch' ? handleBatchDownload : handleSingleDownload}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isSubmitting
              ? t('processing')
              : activeTab === 'batch'
                ? t('batchDownload')
                : t('download')}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => onSetActiveTab('tasks')}>
            <ListChecks className="mr-2 h-4 w-4" />
            {t('downloadTasks')}
          </Button>
        </div>
      </PanelBody>
    </Panel>
  )
}
