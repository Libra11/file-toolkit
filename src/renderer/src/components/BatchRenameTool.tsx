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
  Plus,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
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
        filters: [
          { name: 'All Files', extensions: ['*'] }
        ]
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
  const addRule = useCallback((type: RenameRule['type']) => {
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
  }, [rules])

  // 移除规则
  const removeRule = useCallback((index: number) => {
    const newRules = rules.filter((_, i) => i !== index)
    setRules(newRules)
    setPreviewResult(null)
  }, [rules])

  // 更新规则
  const updateRule = useCallback((index: number, updates: Partial<RenameRule>) => {
    const newRules = [...rules]
    newRules[index] = { ...newRules[index], ...updates }
    setRules(newRules)
    setPreviewResult(null)
  }, [rules])

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
      const successfulTasks = results.filter(task => task.status === 'success')
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
  const renderRuleEditor = (rule: RenameRule, index: number) => {
    const updateRuleValue = (value: string) => {
      updateRule(index, { value })
    }

    const updateRuleOptions = (options: Partial<RenameRule['options']>) => {
      updateRule(index, { options: { ...rule.options, ...options } })
    }

    const getRuleIcon = (type: RenameRule['type']) => {
      switch (type) {
        case 'sequence': return <Hash className="h-4 w-4" />
        case 'replace': return <Replace className="h-4 w-4" />
        case 'prefix': return <Type className="h-4 w-4" />
        case 'suffix': return <Type className="h-4 w-4" />
        case 'regex': return <FileCode className="h-4 w-4" />
        case 'timestamp': return <Calendar className="h-4 w-4" />
        case 'extension': return <FileText className="h-4 w-4" />
      }
    }

    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-4 border rounded-lg space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getRuleIcon(rule.type)}
            <span className="font-medium">{t(`renameRule.${rule.type}`)}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeRule(index)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {rule.type === 'sequence' && (
            <>
              <div className="grid grid-cols-2 gap-2">
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
                    onChange={(e) => updateRuleOptions({ startNumber: parseInt(e.target.value) || 1 })}
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
                  {rule.type === 'replace' ? t('renameRule.searchText') : t('renameRule.regexPattern')}
                </Label>
                <Input
                  id={`rule-${index}-search`}
                  value={rule.value}
                  onChange={(e) => updateRuleValue(e.target.value)}
                  placeholder={rule.type === 'replace' ? t('renameRule.searchPlaceholder') : t('renameRule.regexPlaceholder')}
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
                placeholder={rule.type === 'prefix' ? t('renameRule.prefixPlaceholder') : t('renameRule.suffixPlaceholder')}
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
  const renderPreviewResult = () => {
    if (!previewResult) return null

    const { tasks, conflicts } = previewResult
    const validTasks = tasks.filter(task => task.status !== 'error')
    const errorTasks = tasks.filter(task => task.status === 'error')

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>{t('renamePreview')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {conflicts.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800 dark:text-yellow-200">
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

          <div className="space-y-2 mb-4">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{t('validFiles')}: {validTasks.length}</span>
              </div>
              <div className="flex items-center space-x-1">
                <XCircle className="h-4 w-4 text-red-500" />
                <span>{t('errorFiles')}: {errorTasks.length}</span>
              </div>
              <div className="flex items-center space-x-1">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span>{t('conflicts')}: {conflicts.length}</span>
              </div>
            </div>
          </div>

          <ScrollArea className="h-64">
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {task.originalPath.split('/').pop()}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      → {task.newName}
                    </div>
                    {task.error && (
                      <div className="text-xs text-red-500 mt-1">
                        {task.error}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {task.status === 'pending' && (
                      <Badge variant="secondary">
                        {t('pending')}
                      </Badge>
                    )}
                    {task.status === 'error' && (
                      <Badge variant="destructive">
                        {t('error')}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="mt-4 flex space-x-2">
            <Button
              onClick={executeRename}
              disabled={validTasks.length === 0 || conflicts.length > 0}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              {t('executeRename')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 文件选择 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FolderOpen className="h-5 w-5" />
            <span>{t('selectFiles')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={handleFileSelect} className="w-full">
              <FolderOpen className="h-4 w-4 mr-2" />
              {t('selectFiles')}
            </Button>
            
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">
                  {t('selectedFiles')}: {selectedFiles.length}
                </div>
                <ScrollArea className="h-32">
                  <div className="space-y-1">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {file}
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>{t('renameRules')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 添加规则按钮 */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addRule('sequence')}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('renameRule.sequence')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addRule('replace')}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('renameRule.replace')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addRule('prefix')}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('renameRule.prefix')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addRule('suffix')}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('renameRule.suffix')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addRule('regex')}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('renameRule.regex')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addRule('timestamp')}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('renameRule.timestamp')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addRule('extension')}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('renameRule.extension')}
              </Button>
            </div>

            {/* 规则列表 */}
            <AnimatePresence>
              {rules.map((rule, index) => renderRuleEditor(rule, index))}
            </AnimatePresence>

            {rules.length > 0 && (
              <>
                <Separator />
                <Button
                  onClick={generatePreview}
                  disabled={selectedFiles.length === 0 || isProcessing}
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>{t('renameResults')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{t('success')}: {processedResults.filter(r => r.status === 'success').length}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>{t('failed')}: {processedResults.filter(r => r.status === 'error').length}</span>
                </div>
              </div>
              <ScrollArea className="h-32">
                <div className="space-y-1">
                  {processedResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">
                          {result.originalPath.split('/').pop()} → {result.newName}
                        </div>
                        {result.error && (
                          <div className="text-xs text-red-500 mt-1">
                            {result.error}
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        {result.status === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
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
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {t('processing')}
              </div>
              <Progress className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}