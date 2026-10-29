/**
 * Author: Libra
 * Date: 2025-04-24 10:15:11
 * LastEditors: Libra
 * Description: 图片整理工具组件
 */
import { useState, useEffect, useMemo } from 'react'
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
import { toast } from '@renderer/components/ui/toast'
import { Progress } from '@renderer/components/ui/progress'
import {
  Check,
  FileSpreadsheet,
  Folder,
  Image as ImageIcon,
  Loader2,
  Play,
  Settings2
} from 'lucide-react'
import { ImageProcessLogger, ProcessLogMessage } from './ImageProcessLogger'
import { useTranslation } from 'react-i18next'
import type { NameRule } from '@shared/imageOrganizeRules'
import {
  getOptionalExcelColumnLabels,
  getRequiredExcelColumnLabels,
  nameRuleConfigs
} from '@shared/imageOrganizeRules'
import { DataRow, Panel, PanelBody, PanelHeader } from '@renderer/components/ui/panel'
import { StatusDot } from '@renderer/components/ui/states'

// 进度状态接口
interface ProgressStatus {
  status: string
  percentage: number
}

interface ImageOrganizeToolProps {
  onBack?: () => void
}

// 组件主体
const ImageOrganizeTool = ({ onBack }: ImageOrganizeToolProps): JSX.Element => {
  const { t } = useTranslation()
  // 导航由外层工作台承载，保留该属性以兼容现有调用方。
  void onBack

  // 状态定义
  const [rootDir, setRootDir] = useState<string>('')
  const [sourceDir, setSourceDir] = useState<string>('')
  const [excelPath, setExcelPath] = useState<string>('')
  const [nameRule, setNameRule] = useState<NameRule>('身份证号_姓名')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [progress, setProgress] = useState<ProgressStatus>({ status: '', percentage: 0 })
  const [logs, setLogs] = useState<ProcessLogMessage[]>([])
  const [currentStep, setCurrentStep] = useState<string>('')
  const [currentProgress, setCurrentProgress] = useState<number>(0)

  const processedFiles = useMemo(() => {
    for (let i = logs.length - 1; i >= 0; i--) {
      const message = logs[i]?.message
      if (message) {
        const match = message.match(/(?:处理|整理)(?:了)?\s*(\d+)\s*个?文件/)
        if (match?.[1]) {
          return Number(match[1])
        }
      }
    }
    return 0
  }, [logs])

  const progressPercent = Math.min(100, Math.max(0, Math.round(progress.percentage ?? 0)))
  const latestLogType = logs[logs.length - 1]?.type

  const statusVariant: 'idle' | 'running' | 'pending' | 'done' | 'error' = isProcessing
    ? 'running'
    : latestLogType === 'error'
      ? 'error'
      : progressPercent === 100 && logs.length > 0
        ? 'done'
        : progressPercent > 0
          ? 'pending'
          : 'idle'

  const statusConfigs = {
    idle: {
      label: t('imageOrganizeStatusIdle'),
      tone: 'neutral'
    },
    running: {
      label: t('imageOrganizeStatusRunning'),
      tone: 'active'
    },
    pending: {
      label: t('imageOrganizeStatusPending'),
      tone: 'active'
    },
    done: {
      label: t('imageOrganizeStatusFinished'),
      tone: 'success'
    },
    error: {
      label: t('imageOrganizeStatusError'),
      tone: 'error'
    }
  } as const

  const statusBadge = statusConfigs[statusVariant]
  const isActionDisabled = isProcessing || !rootDir || !sourceDir || !excelPath
  const requiredExcelColumns = useMemo(() => getRequiredExcelColumnLabels(nameRule), [nameRule])
  const optionalExcelColumns = useMemo(() => getOptionalExcelColumnLabels(nameRule), [nameRule])
  const excelRequirementDescription = t('imageOrganizeRuleRequirement', {
    required: requiredExcelColumns.join(', '),
    optional: optionalExcelColumns.join(', ')
  })
  const configuredSourceCount = [rootDir, sourceDir, excelPath].filter(Boolean).length

  // 根据状态信息获取当前步骤
  const getStepFromStatus = (status: string): string => {
    if (status.includes('平铺')) return '文件平铺'
    if (status.includes('分类')) return '文件分类'
    if (status.includes('重命名')) return '文件重命名'
    if (status.includes('压缩图片(')) return '图片压缩'
    if (status.includes('压缩图片')) return '图片压缩'
    if (status.includes('输出')) return '结果输出'
    if (status.includes('清理')) return '清理目录'
    if (status.includes('准备')) return '准备处理'
    return '处理中'
  }

  // 监听事件
  useEffect((): (() => void) => {
    // 进度更新处理
    const handleProgressUpdate = (_: unknown, data: ProgressStatus): void => {
      setProgress(data)
      setCurrentProgress(data.percentage)
      setCurrentStep(data.status)

      const timestamp = new Date().toISOString()
      const step = getStepFromStatus(data.status)

      // 检查最后一条日志是否是同类型的进度更新
      // 如果是，则更新最后一条日志而不是添加新日志
      setLogs((prevLogs) => {
        const lastLog = prevLogs[prevLogs.length - 1]

        // 如果没有日志或最后一条不是信息类型，或者是新的步骤，则添加新日志
        if (
          prevLogs.length === 0 ||
          lastLog.type !== 'info' ||
          (lastLog.step && lastLog.step !== step) ||
          // 每增加10%进度添加一条新日志，减少日志数量但仍保留关键节点
          Math.floor((lastLog.percentage ?? 0) / 10) !== Math.floor(data.percentage / 10)
        ) {
          const newLogMessage: ProcessLogMessage = {
            type: 'info',
            message: data.status,
            timestamp,
            percentage: data.percentage,
            step
          }
          return [...prevLogs, newLogMessage]
        } else {
          // 更新最后一条日志
          const updatedLogs = [...prevLogs]
          updatedLogs[updatedLogs.length - 1] = {
            ...lastLog,
            message: data.status,
            timestamp,
            percentage: data.percentage
          }
          return updatedLogs
        }
      })
    }

    // 处理完成
    const handleProcessComplete = (): void => {
      setIsProcessing(false)

      const timestamp = new Date().toISOString()
      const logMessage: ProcessLogMessage = {
        type: 'success',
        message: t('imageOrganizeSuccess'),
        timestamp,
        percentage: 100,
        step: '完成'
      }

      setLogs((prevLogs) => [...prevLogs, logMessage])
      setCurrentProgress(100)
      setCurrentStep('处理完成')

      toast.success({
        title: t('processingComplete'),
        description: t('imageOrganizeSuccess')
      })
    }

    // 处理错误
    const handleProcessError = (_: unknown, errorMessage: string): void => {
      setIsProcessing(false)

      const timestamp = new Date().toISOString()
      const logMessage: ProcessLogMessage = {
        type: 'error',
        message: errorMessage,
        timestamp,
        step: '错误'
      }

      setLogs((prevLogs) => [...prevLogs, logMessage])
      setCurrentStep('处理失败')

      toast.error({
        title: t('processingFailed'),
        description: errorMessage
      })
    }

    // 添加事件监听
    window.electron.ipcRenderer.on('image-organize:progress-update', handleProgressUpdate)
    window.electron.ipcRenderer.on('image-organize:process-complete', handleProcessComplete)
    window.electron.ipcRenderer.on('image-organize:process-error', handleProcessError)

    // 组件卸载时移除事件监听
    return (): void => {
      window.electron.ipcRenderer.removeAllListeners('image-organize:progress-update')
      window.electron.ipcRenderer.removeAllListeners('image-organize:process-complete')
      window.electron.ipcRenderer.removeAllListeners('image-organize:process-error')
    }
  }, [t])

  // 选择结果目录
  const handleSelectRootDir = async (): Promise<void> => {
    const selectedPath = await window.electron.ipcRenderer.invoke('image-organize:select-root-dir')
    if (selectedPath) {
      setRootDir(selectedPath)
    }
  }

  // 选择源目录
  const handleSelectSourceDir = async (): Promise<void> => {
    const selectedPath = await window.electron.ipcRenderer.invoke(
      'image-organize:select-source-dir'
    )
    if (selectedPath) {
      setSourceDir(selectedPath)
    }
  }

  // 选择Excel文件
  const handleSelectExcel = async (): Promise<void> => {
    const selectedPath = await window.electron.ipcRenderer.invoke(
      'image-organize:select-excel-file'
    )
    if (selectedPath) {
      setExcelPath(selectedPath)
    }
  }

  // 开始处理
  const handleStartProcess = async (): Promise<void> => {
    if (!rootDir) {
      toast.warning({ title: t('selectRootDir') })
      return
    }
    if (!sourceDir) {
      toast.warning({ title: t('selectSourceDir') })
      return
    }
    if (!excelPath) {
      toast.warning({ title: t('selectExcelFile') })
      return
    }

    setLogs([])
    setIsProcessing(true)

    const initialStatus = t('preparing')
    setProgress({ status: initialStatus, percentage: 0 })
    setCurrentStep(initialStatus)
    setCurrentProgress(0)

    const timestamp = new Date().toISOString()
    const initialLog: ProcessLogMessage = {
      type: 'info',
      message: initialStatus,
      timestamp,
      percentage: 0,
      step: '准备处理'
    }
    setLogs([initialLog])

    const result = await window.electron.ipcRenderer.invoke('image-organize:start-process', {
      rootDir,
      sourceDir,
      excelPath,
      nameRule
    })

    if (!result.success) {
      setIsProcessing(false)

      const errorTimestamp = new Date().toISOString()
      const errorLog: ProcessLogMessage = {
        type: 'error',
        message: result.message,
        timestamp: errorTimestamp,
        step: '错误'
      }
      setLogs((prevLogs) => [...prevLogs, errorLog])
      setCurrentStep('处理失败')

      toast.error({
        title: t('processingStartFailed'),
        description: result.message
      })
    }
  }

  const checklistMark = (configured: boolean, order: number): JSX.Element => (
    <span
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
        configured
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-muted text-muted-foreground'
      }`}
    >
      {configured ? (
        <Check className="h-3 w-3" />
      ) : (
        <span className="font-mono text-[9px]">{order}</span>
      )}
    </span>
  )

  return (
    <div className="space-y-4 text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ImageIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              {t('imageOrganize')}
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">{t('imageOrganizeDescription')}</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <StatusDot tone={statusBadge.tone} />
          <span>{statusBadge.label}</span>
        </div>
      </header>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(340px,0.85fr)_minmax(0,1.35fr)]">
        <Panel>
          <PanelHeader
            eyebrow="01"
            title={t('fileConfiguration')}
            description={t('imageOrganizeConfigDescription')}
            action={
              <span className="font-mono text-xs text-muted-foreground">
                {configuredSourceCount} / 3
              </span>
            }
          />
          <PanelBody className="p-0">
            <ol className="divide-y divide-border">
              <li className="space-y-3 p-4">
                <div className="flex items-start gap-2.5">
                  {checklistMark(Boolean(rootDir), 1)}
                  <Label
                    htmlFor="rootDir"
                    className="text-xs font-medium leading-5 text-foreground"
                  >
                    {t('rootDir')}
                  </Label>
                </div>
                <div className="flex gap-2 pl-[30px]">
                  <Input
                    id="rootDir"
                    value={rootDir}
                    onChange={(event) => setRootDir(event.target.value)}
                    placeholder={t('selectRootDir')}
                    readOnly
                    className="min-w-0 flex-1 bg-muted/30 font-mono text-[11px]"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectRootDir}
                    disabled={isProcessing}
                    className="h-10 shrink-0"
                  >
                    <Folder className="mr-2 h-3.5 w-3.5" />
                    {t('select')}
                  </Button>
                </div>
              </li>

              <li className="space-y-3 p-4">
                <div className="flex items-start gap-2.5">
                  {checklistMark(Boolean(sourceDir), 2)}
                  <Label
                    htmlFor="sourceDir"
                    className="text-xs font-medium leading-5 text-foreground"
                  >
                    {t('sourceDir')}
                  </Label>
                </div>
                <div className="flex gap-2 pl-[30px]">
                  <Input
                    id="sourceDir"
                    value={sourceDir}
                    onChange={(event) => setSourceDir(event.target.value)}
                    placeholder={t('selectSourceDir')}
                    readOnly
                    className="min-w-0 flex-1 bg-muted/30 font-mono text-[11px]"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectSourceDir}
                    disabled={isProcessing}
                    className="h-10 shrink-0"
                  >
                    <Folder className="mr-2 h-3.5 w-3.5" />
                    {t('select')}
                  </Button>
                </div>
              </li>

              <li className="space-y-3 p-4">
                <div className="flex items-start gap-2.5">
                  {checklistMark(Boolean(excelPath), 3)}
                  <Label
                    htmlFor="excelPath"
                    className="text-xs font-medium leading-5 text-foreground"
                  >
                    {t('excelFile')}
                  </Label>
                </div>
                <div className="flex gap-2 pl-[30px]">
                  <Input
                    id="excelPath"
                    value={excelPath}
                    onChange={(event) => setExcelPath(event.target.value)}
                    placeholder={t('selectExcelFile')}
                    readOnly
                    className="min-w-0 flex-1 bg-muted/30 font-mono text-[11px]"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectExcel}
                    disabled={isProcessing}
                    className="h-10 shrink-0"
                  >
                    <FileSpreadsheet className="mr-2 h-3.5 w-3.5" />
                    {t('select')}
                  </Button>
                </div>
              </li>

              <li className="space-y-3 p-4">
                <div className="flex items-start gap-2.5">
                  {checklistMark(true, 4)}
                  <Label
                    htmlFor="nameRule"
                    className="text-xs font-medium leading-5 text-foreground"
                  >
                    {t('nameRule')}
                  </Label>
                </div>
                <div className="pl-[30px]">
                  <Select
                    value={nameRule}
                    onValueChange={(value: string) => setNameRule(value as NameRule)}
                    disabled={isProcessing}
                  >
                    <SelectTrigger id="nameRule" aria-label={t('selectNameRule')}>
                      <SelectValue placeholder={t('selectNameRule')} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(nameRuleConfigs).map(([value, config]) => (
                        <SelectItem key={value} value={value}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </li>
            </ol>

            <div className="border-t border-border bg-muted/20 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
              {excelRequirementDescription}
            </div>

            <div className="space-y-3 p-4">
              <p className="text-xs text-muted-foreground">{t('imageOrganizeActionHint')}</p>
              <Button className="w-full" disabled={isActionDisabled} onClick={handleStartProcess}>
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {isProcessing ? t('processing') : t('startProcess')}
              </Button>
            </div>
          </PanelBody>
        </Panel>

        <div className="min-w-0 space-y-4">
          <Panel>
            <PanelHeader
              eyebrow="02"
              title={t('imageOrganizeStatusTitle')}
              description={t('imageOrganizeStatusDescription')}
              action={
                <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <StatusDot tone={statusBadge.tone} />
                  {statusBadge.label}
                </span>
              }
            />
            <PanelBody className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground">
                    {t('imageOrganizeCurrentStep')}
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-foreground">
                    {currentStep || t('imageOrganizeStatusIdle')}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] text-muted-foreground">{t('processingProgress')}</p>
                  <p className="mt-0.5 font-mono text-2xl font-semibold tracking-tight text-primary">
                    {progressPercent}%
                  </p>
                </div>
              </div>
              <Progress value={progressPercent} className="h-1.5 bg-muted [&>div]:bg-primary" />
              <dl className="border-t border-border pt-1">
                <DataRow label={t('imageOrganizeFilesProcessed')} value={processedFiles} />
              </dl>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              eyebrow={
                <span className="inline-flex items-center gap-1.5">
                  <Settings2 className="h-3 w-3" />
                  03
                </span>
              }
              title={t('processingLogs')}
              description={t('imageOrganizeLogsDescription')}
              action={
                <span className="font-mono text-xs text-muted-foreground">{logs.length}</span>
              }
            />
            <PanelBody className="p-4">
              <ImageProcessLogger
                isProcessing={isProcessing}
                logs={logs}
                currentProgress={currentProgress}
                currentStep={currentStep}
              />
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  )
}

export default ImageOrganizeTool
