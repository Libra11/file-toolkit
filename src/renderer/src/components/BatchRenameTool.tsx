/**
 * Author: Libra
 * Date: 2025-09-09 16:57:00
 * LastEditors: Libra
 * Description: 批量重命名工具组件
 */
import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Calendar,
  CheckCircle2,
  Eye,
  FileCode,
  FileText,
  FolderOpen,
  Hash,
  Loader2,
  Play,
  Replace,
  Settings2,
  Trash2,
  Type,
  XCircle
} from 'lucide-react'
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
import { Switch } from '@renderer/components/ui/switch'
import { Panel, PanelBody, PanelHeader, Field } from '@renderer/components/ui/panel'
import { EmptyState, Notice, StatusDot } from '@renderer/components/ui/states'

interface RenameRule {
  type: 'sequence' | 'replace' | 'prefix' | 'suffix' | 'regex' | 'timestamp' | 'extension'
  value: string
  options?: {
    startNumber?: number
    padding?: number
    replaceWith?: string
    format?: string
    preserveExtension?: boolean
    caseSensitive?: boolean
  }
}

interface RenameTask {
  originalPath: string
  newName: string
  status: 'pending' | 'success' | 'error'
  error?: string
}

interface RenamePreviewResult {
  tasks: RenameTask[]
  conflicts: string[]
}

interface BatchRenameToolProps {
  onBack?: () => void
}

const getFileName = (path: string): string => path.split(/[\\/]/).pop() || path

export default function BatchRenameTool({ onBack }: BatchRenameToolProps): JSX.Element {
  const { t } = useTranslation()
  // 导航由外层工作台承载，保留该属性以兼容现有调用方。
  void onBack

  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [rules, setRules] = useState<RenameRule[]>([])
  const [previewResult, setPreviewResult] = useState<RenamePreviewResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedResults, setProcessedResults] = useState<RenameTask[]>([])

  // 文件选择处理
  const handleFileSelect = useCallback(async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('dialog:openFile', {
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: t('allFiles'), extensions: ['*'] }]
      })

      if (result.canceled || !result.filePaths) {
        return
      }

      setSelectedFiles(result.filePaths)
      setPreviewResult(null)
      setProcessedResults([])
    } catch (error) {
      console.error('Failed to select files:', error)
    }
  }, [t])

  // 添加规则
  const addRule = useCallback(
    (type: RenameRule['type']) => {
      const newRule: RenameRule = {
        type,
        value: '',
        options: {
          preserveExtension: true,
          caseSensitive: false
        }
      }

      // 为不同类型设置默认值
      switch (type) {
        case 'sequence':
          newRule.options!.startNumber = 1
          newRule.options!.padding = 0
          break
        case 'timestamp':
          newRule.options!.format = 'YYYY-MM-DD_HH-mm-ss'
          break
      }

      setRules([...rules, newRule])
      setPreviewResult(null)
    },
    [rules]
  )

  // 移除规则
  const removeRule = useCallback(
    (index: number) => {
      const newRules = rules.filter((_, i) => i !== index)
      setRules(newRules)
      setPreviewResult(null)
    },
    [rules]
  )

  // 更新规则
  const updateRule = useCallback(
    (index: number, updates: Partial<RenameRule>) => {
      const newRules = [...rules]
      newRules[index] = { ...newRules[index], ...updates }
      setRules(newRules)
      setPreviewResult(null)
    },
    [rules]
  )

  // 生成预览
  const generatePreview = useCallback(async () => {
    if (selectedFiles.length === 0 || rules.length === 0) {
      return
    }

    try {
      setIsProcessing(true)
      const result = await window.batchRename.preview(selectedFiles, rules)
      setPreviewResult(result)
    } catch (error) {
      console.error('Failed to generate preview:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [selectedFiles, rules])

  // 执行重命名
  const executeRename = useCallback(async () => {
    if (!previewResult) return

    try {
      setIsProcessing(true)
      const results = await window.batchRename.execute(previewResult.tasks)
      setProcessedResults(results)

      // 更新选中文件列表，只保留成功重命名的文件
      const successfulTasks = results.filter((task) => task.status === 'success')
      if (successfulTasks.length > 0) {
        setSelectedFiles([])
        setPreviewResult(null)
      }
    } catch (error) {
      console.error('Failed to execute rename:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [previewResult])

  const getRuleIcon = (type: RenameRule['type']): JSX.Element => {
    switch (type) {
      case 'sequence':
        return <Hash className="h-4 w-4" />
      case 'replace':
        return <Replace className="h-4 w-4" />
      case 'prefix':
      case 'suffix':
        return <Type className="h-4 w-4" />
      case 'regex':
        return <FileCode className="h-4 w-4" />
      case 'timestamp':
        return <Calendar className="h-4 w-4" />
      case 'extension':
        return <FileText className="h-4 w-4" />
    }
  }

  // 渲染规则编辑器
  const renderRuleEditor = (rule: RenameRule, index: number): JSX.Element => {
    const updateRuleValue = (value: string): void => {
      updateRule(index, { value })
    }

    const updateRuleOptions = (options: Partial<RenameRule['options']>): void => {
      updateRule(index, { options: { ...rule.options, ...options } })
    }

    return (
      <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
        <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-card text-primary">
              {getRuleIcon(rule.type)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">
                {t(`renameRule.${rule.type}`)}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground">
                {String(index + 1).padStart(2, '0')}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeRule(index)}
            className="h-8 w-8 shrink-0 hover:text-destructive"
            aria-label={t('remove')}
            title={t('remove')}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="space-y-3">
          {rule.type === 'sequence' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('renameRule.prefixText')}>
                  <Input
                    id={`rule-${index}-prefix`}
                    aria-label={t('renameRule.prefixText')}
                    value={rule.value}
                    onChange={(e) => updateRuleValue(e.target.value)}
                    placeholder={t('renameRule.prefixPlaceholder')}
                  />
                </Field>
                <Field label={t('renameRule.startNumber')}>
                  <Input
                    id={`rule-${index}-start`}
                    aria-label={t('renameRule.startNumber')}
                    type="number"
                    value={rule.options?.startNumber || 1}
                    onChange={(e) =>
                      updateRuleOptions({ startNumber: parseInt(e.target.value) || 1 })
                    }
                  />
                </Field>
              </div>
              <Field label={t('renameRule.padding')}>
                <Input
                  id={`rule-${index}-padding`}
                  aria-label={t('renameRule.padding')}
                  type="number"
                  value={rule.options?.padding || 0}
                  onChange={(e) => updateRuleOptions({ padding: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </Field>
            </>
          )}

          {(rule.type === 'replace' || rule.type === 'regex') && (
            <>
              <Field
                label={
                  rule.type === 'replace'
                    ? t('renameRule.searchText')
                    : t('renameRule.regexPattern')
                }
              >
                <Input
                  id={`rule-${index}-search`}
                  aria-label={
                    rule.type === 'replace'
                      ? t('renameRule.searchText')
                      : t('renameRule.regexPattern')
                  }
                  value={rule.value}
                  onChange={(e) => updateRuleValue(e.target.value)}
                  placeholder={
                    rule.type === 'replace'
                      ? t('renameRule.searchPlaceholder')
                      : t('renameRule.regexPlaceholder')
                  }
                  className={rule.type === 'regex' ? 'font-mono text-xs' : undefined}
                />
              </Field>
              <Field label={t('renameRule.replaceWith')}>
                <Input
                  id={`rule-${index}-replace`}
                  aria-label={t('renameRule.replaceWith')}
                  value={rule.options?.replaceWith || ''}
                  onChange={(e) => updateRuleOptions({ replaceWith: e.target.value })}
                  placeholder={t('renameRule.replacePlaceholder')}
                />
              </Field>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`rule-${index}-case`}
                  checked={rule.options?.caseSensitive || false}
                  onCheckedChange={(checked) => updateRuleOptions({ caseSensitive: !!checked })}
                />
                <Label
                  htmlFor={`rule-${index}-case`}
                  className="text-xs font-normal text-muted-foreground"
                >
                  {t('renameRule.caseSensitive')}
                </Label>
              </div>
            </>
          )}

          {(rule.type === 'prefix' || rule.type === 'suffix') && (
            <Field
              label={
                rule.type === 'prefix' ? t('renameRule.prefixText') : t('renameRule.suffixText')
              }
            >
              <Input
                id={`rule-${index}-text`}
                aria-label={
                  rule.type === 'prefix' ? t('renameRule.prefixText') : t('renameRule.suffixText')
                }
                value={rule.value}
                onChange={(e) => updateRuleValue(e.target.value)}
                placeholder={
                  rule.type === 'prefix'
                    ? t('renameRule.prefixPlaceholder')
                    : t('renameRule.suffixPlaceholder')
                }
              />
            </Field>
          )}

          {rule.type === 'timestamp' && (
            <Field label={t('renameRule.timestampFormat')}>
              <Select
                value={rule.options?.format || 'YYYY-MM-DD_HH-mm-ss'}
                onValueChange={(value) => updateRuleOptions({ format: value })}
              >
                <SelectTrigger aria-label={t('renameRule.timestampFormat')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YYYY-MM-DD_HH-mm-ss">2024-01-01_12-30-45</SelectItem>
                  <SelectItem value="YYYY-MM-DD">2024-01-01</SelectItem>
                  <SelectItem value="YYYYMMDD_HHmmss">20240101_123045</SelectItem>
                  <SelectItem value="YYYY-MM-DD_HH-mm">2024-01-01_12-30</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}

          {rule.type === 'extension' && (
            <Field label={t('renameRule.newExtension')}>
              <Input
                id={`rule-${index}-ext`}
                aria-label={t('renameRule.newExtension')}
                value={rule.value}
                onChange={(e) => updateRuleValue(e.target.value)}
                placeholder="jpg"
                className="font-mono"
              />
            </Field>
          )}

          {rule.type !== 'extension' && (
            <div className="flex items-center gap-2 border-t border-border/60 pt-3">
              <Switch
                id={`rule-${index}-preserve`}
                checked={rule.options?.preserveExtension !== false}
                onCheckedChange={(checked) => updateRuleOptions({ preserveExtension: checked })}
                className="data-[state=checked]:bg-primary"
              />
              <Label
                htmlFor={`rule-${index}-preserve`}
                className="text-xs font-normal text-muted-foreground"
              >
                {t('renameRule.preserveExtension')}
              </Label>
            </div>
          )}
        </div>
      </div>
    )
  }

  const previewTasks = previewResult?.tasks ?? []
  const validTaskCount = previewTasks.filter((task) => task.status !== 'error').length
  const errorTaskCount = previewTasks.filter((task) => task.status === 'error').length
  const previewRows: RenameTask[] = previewResult
    ? previewResult.tasks
    : selectedFiles.map((file) => ({ originalPath: file, newName: '', status: 'pending' }))
  const resultSuccessCount = processedResults.filter((result) => result.status === 'success').length
  const resultErrorCount = processedResults.filter((result) => result.status === 'error').length
  const ruleTypes: { type: RenameRule['type']; icon: JSX.Element }[] = [
    { type: 'sequence', icon: <Hash className="h-3.5 w-3.5" /> },
    { type: 'replace', icon: <Replace className="h-3.5 w-3.5" /> },
    { type: 'prefix', icon: <Type className="h-3.5 w-3.5" /> },
    { type: 'suffix', icon: <Type className="h-3.5 w-3.5" /> },
    { type: 'regex', icon: <FileCode className="h-3.5 w-3.5" /> },
    { type: 'timestamp', icon: <Calendar className="h-3.5 w-3.5" /> },
    { type: 'extension', icon: <FileText className="h-3.5 w-3.5" /> }
  ]

  return (
    <div className="space-y-4 text-foreground">
      <div className="flex flex-wrap items-center justify-end gap-2 border-b border-border pb-3">
        <Button variant="outline" onClick={handleFileSelect}>
          <FolderOpen className="mr-2 h-4 w-4" />
          {t('selectFiles')}
        </Button>
        <Button
          onClick={generatePreview}
          disabled={selectedFiles.length === 0 || rules.length === 0 || isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Eye className="mr-2 h-4 w-4" />
          )}
          {t('generatePreview')}
        </Button>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(320px,0.82fr)_minmax(0,1.35fr)]">
        <Panel>
          <PanelHeader
            eyebrow={
              <span className="inline-flex items-center gap-1.5">
                <Settings2 className="h-3 w-3" />
                01
              </span>
            }
            title={t('renameRules')}
            description={t('renameRuleDescription')}
            action={<span className="font-mono text-xs text-muted-foreground">{rules.length}</span>}
          />
          <PanelBody className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {ruleTypes.map((config) => (
                <Button
                  key={config.type}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="justify-start px-2.5 text-xs"
                  onClick={() => addRule(config.type)}
                >
                  <span className="mr-2 text-primary">{config.icon}</span>
                  <span className="truncate">{t(`renameRule.${config.type}`)}</span>
                </Button>
              ))}
            </div>

            {rules.length === 0 ? (
              <EmptyState
                icon={Settings2}
                title={t('noRulesConfigured')}
                description={t('renameRuleDescription')}
                className="min-h-36"
              />
            ) : (
              <div className="space-y-3">{rules.map(renderRuleEditor)}</div>
            )}

            {rules.length > 0 && (
              <div className="flex items-center justify-between border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">
                  {t('renameRules')} · {rules.length}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRules([])
                    setPreviewResult(null)
                  }}
                  className="hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  {t('remove')}
                </Button>
              </div>
            )}
          </PanelBody>
        </Panel>

        <div className="min-w-0 space-y-4">
          <Panel>
            <PanelHeader
              eyebrow="02"
              title={t('renamePreview')}
              description={
                selectedFiles.length > 0 ? t('readyForPreview') : t('selectFilesToStartPreview')
              }
              action={
                <span className="font-mono text-xs text-muted-foreground">
                  {selectedFiles.length}
                </span>
              }
            />

            <dl className="grid grid-cols-3 divide-x divide-border border-b border-border bg-muted/20">
              <div className="px-4 py-3">
                <dt className="text-[11px] text-muted-foreground">{t('validFiles')}</dt>
                <dd className="mt-1 font-mono text-lg font-semibold text-foreground">
                  {previewResult ? validTaskCount : '—'}
                </dd>
              </div>
              <div className="px-4 py-3">
                <dt className="text-[11px] text-muted-foreground">{t('errorFiles')}</dt>
                <dd className="mt-1 font-mono text-lg font-semibold text-foreground">
                  {previewResult ? errorTaskCount : '—'}
                </dd>
              </div>
              <div className="px-4 py-3">
                <dt className="text-[11px] text-muted-foreground">{t('conflicts')}</dt>
                <dd className="mt-1 font-mono text-lg font-semibold text-foreground">
                  {previewResult?.conflicts.length ?? '—'}
                </dd>
              </div>
            </dl>

            {previewResult && previewResult.conflicts.length > 0 && (
              <Notice
                tone="error"
                title={t('renameConflicts')}
                description={previewResult.conflicts.join('\n')}
                className="m-4 whitespace-pre-line"
              />
            )}

            {isProcessing && (
              <Notice tone="loading" title={t('processing')} className="mx-4 mt-4" />
            )}

            <div className="p-4">
              {previewRows.length === 0 ? (
                <EmptyState
                  icon={FolderOpen}
                  title={t('selectFiles')}
                  description={t('selectFilesToStartPreview')}
                  action={
                    <Button variant="outline" size="sm" onClick={handleFileSelect}>
                      <FolderOpen className="mr-2 h-3.5 w-3.5" />
                      {t('selectFiles')}
                    </Button>
                  }
                  className="min-h-64"
                />
              ) : (
                <div className="max-h-[430px] overflow-auto rounded-lg border border-border">
                  <table className="w-full min-w-[520px] border-collapse text-left text-xs">
                    <thead className="sticky top-0 z-10 bg-muted text-muted-foreground">
                      <tr>
                        <th className="w-[42%] border-b border-border px-3 py-2.5 font-medium">
                          {t('emrOriginalFile')}
                        </th>
                        <th className="w-[42%] border-b border-border px-3 py-2.5 font-medium">
                          {t('emrNewFilename')}
                        </th>
                        <th className="border-b border-border px-3 py-2.5 font-medium">
                          {t('emrStatus')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/70 bg-card">
                      {previewRows.map((task, index) => (
                        <tr key={`${task.originalPath}-${index}`} className="align-top">
                          <td className="max-w-0 px-3 py-3">
                            <div className="flex items-center gap-2">
                              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <span
                                className="truncate font-medium text-foreground"
                                title={task.originalPath}
                              >
                                {getFileName(task.originalPath)}
                              </span>
                            </div>
                          </td>
                          <td className="max-w-0 px-3 py-3">
                            <p
                              className={`truncate font-mono text-[11px] ${
                                task.newName ? 'text-primary' : 'text-muted-foreground'
                              }`}
                              title={task.newName || undefined}
                            >
                              {task.newName || '—'}
                            </p>
                            {task.error && (
                              <p className="mt-1 whitespace-normal text-[11px] leading-relaxed text-destructive">
                                {task.error}
                              </p>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">
                            <span className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
                              <StatusDot
                                tone={
                                  task.status === 'error'
                                    ? 'error'
                                    : task.status === 'success'
                                      ? 'success'
                                      : 'neutral'
                                }
                              />
                              {task.status === 'error'
                                ? t('error')
                                : task.status === 'success'
                                  ? t('success')
                                  : t('pending')}
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
              <p className="text-xs text-muted-foreground">
                {rules.length === 0
                  ? t('noRulesConfigured')
                  : selectedFiles.length === 0
                    ? t('selectFilesToStartPreview')
                    : t('readyForPreview')}
              </p>
              <Button
                onClick={executeRename}
                disabled={
                  !previewResult ||
                  validTaskCount === 0 ||
                  (previewResult?.conflicts.length ?? 0) > 0 ||
                  isProcessing
                }
              >
                <Play className="mr-2 h-4 w-4" />
                {t('executeRename')}
              </Button>
            </div>
          </Panel>

          {processedResults.length > 0 && (
            <Panel>
              <PanelHeader
                title={t('renameResults')}
                action={
                  <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <StatusDot tone={resultErrorCount > 0 ? 'error' : 'success'} />
                    {resultSuccessCount} / {processedResults.length}
                  </span>
                }
              />
              <dl className="grid grid-cols-2 divide-x divide-border border-b border-border bg-muted/20">
                <div className="flex items-center justify-between px-4 py-3">
                  <dt className="text-xs text-muted-foreground">{t('success')}</dt>
                  <dd className="font-mono text-sm font-semibold text-primary">
                    {resultSuccessCount}
                  </dd>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <dt className="text-xs text-muted-foreground">{t('failed')}</dt>
                  <dd className="font-mono text-sm font-semibold text-foreground">
                    {resultErrorCount}
                  </dd>
                </div>
              </dl>
              <div className="max-h-64 overflow-auto">
                {processedResults.map((result, index) => (
                  <div
                    key={`${result.originalPath}-${index}`}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3 border-b border-border/70 px-4 py-3 text-xs last:border-b-0"
                  >
                    <span className="truncate font-medium" title={result.originalPath}>
                      {getFileName(result.originalPath)}
                    </span>
                    <div className="min-w-0">
                      <span className="block truncate font-mono text-[11px] text-primary">
                        {result.newName}
                      </span>
                      {result.error && (
                        <span className="mt-1 block text-[11px] text-destructive">
                          {result.error}
                        </span>
                      )}
                    </div>
                    {result.status === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}
