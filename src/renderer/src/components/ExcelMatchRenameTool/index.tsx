import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  Folder,
  Play,
  RefreshCw,
  Settings
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { toast } from '@renderer/components/ui/toast'
import { DataRow, Field, Panel, PanelBody, PanelHeader } from '@renderer/components/ui/panel'
import { EmptyState, StatusDot } from '@renderer/components/ui/states'

type MatchMode = 'whole' | 'split' | 'regex'
type WorkStep = 'source' | 'mapping' | 'preview'

interface PreviewItem {
  originalFile: string
  originalPath: string
  extractedKey: string
  matchedValue: string | null
  newFilename: string | null
  status: 'match' | 'no-match' | 'error'
  error?: string
}

const getFileName = (path: string): string => path.split(/[\\/]/).pop() || path

export default function ExcelMatchRenameTool({ onBack }: { onBack?: () => void }): JSX.Element {
  const { t } = useTranslation()
  // 导航由外层工作台承载，保留该属性以兼容现有调用方。
  void onBack

  // Data Sources
  const [folderPath, setFolderPath] = useState<string>('')
  const [files, setFiles] = useState<string[]>([])
  const [excelPath, setExcelPath] = useState<string>('')
  const [excelHeaders, setExcelHeaders] = useState<string[]>([])
  const [excelData, setExcelData] = useState<any[]>([])

  // Configuration
  const [matchMode, setMatchMode] = useState<MatchMode>('whole')
  const [separator, setSeparator] = useState<string>('_')
  const [splitIndex, setSplitIndex] = useState<number>(0)
  const [regexPattern, setRegexPattern] = useState<string>('')
  const [regexGroup, setRegexGroup] = useState<number>(1)

  const [matchColumn, setMatchColumn] = useState<string>('')
  const [renameColumn, setRenameColumn] = useState<string>('')
  const [useRenamePattern, setUseRenamePattern] = useState<boolean>(false)
  const [renamePattern, setRenamePattern] = useState<string>('')

  const [targetDir, setTargetDir] = useState<string>('')
  const [overwrite, setOverwrite] = useState<boolean>(false)

  // Status
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [activeStep, setActiveStep] = useState<WorkStep>('source')

  // Handlers
  const handleSelectFolder = async (): Promise<void> => {
    const path = await window.excelMatch.selectFolder()
    if (path) {
      setFolderPath(path)
      // Scan files
      const fileList = await window.excelMatch.scanFolder(path)
      setFiles(fileList)
      toast.success({
        title: t('folderSelected'),
        description: t('emrFilesFound', { count: fileList.length })
      })
    }
  }

  const handleSelectExcel = async (): Promise<void> => {
    try {
      const result = await window.excelMatch.readExcel()
      if (result) {
        setExcelPath(result.path)
        setExcelHeaders(result.headers)
        setExcelData(result.data)
        // Auto select first headers
        if (result.headers.length > 0) {
          setMatchColumn(result.headers[0])
          if (result.headers.length > 1) {
            setRenameColumn(result.headers[1])
          } else {
            setRenameColumn(result.headers[0])
          }
        }
        toast.success({
          title: t('excelLoaded'),
          description: t('emrRowsLoaded', { count: result.data.length })
        })
      }
    } catch (e) {
      toast.error({ title: t('error'), description: t('emrReadExcelFailed') })
    }
  }

  const handleSelectTargetDir = async (): Promise<void> => {
    const path = await window.excelMatch.selectFolder()
    if (path) {
      setTargetDir(path)
    }
  }

  // Effect: Calculate Preview
  const previewList = useMemo<PreviewItem[]>(() => {
    if (!folderPath || files.length === 0) return []

    return files.map((file) => {
      let key = ''
      const nameNoExt = file.substring(0, file.lastIndexOf('.')) || file
      const ext = file.substring(file.lastIndexOf('.'))

      try {
        if (matchMode === 'whole') {
          key = nameNoExt
        } else if (matchMode === 'split') {
          const parts = nameNoExt.split(separator)
          if (parts.length > splitIndex) {
            key = parts[splitIndex]
          }
        } else if (matchMode === 'regex') {
          const re = new RegExp(regexPattern)
          const match = nameNoExt.match(re)
          if (match && match[regexGroup]) {
            key = match[regexGroup]
          }
        }
      } catch (e) {
        // Regex error or other
      }

      key = key.trim()

      let matchedRow: any = null
      if (excelData.length > 0 && matchColumn && key) {
        // Try strict match first
        // Assuming key in excel is string
        matchedRow = excelData.find((row) => String(row[matchColumn]).trim() === key)
      }

      let newFilename: string | null = null
      let status: PreviewItem['status'] = 'no-match'
      let error: string | undefined

      if (matchedRow) {
        if (useRenamePattern && renamePattern) {
          // Pattern based rename
          let baseName = renamePattern

          // Simple template replacement {ColName}
          // Use a regex that captures content inside {}
          baseName = baseName.replace(/\{(.+?)\}/g, (_, col) => {
            const colName = col.trim()
            const val = matchedRow[colName]
            return val !== undefined && val !== null ? String(val).trim() : ''
          })

          if (baseName && baseName.trim()) {
            newFilename = baseName.trim() + ext
            status = 'match'
          } else {
            status = 'error'
            error = t('emrEmptyPatternResult')
          }
        } else if (renameColumn) {
          const newNameBase = String(matchedRow[renameColumn] || '').trim()
          if (newNameBase) {
            newFilename = newNameBase + ext
            status = 'match'
          } else {
            status = 'error'
            error = t('emrEmptyRenameValue')
          }
        }
      }

      if (!newFilename && !error) {
        if (!key) {
          status = 'error'
          error = t('emrKeyExtractionFailed')
        } else if (!matchedRow) {
          status = 'no-match'
        } else if (!useRenamePattern && !renameColumn) {
          status = 'error'
          error = t('emrNoRenameColumnSelected')
        }
      }

      return {
        originalFile: file,
        originalPath: `${folderPath}/${file}`, // simple join, better use path.join in main but renderer has no path module
        extractedKey: key,
        matchedValue: matchedRow ? String(matchedRow[matchColumn]) : null,
        newFilename,
        status,
        error
      }
    })
  }, [
    files,
    folderPath,
    excelData,
    matchMode,
    separator,
    splitIndex,
    regexPattern,
    regexGroup,
    matchColumn,
    renameColumn,
    useRenamePattern,
    renamePattern,
    t
  ])

  const matchCount = previewList.filter((i) => i.status === 'match').length
  const noMatchCount = previewList.filter((i) => i.status === 'no-match').length
  const errorCount = previewList.filter((i) => i.status === 'error').length

  const handleExecute = async (): Promise<void> => {
    const tasks = previewList
      .filter((i) => i.status === 'match' && i.newFilename)
      .map((i) => ({
        originalPath: i.originalPath, // Be careful here, constructing path in renderer
        newFilename: i.newFilename!
      }))

    if (tasks.length === 0) {
      toast.warning({ title: t('noFilesToProcess') })
      return
    }

    setIsProcessing(true)
    try {
      const startTime = Date.now()
      const result = await window.excelMatch.execute({
        tasks,
        targetDir: targetDir || undefined,
        overwrite
      })

      // Minimum loading time for UX (800ms)
      const elapsed = Date.now() - startTime
      if (elapsed < 800) {
        await new Promise((resolve) => setTimeout(resolve, 800 - elapsed))
      }

      if (result.errors.length > 0) {
        console.error(result.errors)
        toast.warning({
          title: t('emrProcessComplete'),
          description: `${t('emrSuccessCount')}: ${result.success}, ${t('emrFailCount')}: ${result.fail}`
        })
      } else {
        toast.success({
          title: t('emrProcessComplete'),
          description: `${t('emrSuccessCount')}: ${result.success}`
        })
      }

      // Refresh file list if in same dir
      if (!targetDir) {
        const fileList = await window.excelMatch.scanFolder(folderPath)
        setFiles(fileList)
      }
    } catch (e) {
      toast.error({ title: t('error'), description: String(e) })
    } finally {
      setIsProcessing(false)
    }
  }

  const sourceReady = Boolean(folderPath && excelPath)
  const mappingReady = Boolean(
    matchColumn && (useRenamePattern ? renamePattern.trim() : renameColumn)
  )
  const steps: { id: WorkStep; label: string; icon: LucideIcon; complete: boolean }[] = [
    { id: 'source', label: t('emrStepSource'), icon: Folder, complete: sourceReady },
    { id: 'mapping', label: t('emrStepConfig'), icon: Settings, complete: mappingReady },
    { id: 'preview', label: t('emrStepPreview'), icon: Eye, complete: matchCount > 0 }
  ]

  const handleStepNavigate = (step: WorkStep): void => {
    setActiveStep(step)
    document
      .getElementById(`excel-match-${step}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }

  return (
    <div className="space-y-4 text-foreground">
      <div className="flex items-center justify-end gap-2 border-b border-border pb-3 text-xs text-muted-foreground">
        <StatusDot tone={sourceReady ? 'success' : 'neutral'} />
        <span>{sourceReady ? t('readyForPreview') : t('emrPreviewWait')}</span>
      </div>

      <nav
        className="grid grid-cols-3 overflow-hidden rounded-lg border border-border bg-card"
        aria-label={t('excelMatchRename')}
      >
        {steps.map((step, index) => {
          const Icon = step.icon
          const active = activeStep === step.id
          return (
            <button
              key={step.id}
              type="button"
              aria-current={active ? 'step' : undefined}
              onClick={() => handleStepNavigate(step.id)}
              className={`flex min-w-0 items-center gap-3 border-r border-border px-3 py-3 text-left transition-colors last:border-r-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40 sm:px-4 ${
                active
                  ? 'bg-muted text-foreground'
                  : 'bg-card text-muted-foreground hover:bg-muted/40'
              }`}
            >
              <span className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-card text-primary sm:flex">
                {step.complete ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
              </span>
              <span className="min-w-0">
                <span className="block font-mono text-[10px] text-muted-foreground">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="block truncate text-xs font-medium">{step.label}</span>
              </span>
            </button>
          )
        })}
      </nav>

      <div className="grid items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(280px,0.78fr)_minmax(0,1.35fr)]">
        <Panel id="excel-match-source" className="min-w-0 scroll-mt-20">
          <PanelHeader eyebrow="01" title={t('emrStepSource')} description={t('emrSelectFolder')} />
          <PanelBody className="space-y-4">
            <Button
              variant="outline"
              className="h-auto min-h-14 w-full justify-start px-3 py-2.5 text-left"
              onClick={handleSelectFolder}
            >
              <Folder className="mr-3 h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block text-xs font-medium">{t('emrSelectFolder')}</span>
                <span className="mt-0.5 block truncate text-[11px] font-normal text-muted-foreground">
                  {folderPath || t('select')}
                </span>
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-auto min-h-14 w-full justify-start px-3 py-2.5 text-left"
              onClick={handleSelectExcel}
            >
              <FileSpreadsheet className="mr-3 h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block text-xs font-medium">{t('emrSelectExcel')}</span>
                <span className="mt-0.5 block truncate text-[11px] font-normal text-muted-foreground">
                  {excelPath ? getFileName(excelPath) : t('select')}
                </span>
              </span>
            </Button>

            <dl className="divide-y divide-border/70 rounded-lg border border-border bg-muted/20 px-3">
              <DataRow label={t('selectedFiles')} value={files.length} />
              <DataRow label={t('emrExcelConfig')} value={excelData.length} />
            </dl>

            <div className="space-y-4 border-t border-border pt-4">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                <Download className="h-3.5 w-3.5 text-primary" />
                {t('outputFolder')}
              </div>
              <Field label={t('emrTargetDir')}>
                <div className="flex gap-2">
                  <Input
                    value={targetDir}
                    placeholder={t('emrTargetDir')}
                    readOnly
                    aria-label={t('emrTargetDir')}
                    className="min-w-0 bg-muted/30 font-mono text-[11px]"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 shrink-0"
                    onClick={handleSelectTargetDir}
                  >
                    {t('select')}
                  </Button>
                </div>
              </Field>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="overwrite"
                  checked={overwrite}
                  onCheckedChange={(checked) => setOverwrite(!!checked)}
                />
                <Label htmlFor="overwrite" className="text-xs font-normal text-muted-foreground">
                  {t('emrOverwrite')}
                </Label>
              </div>
            </div>
          </PanelBody>
        </Panel>

        <Panel id="excel-match-mapping" className="min-w-0 scroll-mt-20">
          <PanelHeader
            eyebrow="02"
            title={t('emrExcelConfig')}
            description={t('emrMatchRuleDesc')}
          />
          <PanelBody className="space-y-4">
            <Field label={t('emrMatchMode')}>
              <Select value={matchMode} onValueChange={(value) => setMatchMode(value as MatchMode)}>
                <SelectTrigger aria-label={t('emrMatchMode')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whole">{t('emrModeWhole')}</SelectItem>
                  <SelectItem value="split">{t('emrModeSplit')}</SelectItem>
                  <SelectItem value="regex">{t('emrModeRegex')}</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {matchMode === 'split' && (
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/20 p-3">
                <Field label={t('emrSeparator')}>
                  <Input
                    aria-label={t('emrSeparator')}
                    value={separator}
                    onChange={(event) => setSeparator(event.target.value)}
                    className="font-mono"
                  />
                </Field>
                <Field label={t('emrIndex')}>
                  <Input
                    aria-label={t('emrIndex')}
                    type="number"
                    value={splitIndex}
                    onChange={(event) => setSplitIndex(Number(event.target.value))}
                  />
                </Field>
              </div>
            )}

            {matchMode === 'regex' && (
              <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
                <Field label={t('emrRegexPattern')}>
                  <Input
                    aria-label={t('emrRegexPattern')}
                    className="font-mono text-xs"
                    value={regexPattern}
                    onChange={(event) => setRegexPattern(event.target.value)}
                    placeholder="^([a-z]+)_"
                  />
                </Field>
                <Field label={t('emrRegexGroup')}>
                  <Input
                    aria-label={t('emrRegexGroup')}
                    type="number"
                    value={regexGroup}
                    onChange={(event) => setRegexGroup(Number(event.target.value))}
                  />
                </Field>
              </div>
            )}

            <div className="border-t border-border pt-4">
              <Field label={t('emrMatchColumn')}>
                <Select value={matchColumn} onValueChange={setMatchColumn}>
                  <SelectTrigger aria-label={t('emrMatchColumn')}>
                    <SelectValue placeholder={t('select')} />
                  </SelectTrigger>
                  <SelectContent>
                    {excelHeaders.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-medium text-foreground">{t('emrRenameColumn')}</span>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="usePattern"
                    checked={useRenamePattern}
                    onCheckedChange={(checked) => setUseRenamePattern(!!checked)}
                  />
                  <Label
                    htmlFor="usePattern"
                    className="text-[11px] font-normal text-muted-foreground"
                  >
                    {t('emrUseCustomPattern')}
                  </Label>
                </div>
              </div>

              {!useRenamePattern ? (
                <Select value={renameColumn} onValueChange={setRenameColumn}>
                  <SelectTrigger aria-label={t('emrRenameColumn')} className="bg-card">
                    <SelectValue placeholder={t('select')} />
                  </SelectTrigger>
                  <SelectContent>
                    {excelHeaders.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-3">
                  <Input
                    aria-label={t('emrRenamePattern')}
                    className="bg-card font-mono text-xs"
                    value={renamePattern}
                    onChange={(event) => setRenamePattern(event.target.value)}
                    placeholder={t('emrPatternPlaceholder')}
                  />
                  <p className="text-[11px] text-muted-foreground">{t('emrPatternHelp')}</p>
                  <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                    {excelHeaders.map((header) => (
                      <button
                        key={header}
                        type="button"
                        className="rounded-md border border-border bg-card px-2 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        onClick={() => setRenamePattern((pattern) => pattern + `{${header}}`)}
                      >
                        {header}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PanelBody>
        </Panel>

        <Panel
          id="excel-match-preview"
          className="min-w-0 scroll-mt-20 lg:col-span-2 xl:col-span-1"
        >
          <PanelHeader
            eyebrow="03"
            title={t('emrStepPreview')}
            action={
              <span className="font-mono text-xs text-muted-foreground">
                {matchCount} / {files.length}
              </span>
            }
          />

          <dl className="grid grid-cols-3 divide-x divide-border border-b border-border bg-muted/20">
            <div className="px-3 py-3">
              <dt className="truncate text-[10px] text-muted-foreground">{t('emrStatusMatch')}</dt>
              <dd className="mt-1 font-mono text-lg font-semibold text-primary">{matchCount}</dd>
            </div>
            <div className="px-3 py-3">
              <dt className="truncate text-[10px] text-muted-foreground">
                {t('emrStatusNoMatch')}
              </dt>
              <dd className="mt-1 font-mono text-lg font-semibold text-foreground">
                {noMatchCount}
              </dd>
            </div>
            <div className="px-3 py-3">
              <dt className="truncate text-[10px] text-muted-foreground">{t('emrStatusError')}</dt>
              <dd className="mt-1 font-mono text-lg font-semibold text-foreground">{errorCount}</dd>
            </div>
          </dl>

          <div className="p-4">
            {files.length === 0 ? (
              <EmptyState
                icon={Folder}
                title={t('emrSelectFolder')}
                description={t('emrPreviewWait')}
                action={
                  <Button variant="outline" size="sm" onClick={handleSelectFolder}>
                    <Folder className="mr-2 h-3.5 w-3.5" />
                    {t('emrSelectFolder')}
                  </Button>
                }
                className="min-h-[360px]"
              />
            ) : (
              <div className="max-h-[480px] min-h-[360px] overflow-auto rounded-lg border border-border">
                <table className="w-full min-w-[580px] border-collapse text-left text-xs">
                  <thead className="sticky top-0 z-10 bg-muted text-muted-foreground">
                    <tr>
                      <th className="w-[31%] border-b border-border px-3 py-2.5 font-medium">
                        {t('emrOriginalFile')}
                      </th>
                      <th className="w-[20%] border-b border-border px-3 py-2.5 font-medium">
                        {t('emrExtractedKey')}
                      </th>
                      <th className="w-[32%] border-b border-border px-3 py-2.5 font-medium">
                        {t('emrNewFilename')}
                      </th>
                      <th className="border-b border-border px-3 py-2.5 font-medium">
                        {t('emrStatus')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70 bg-card">
                    {previewList.map((item, index) => (
                      <tr key={`${item.originalPath}-${index}`} className="align-top">
                        <td className="max-w-0 px-3 py-3">
                          <span className="block truncate font-medium" title={item.originalFile}>
                            {item.originalFile}
                          </span>
                        </td>
                        <td className="max-w-0 px-3 py-3">
                          <code
                            className="block truncate font-mono text-[11px] text-muted-foreground"
                            title={item.extractedKey}
                          >
                            {item.extractedKey || '—'}
                          </code>
                        </td>
                        <td className="max-w-0 px-3 py-3">
                          <span
                            className={`block truncate font-mono text-[11px] ${
                              item.newFilename ? 'text-primary' : 'text-muted-foreground'
                            }`}
                            title={item.newFilename || undefined}
                          >
                            {item.newFilename || '—'}
                          </span>
                          {item.error && (
                            <span className="mt-1 block whitespace-normal text-[10px] leading-relaxed text-destructive">
                              {item.error}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <span
                            className="inline-flex items-center gap-2 text-[10px] text-muted-foreground"
                            title={item.error}
                          >
                            <StatusDot
                              tone={
                                item.status === 'match'
                                  ? 'success'
                                  : item.status === 'error'
                                    ? 'error'
                                    : 'neutral'
                              }
                            />
                            {item.status === 'match'
                              ? t('emrStatusMatch')
                              : item.status === 'error'
                                ? t('emrStatusError')
                                : t('emrStatusNoMatch')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-3">
            <span className="text-xs text-muted-foreground">
              {t('emrSuccessCount')}: {matchCount}
            </span>
            <Button
              disabled={!folderPath || !excelPath || previewList.length === 0 || isProcessing}
              onClick={handleExecute}
            >
              {isProcessing ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {isProcessing ? t('emrProcessing') : t('emrExecute')}
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  )
}
