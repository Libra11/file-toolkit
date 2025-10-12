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
        className="p-4 border border-border/50 rounded-xl space-y-3 bg-card/50 backdrop-blur-sm hover:border-border/80 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10">{getRuleIcon(rule.type)}</div>
            <div>
              <span className="font-semibold text-foreground">{t(`renameRule.${rule.type}`)}</span>
              <div className="text-xs text-muted-foreground capitalize">
                {t(`renameRule.${rule.type}Description`)}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeRule(index)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg h-8 w-8"
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
      <Card className="shadow-lg border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20">
              <Eye className="h-6 w-6 text-orange-600" />
            </div>
            <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent font-bold">
              {t('renamePreview')}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {conflicts.length > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800/50">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-1 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                  <AlertCircle className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />
                </div>
                <span className="font-semibold text-yellow-900 dark:text-yellow-100">
                  {t('renameConflicts')}
                </span>
              </div>
              <div className="space-y-1">
                {conflicts.map((conflict, index) => (
                  <div key={index} className="text-sm text-yellow-700 dark:text-yellow-300">
                    {conflict}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center space-x-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-semibold text-green-900 dark:text-green-100">
                  {validTasks.length}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">{t('validFiles')}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <div className="font-semibold text-red-900 dark:text-red-100">
                  {errorTasks.length}
                </div>
                <div className="text-sm text-red-700 dark:text-red-300">{t('errorFiles')}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="font-semibold text-yellow-900 dark:text-yellow-100">
                  {conflicts.length}
                </div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300">{t('conflicts')}</div>
              </div>
            </div>
          </div>

          <ScrollArea className="h-80 rounded-xl border border-border/50 bg-muted/20">
            <div className="space-y-2 p-4">
              {tasks.map((task, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-card/50 hover:bg-card/80 transition-colors"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="text-sm font-semibold text-foreground truncate">
                        {task.originalPath.split('/').pop()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>→</span>
                      <span className="font-medium text-primary truncate">{task.newName}</span>
                    </div>
                    {task.error && (
                      <div className="text-xs text-destructive bg-destructive/10 p-2 rounded-md mt-2">
                        {task.error}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    {task.status === 'pending' && (
                      <Badge variant="secondary" className="bg-secondary/50">
                        {t('pending')}
                      </Badge>
                    )}
                    {task.status === 'error' && (
                      <Badge variant="destructive" className="bg-destructive/10 text-destructive">
                        {t('error')}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="mt-6">
            <Button
              onClick={executeRename}
              disabled={validTasks.length === 0 || conflicts.length > 0}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-5 w-5 mr-3" />
              {t('executeRename')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      {/* 文件选择 */}
      <Card className="shadow-lg border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20">
              <FolderOpen className="h-6 w-6 text-blue-600" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
              {t('selectFiles')}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              onClick={handleFileSelect}
              className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
            >
              <FolderOpen className="h-5 w-5 mr-3" />
              {t('selectFiles')}
            </Button>

            {selectedFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-semibold text-foreground">
                    {t('selectedFiles')}
                  </span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold">
                    {selectedFiles.length}
                  </Badge>
                </div>
                <ScrollArea className="h-36 rounded-lg border border-border/50 bg-muted/20">
                  <div className="space-y-1 p-3">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 text-sm p-2 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-foreground truncate font-medium">
                          {file.split('/').pop()}
                        </span>
                        <span className="text-muted-foreground text-xs truncate">
                          {file.replace(/\/[^/]+$/, '')}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 规则配置 */}
      <Card className="shadow-lg border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="p-2 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20">
              <Settings className="h-6 w-6 text-green-600" />
            </div>
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold">
              {t('renameRules')}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 添加规则按钮 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="h-12 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 group"
                onClick={() => addRule('sequence')}
              >
                <Hash className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                <span className="font-medium">{t('renameRule.sequence')}</span>
              </Button>
              <Button
                variant="outline"
                className="h-12 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 group"
                onClick={() => addRule('replace')}
              >
                <Replace className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                <span className="font-medium">{t('renameRule.replace')}</span>
              </Button>
              <Button
                variant="outline"
                className="h-12 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 group"
                onClick={() => addRule('prefix')}
              >
                <Type className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                <span className="font-medium">{t('renameRule.prefix')}</span>
              </Button>
              <Button
                variant="outline"
                className="h-12 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 group"
                onClick={() => addRule('suffix')}
              >
                <Type className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                <span className="font-medium">{t('renameRule.suffix')}</span>
              </Button>
              <Button
                variant="outline"
                className="h-12 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 group"
                onClick={() => addRule('regex')}
              >
                <FileCode className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                <span className="font-medium">{t('renameRule.regex')}</span>
              </Button>
              <Button
                variant="outline"
                className="h-12 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 group"
                onClick={() => addRule('timestamp')}
              >
                <Calendar className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                <span className="font-medium">{t('renameRule.timestamp')}</span>
              </Button>
              <Button
                variant="outline"
                className="h-12 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 group"
                onClick={() => addRule('extension')}
              >
                <FileText className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                <span className="font-medium">{t('renameRule.extension')}</span>
              </Button>
            </div>

            {/* 规则列表 */}
            <AnimatePresence>
              {rules.map((rule, index) => renderRuleEditor(rule, index))}
            </AnimatePresence>

            {rules.length > 0 && (
              <>
                <Separator className="my-6" />
                <Button
                  onClick={generatePreview}
                  disabled={selectedFiles.length === 0 || isProcessing}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg"
                >
                  <Eye className="h-5 w-5 mr-3" />
                  {t('generatePreview')}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 预览结果 */}
      {renderPreviewResult()}

      {/* 处理结果 */}
      {processedResults.length > 0 && (
        <Card className="shadow-lg border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3 text-xl">
              <div className="p-2 rounded-xl bg-gradient-to-r from-green-500/20 to-teal-500/20">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent font-bold">
                {t('renameResults')}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-semibold text-green-900 dark:text-green-100">
                      {processedResults.filter((r) => r.status === 'success').length}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">{t('success')}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="font-semibold text-red-900 dark:text-red-100">
                      {processedResults.filter((r) => r.status === 'error').length}
                    </div>
                    <div className="text-sm text-red-700 dark:text-red-300">{t('failed')}</div>
                  </div>
                </div>
              </div>
              <ScrollArea className="h-40 rounded-xl border border-border/50 bg-muted/20">
                <div className="space-y-2 p-4">
                  {processedResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-border/50 rounded-xl bg-card/50 hover:bg-card/80 transition-colors"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium text-foreground truncate">
                            {result.originalPath.split('/').pop()}
                          </span>
                          <span className="text-xs text-muted-foreground">→</span>
                          <span className="text-sm font-medium text-primary truncate">
                            {result.newName}
                          </span>
                        </div>
                        {result.error && (
                          <div className="text-xs text-destructive bg-destructive/10 p-2 rounded-md">
                            {result.error}
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <div className="p-1 rounded-full">
                          {result.status === 'success' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 进度显示 */}
      {isProcessing && (
        <Card className="shadow-lg border-border/50 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                <div className="text-base font-medium text-foreground">{t('processing')}</div>
              </div>
              <Progress value={0} className="w-full h-2" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
