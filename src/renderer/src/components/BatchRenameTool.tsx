/**
 * Author: Libra
 * Date: 2025-09-09 16:57:00
 * LastEditors: Libra
 * Description:
 */
/*
 * @Author: Libra
 * @Date: 2025-01-09
 * @LastEditors: Libra
 * @Description: 批量重命名工具组件
 */
import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FolderOpen,
  Play,
  Eye,
  Trash2,
  Settings,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Hash,
  Replace,
  Type,
  Calendar,
  FileCode
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Progress } from '@renderer/components/ui/progress'
import { Badge } from '@renderer/components/ui/badge'
import { Switch } from '@renderer/components/ui/switch'
import { Separator } from '@renderer/components/ui/separator'
import { ScrollArea } from '@renderer/components/ui/scroll-area'

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

export default function BatchRenameTool(): JSX.Element {
  const { t } = useTranslation()
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
        filters: [{ name: 'All Files', extensions: ['*'] }]
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
  }, [])

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

  // 渲染规则编辑器
  const renderRuleEditor = (rule: RenameRule, index: number): JSX.Element => {
    const updateRuleValue = (value: string): void => {
      updateRule(index, { value })
    }

    const updateRuleOptions = (options: Partial<RenameRule['options']>): void => {
      updateRule(index, { options: { ...rule.options, ...options } })
    }

    const getRuleIcon = (type: RenameRule['type']): JSX.Element => {
      switch (type) {
        case 'sequence':
          return <Hash className="h-4 w-4" />
        case 'replace':
          return <Replace className="h-4 w-4" />
        case 'prefix':
          return <Type className="h-4 w-4" />
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

    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-4 rounded-2xl border border-white/70 bg-white/90 p-4 shadow-md shadow-indigo-900/5 transition-colors hover:border-white dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 via-white to-slate-50 text-slate-700 dark:from-white/10 dark:via-white/5 dark:to-white/0 dark:text-white">
              {getRuleIcon(rule.type)}
            </div>
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {t(`renameRule.${rule.type}`)}
              </span>
              <div className="text-xs text-slate-500 dark:text-white/70 capitalize">
                {t(`renameRule.${rule.type}Description`)}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeRule(index)}
            className="h-9 w-9 rounded-2xl border border-slate-200/80 text-slate-500 hover:border-destructive/40 hover:text-destructive dark:border-white/20 dark:text-white"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {rule.type === 'sequence' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`rule-${index}-prefix`}>{t('renameRule.prefix')}</Label>
                  <Input
                    id={`rule-${index}-prefix`}
                    value={rule.value}
                    onChange={(e) => updateRuleValue(e.target.value)}
                    placeholder={t('renameRule.prefixPlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor={`rule-${index}-start`}>{t('renameRule.startNumber')}</Label>
                  <Input
                    id={`rule-${index}-start`}
                    type="number"
                    value={rule.options?.startNumber || 1}
                    onChange={(e) =>
                      updateRuleOptions({ startNumber: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor={`rule-${index}-padding`}>{t('renameRule.padding')}</Label>
                <Input
                  id={`rule-${index}-padding`}
                  type="number"
                  value={rule.options?.padding || 0}
                  onChange={(e) => updateRuleOptions({ padding: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </>
          )}

          {(rule.type === 'replace' || rule.type === 'regex') && (
            <>
              <div>
                <Label htmlFor={`rule-${index}-search`}>
                  {rule.type === 'replace'
                    ? t('renameRule.searchText')
                    : t('renameRule.regexPattern')}
                </Label>
                <Input
                  id={`rule-${index}-search`}
                  value={rule.value}
                  onChange={(e) => updateRuleValue(e.target.value)}
                  placeholder={
                    rule.type === 'replace'
                      ? t('renameRule.searchPlaceholder')
                      : t('renameRule.regexPlaceholder')
                  }
                />
              </div>
              <div>
                <Label htmlFor={`rule-${index}-replace`}>{t('renameRule.replaceWith')}</Label>
                <Input
                  id={`rule-${index}-replace`}
                  value={rule.options?.replaceWith || ''}
                  onChange={(e) => updateRuleOptions({ replaceWith: e.target.value })}
                  placeholder={t('renameRule.replacePlaceholder')}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`rule-${index}-case`}
                  checked={rule.options?.caseSensitive || false}
                  onCheckedChange={(checked) => updateRuleOptions({ caseSensitive: !!checked })}
                />
                <Label htmlFor={`rule-${index}-case`}>{t('renameRule.caseSensitive')}</Label>
              </div>
            </>
          )}

          {(rule.type === 'prefix' || rule.type === 'suffix') && (
            <div>
              <Label htmlFor={`rule-${index}-text`}>
                {rule.type === 'prefix' ? t('renameRule.prefixText') : t('renameRule.suffixText')}
              </Label>
              <Input
                id={`rule-${index}-text`}
                value={rule.value}
                onChange={(e) => updateRuleValue(e.target.value)}
                placeholder={
                  rule.type === 'prefix'
                    ? t('renameRule.prefixPlaceholder')
                    : t('renameRule.suffixPlaceholder')
                }
              />
            </div>
          )}

          {rule.type === 'timestamp' && (
            <div>
              <Label htmlFor={`rule-${index}-format`}>{t('renameRule.timestampFormat')}</Label>
              <Select
                value={rule.options?.format || 'YYYY-MM-DD_HH-mm-ss'}
                onValueChange={(value) => updateRuleOptions({ format: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YYYY-MM-DD_HH-mm-ss">2024-01-01_12-30-45</SelectItem>
                  <SelectItem value="YYYY-MM-DD">2024-01-01</SelectItem>
                  <SelectItem value="YYYYMMDD_HHmmss">20240101_123045</SelectItem>
                  <SelectItem value="YYYY-MM-DD_HH-mm">2024-01-01_12-30</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {rule.type === 'extension' && (
            <div>
              <Label htmlFor={`rule-${index}-ext`}>{t('renameRule.newExtension')}</Label>
              <Input
                id={`rule-${index}-ext`}
                value={rule.value}
                onChange={(e) => updateRuleValue(e.target.value)}
                placeholder="jpg"
              />
            </div>
          )}

          {rule.type !== 'extension' && (
            <div className="flex items-center space-x-2">
              <Switch
                id={`rule-${index}-preserve`}
                checked={rule.options?.preserveExtension !== false}
                onCheckedChange={(checked) => updateRuleOptions({ preserveExtension: checked })}
              />
              <Label htmlFor={`rule-${index}-preserve`}>{t('renameRule.preserveExtension')}</Label>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  // 渲染预览结果
  const renderPreviewResult = (): JSX.Element | null => {
    if (!previewResult) return null

    const { tasks, conflicts } = previewResult
    const validTasks = tasks.filter((task) => task.status !== 'error')
    const errorTasks = tasks.filter((task) => task.status === 'error')

    return (
      <Card className="overflow-hidden rounded-[32px] border border-white/80 bg-white/90 shadow-2xl shadow-indigo-900/10 backdrop-blur dark:border-white/15 dark:bg-slate-900/60">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-900 dark:text-white">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 via-white to-orange-50 text-orange-600 dark:from-orange-500/30 dark:via-white/5 dark:to-white/0 dark:text-orange-200">
              <Eye className="h-5 w-5" />
            </div>
            <span>{t('renamePreview')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {conflicts.length > 0 && (
            <div className="rounded-2xl border border-yellow-200/70 bg-gradient-to-r from-yellow-50 via-white to-orange-50 p-4 text-sm text-yellow-800 shadow-inner dark:border-yellow-500/20 dark:from-yellow-500/10 dark:via-transparent dark:to-orange-500/5 dark:text-yellow-100">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <AlertCircle className="h-4 w-4" />
                {t('renameConflicts')}
              </div>
              <div className="space-y-1">
                {conflicts.map((conflict, index) => (
                  <div key={index}>{conflict}</div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm shadow-emerald-100/40 dark:border-white/10 dark:bg-white/5">
              <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-300">
                {validTasks.length}
              </p>
              <p className="text-xs uppercase tracking-wide text-emerald-800/70 dark:text-emerald-200">
                {t('validFiles')}
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm shadow-red-100/40 dark:border-white/10 dark:bg-white/5">
              <p className="text-2xl font-semibold text-red-600 dark:text-red-300">{errorTasks.length}</p>
              <p className="text-xs uppercase tracking-wide text-red-800/70 dark:text-red-200">
                {t('errorFiles')}
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm shadow-amber-100/40 dark:border-white/10 dark:bg-white/5">
              <p className="text-2xl font-semibold text-amber-600 dark:text-amber-200">
                {conflicts.length}
              </p>
              <p className="text-xs uppercase tracking-wide text-amber-800/70 dark:text-amber-200">
                {t('conflicts')}
              </p>
            </div>
          </div>

          <ScrollArea className="h-80 rounded-2xl border border-white/70 bg-white/70 dark:border-white/10 dark:bg-white/5">
            <div className="space-y-3 p-4">
              {tasks.map((task, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm shadow-indigo-900/5 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400 dark:text-white/60" />
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {task.originalPath.split('/').pop()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/60">
                      <span>→</span>
                      <span className="truncate font-medium text-indigo-600 dark:text-indigo-300">
                        {task.newName}
                      </span>
                    </div>
                    {task.error && (
                      <div className="rounded-xl bg-red-50/80 p-2 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-200">
                        {task.error}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    {task.status === 'pending' && (
                      <Badge className="rounded-full bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/70">
                        {t('pending')}
                      </Badge>
                    )}
                    {task.status === 'error' && (
                      <Badge className="rounded-full bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-200">
                        {t('error')}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="pt-2">
            <Button
              onClick={executeRename}
              disabled={validTasks.length === 0 || conflicts.length > 0}
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-base font-semibold shadow-lg shadow-purple-600/30 transition hover:from-purple-700 hover:to-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="mr-3 h-5 w-5" />
              {t('executeRename')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const previewConflictsCount = previewResult?.conflicts.length ?? 0

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-r from-[#eef2ff] via-[#f8f5ff] to-[#e2f7ff] p-6 text-slate-900 shadow-2xl shadow-indigo-900/10 dark:border-white/15 dark:from-[#0f172a] dark:via-[#111a33] dark:to-[#0c1326] dark:text-white sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -left-16 top-0 h-48 w-48 rounded-full bg-blue-200/60 blur-3xl dark:bg-blue-500/30" />
          <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-emerald-200/50 blur-3xl dark:bg-emerald-500/25" />
        </div>
        <div className="relative space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 dark:border-white/20 dark:bg-white/10 dark:text-white/70">
                <Replace className="h-4 w-4" />
                {t('batchRename')}
              </span>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
                  {t('batchRename')}
                </h2>
                <p className="text-sm text-slate-600 dark:text-white/80">
                  {t('batchRenameDescription')}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleFileSelect}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-indigo-900/10 hover:-translate-y-0.5 hover:bg-white/90"
              >
                <FolderOpen className="h-4 w-4" />
                {t('selectFiles')}
              </Button>
              <Button
                onClick={generatePreview}
                disabled={selectedFiles.length === 0 || rules.length === 0 || isProcessing}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/80 bg-white/30 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm shadow-indigo-900/10 hover:-translate-y-0.5 hover:bg-white/40 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20 dark:bg-transparent dark:text-white"
              >
                <Eye className="h-4 w-4" />
                {t('generatePreview')}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm shadow-indigo-900/5 dark:border-white/15 dark:bg-white/5">
              <p className="text-3xl font-semibold text-slate-900 dark:text-white">{selectedFiles.length}</p>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/70">
                {t('selectedFiles')}
              </p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm shadow-indigo-900/5 dark:border-white/15 dark:bg-white/5">
              <p className="text-3xl font-semibold text-slate-900 dark:text-white">{rules.length}</p>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/70">
                {t('renameRules')}
              </p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm shadow-indigo-900/5 dark:border-white/15 dark:bg-white/5">
              <p className="text-3xl font-semibold text-slate-900 dark:text-white">{previewConflictsCount}</p>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/70">
                {t('renameConflicts')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-2xl shadow-indigo-900/10 backdrop-blur dark:border-white/15 dark:bg-slate-900/60">
            <CardHeader className="space-y-2">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-100/80 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-900/40 dark:text-blue-200">
                <FolderOpen className="h-4 w-4" />
                {t('selectFiles')}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t('selectedFiles')}
              </h3>
              <p className="text-sm text-slate-500 dark:text-white/70">
                {t('selectFilesAndStartProcess')}
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Button
                onClick={handleFileSelect}
                className="h-12 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-base font-medium text-white shadow-lg shadow-blue-600/30 hover:from-blue-700 hover:to-purple-700"
              >
                <FolderOpen className="mr-3 h-5 w-5" />
                {t('selectFiles')}
              </Button>

              {selectedFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-inner dark:border-white/15 dark:bg-white/5 dark:text-white">
                    <span>{t('selectedFiles')}</span>
                    <Badge className="rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100">
                      {selectedFiles.length}
                    </Badge>
                  </div>
                  <ScrollArea className="h-40 rounded-2xl border border-white/60 bg-white/70 dark:border-white/15 dark:bg-white/5">
                    <div className="space-y-2 p-4">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/90 px-3 py-2 text-sm text-slate-600 shadow-sm dark:border-white/15 dark:bg-white/5 dark:text-white/80"
                        >
                          <FileText className="h-4 w-4" />
                          <span className="truncate font-medium text-slate-900 dark:text-white">
                            {file.split('/').pop()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-2xl shadow-emerald-900/10 backdrop-blur dark:border-white/15 dark:bg-slate-900/60">
            <CardHeader className="space-y-2">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200">
                <Settings className="h-4 w-4" />
                {t('renameRules')}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t('renameRules')}
              </h3>
              <p className="text-sm text-slate-500 dark:text-white/70">
                {t('customizeFrequentToolsDescription')}
              </p>
            </CardHeader>
            <CardContent className="space-y-5 pt-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {[
                  { type: 'sequence', icon: <Hash className="h-4 w-4" /> },
                  { type: 'replace', icon: <Replace className="h-4 w-4" /> },
                  { type: 'prefix', icon: <Type className="h-4 w-4" /> },
                  { type: 'suffix', icon: <Type className="h-4 w-4" /> },
                  { type: 'regex', icon: <FileCode className="h-4 w-4" /> },
                  { type: 'timestamp', icon: <Calendar className="h-4 w-4" /> },
                  { type: 'extension', icon: <FileText className="h-4 w-4" /> }
                ].map((config) => (
                  <Button
                    key={config.type}
                    variant="outline"
                    className="h-12 rounded-2xl border-white/70 bg-white/80 text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-white"
                    onClick={() => addRule(config.type as RenameRule['type'])}
                  >
                    <span className="mr-2 h-5 w-5 text-emerald-500">{config.icon}</span>
                    <span className="font-medium">{t(`renameRule.${config.type}`)}</span>
                  </Button>
                ))}
              </div>

              <AnimatePresence>
                {rules.map((rule, index) => renderRuleEditor(rule, index))}
              </AnimatePresence>

              {rules.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200/70 bg-white/70 p-4 text-center text-sm text-slate-500 dark:border-white/15 dark:bg-white/5 dark:text-white/70">
                  {t('noRulesConfigured')}
                </div>
              )}

              {rules.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/70 bg-white/80 p-4 text-sm text-slate-600 shadow-inner dark:border-white/15 dark:bg-white/5 dark:text-white/70">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                      {t('ruleChains')}
                    </p>
                    <p className="text-2xl font-semibold text-slate-900 dark:text-white">{rules.length}</p>
                    <p className="text-xs text-slate-500 dark:text-white/60">{t('activeRules')}</p>
                  </div>
                  <div className="rounded-2xl border border-white/70 bg-white/80 p-4 text-sm text-slate-600 shadow-inner dark:border-white/15 dark:bg-white/5 dark:text-white/70">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-200">
                      {t('previewReady')}
                    </p>
                    <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                      {selectedFiles.length > 0 ? t('yes') : t('no')}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-white/60">
                      {selectedFiles.length > 0
                        ? t('readyForPreview')
                        : t('selectFilesToStartPreview')}
                    </p>
                  </div>
                </div>
              )}

              {selectedFiles.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {rules.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRules([])
                        setPreviewResult(null)
                      }}
                      className="h-12 rounded-2xl border-white/70 bg-white/70 text-sm font-semibold text-slate-700 shadow-sm hover:bg-white dark:border-white/15 dark:bg-transparent dark:text-white"
                    >
                      <Trash2 className="mr-2 h-5 w-5" />
                      {t('clearRules')}
                    </Button>
                  )}
                  <Button
                    onClick={generatePreview}
                    disabled={isProcessing}
                    className="h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 text-base font-semibold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-700 hover:to-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Eye className="mr-3 h-5 w-5" />
                    {t('generatePreview')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {renderPreviewResult()}

          {processedResults.length > 0 && (
            <Card className="overflow-hidden rounded-[32px] border border-white/80 bg-white/90 shadow-2xl shadow-emerald-900/10 backdrop-blur dark:border-white/15 dark:bg-slate-900/60">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-900 dark:text-white">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-green-100 via-white to-teal-50 text-green-600 dark:from-green-500/30 dark:via-white/5 dark:to-white/0 dark:text-emerald-200">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <span>{t('renameResults')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm shadow-emerald-100/40 dark:border-white/15 dark:bg-white/5">
                    <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-200">
                      {processedResults.filter((r) => r.status === 'success').length}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-emerald-800/70 dark:text-emerald-200">
                      {t('success')}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm shadow-red-100/40 dark:border-white/15 dark:bg-white/5">
                    <p className="text-2xl font-semibold text-red-600 dark:text-red-200">
                      {processedResults.filter((r) => r.status === 'error').length}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-red-800/70 dark:text-red-200">
                      {t('failed')}
                    </p>
                  </div>
                </div>
                <ScrollArea className="h-44 rounded-2xl border border-white/70 bg-white/70 dark:border-white/15 dark:bg-white/5">
                  <div className="space-y-3 p-4">
                    {processedResults.map((result, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm shadow-indigo-900/5 dark:border-white/10 dark:bg-white/5"
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-400 dark:text-white/60" />
                            <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                              {result.originalPath.split('/').pop()}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-white/50">→</span>
                            <span className="truncate text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                              {result.newName}
                            </span>
                          </div>
                          {result.error && (
                            <div className="rounded-xl bg-red-50/80 p-2 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-200">
                              {result.error}
                            </div>
                          )}
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          {result.status === 'success' ? (
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {isProcessing && (
            <Card className="overflow-hidden rounded-[32px] border border-white/80 bg-gradient-to-r from-blue-50 via-white to-purple-50 shadow-2xl shadow-blue-900/10 backdrop-blur dark:border-white/15 dark:bg-gradient-to-r dark:from-blue-900/20 dark:via-slate-900 dark:to-purple-900/10">
              <CardContent className="py-8">
                <div className="space-y-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-700 dark:text-white">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                    <span className="text-sm font-semibold">{t('processing')}</span>
                  </div>
                  <Progress value={0} className="mx-auto h-2 w-full max-w-sm" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
