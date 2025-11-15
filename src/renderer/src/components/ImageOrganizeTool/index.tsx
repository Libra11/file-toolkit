/**
 * Author: Libra
 * Date: 2025-04-24 10:15:11
 * LastEditors: Libra
 * Description:
 */
/*
 * @Author: Libra
 * @Date: 2024-11-10 15:30:00
 * @LastEditors: Libra
 * @Description: 图片整理工具组件
 */
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
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
  Folder,
  FileSpreadsheet,
  Settings,
  ArrowRight,
  Loader2,
  Sparkles,
  Workflow,
  LayoutList,
  BadgeCheck,
  RefreshCcw,
  PlayCircle,
  Gauge,
  Image as ImageIcon
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ImageProcessLogger, ProcessLogMessage } from './ImageProcessLogger'
import { useTranslation } from 'react-i18next'

// 命名规则类型
type NameRule = '身份证号_姓名' | '姓名_身份证号'

// 进度状态接口
interface ProgressStatus {
  status: string
  percentage: number
}

// 渐入动画配置
const fadeInAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
}

interface PipelineStep {
  key: string
  icon: LucideIcon
  titleKey: string
  descriptionKey: string
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    key: 'flatten',
    icon: LayoutList,
    titleKey: 'imageOrganizeStepFlatten',
    descriptionKey: 'imageOrganizeStepFlattenDesc'
  },
  {
    key: 'match',
    icon: FileSpreadsheet,
    titleKey: 'imageOrganizeStepMatch',
    descriptionKey: 'imageOrganizeStepMatchDesc'
  },
  {
    key: 'rename',
    icon: BadgeCheck,
    titleKey: 'imageOrganizeStepRename',
    descriptionKey: 'imageOrganizeStepRenameDesc'
  },
  {
    key: 'compress',
    icon: ImageIcon,
    titleKey: 'imageOrganizeStepCompress',
    descriptionKey: 'imageOrganizeStepCompressDesc'
  },
  {
    key: 'cleanup',
    icon: RefreshCcw,
    titleKey: 'imageOrganizeStepCleanup',
    descriptionKey: 'imageOrganizeStepCleanupDesc'
  }
]

// 组件主体
const ImageOrganizeTool = (): JSX.Element => {
  const { t } = useTranslation()

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
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)

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
      className:
        'bg-slate-100/80 text-slate-600 dark:bg-slate-800/60 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700/60'
    },
    running: {
      label: t('imageOrganizeStatusRunning'),
      className:
        'bg-cyan-100/80 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200 border border-cyan-200/80 dark:border-cyan-800/50'
    },
    pending: {
      label: t('imageOrganizeStatusPending'),
      className:
        'bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/40'
    },
    done: {
      label: t('imageOrganizeStatusFinished'),
      className:
        'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-800/40'
    },
    error: {
      label: t('imageOrganizeStatusError'),
      className:
        'bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-200 border border-red-200/80 dark:border-red-800/40'
    }
  } as const

  const statusBadge = statusConfigs[statusVariant]
  const isActionDisabled = isProcessing || !rootDir || !sourceDir || !excelPath

  // 根据状态信息获取当前步骤
  const getStepFromStatus = (status: string): string => {
    if (status.includes('平铺')) return '文件平铺'
    if (status.includes('分类')) return '文件分类'
    if (status.includes('重命名')) return '文件重命名'
    if (status.includes('压缩图片(')) return '图片压缩'
    if (status.includes('压缩图片')) return '图片压缩'
    if (status.includes('Excel')) return 'Excel分类'
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
          Math.floor(lastLog.percentage / 10) !== Math.floor(data.percentage / 10)
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
        message: '图片整理处理已成功完成！',
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

  // 获取选择按钮样式
  const getSelectButtonStyles = (type: string): string => {
    const isHovered = hoveredButton === type
    return `w-full sm:w-auto h-11 px-4 gap-2 rounded-xl border border-cyan-100/80 bg-white/80 text-sm font-medium text-cyan-700 transition-all duration-300 dark:border-cyan-500/40 dark:bg-slate-900/60 dark:text-cyan-200 ${
      isHovered ? 'shadow-lg scale-[1.02] bg-cyan-50/80 dark:bg-cyan-900/30' : 'shadow-sm'
    }`
  }

  return (
    <motion.div
      className="pb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-6 shadow-2xl shadow-cyan-900/10 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/60 md:p-8">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-cyan-100/60 via-white to-transparent dark:from-cyan-900/30 dark:via-slate-900" />
        <div className="space-y-8">
          <div className="flex flex-col gap-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-cyan-100/70 px-3 py-1 text-sm font-medium text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200">
              <Sparkles className="h-4 w-4" />
              {t('imageOrganize')}
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
                {t('imageOrganizeHeroTitle')}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {t('imageOrganizeDescription')}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <motion.div {...fadeInAnimation}>
              <div className="h-full rounded-2xl border border-cyan-100/80 bg-white/90 p-5 shadow-lg shadow-cyan-900/10 dark:border-cyan-500/30 dark:bg-slate-950/50">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-600 dark:from-cyan-500/10 dark:to-blue-500/10 dark:text-cyan-200">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-slate-900 dark:text-white">
                      {t('imageOrganizeTipTitle')}
                    </p>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {t('imageOrganizeTipDescription')}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1 text-xs">
                      <span className="rounded-full bg-cyan-50 px-3 py-1 font-medium text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-200">
                        {t('excelFile')}
                      </span>
                      <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-200">
                        {t('nameRule')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div {...fadeInAnimation} transition={{ duration: 0.3, delay: 0.05 }}>
              <div className="h-full rounded-2xl border border-cyan-100/80 bg-white/90 p-5 shadow-lg shadow-cyan-900/10 dark:border-cyan-500/30 dark:bg-slate-950/50">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-600 dark:from-blue-500/10 dark:to-cyan-500/10 dark:text-blue-200">
                      <Workflow className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-slate-900 dark:text-white">
                        {t('imageOrganizeStepsTitle')}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {t('imageOrganizeStepsDescription')}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {PIPELINE_STEPS.map((step) => {
                      const Icon = step.icon
                      return (
                        <div
                          key={step.key}
                          className="flex items-start gap-2 rounded-xl border border-slate-100/70 bg-white/90 p-3 text-sm shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-200">
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                              {t(step.titleKey)}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {t(step.descriptionKey)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)]">
            <motion.div {...fadeInAnimation} transition={{ duration: 0.3, delay: 0.1 }}>
              <Card className="border border-cyan-100/80 bg-white/95 shadow-xl shadow-cyan-900/10 dark:border-cyan-500/30 dark:bg-slate-950/60">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                        <Settings className="h-5 w-5 text-cyan-500" />
                        {t('fileConfiguration')}
                      </CardTitle>
                      <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                        {t('imageOrganizeConfigDescription')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-2">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="rootDir"
                        className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        <Folder className="h-4 w-4 text-cyan-500" />
                        {t('rootDir')}
                      </Label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          id="rootDir"
                          value={rootDir}
                          onChange={(e) => setRootDir(e.target.value)}
                          placeholder={t('selectRootDir')}
                          readOnly
                          className="h-11 flex-1 rounded-xl border border-slate-200/70 bg-white/80 text-sm shadow-sm focus-visible:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900/60"
                        />
                        <motion.div
                          className="sm:w-auto"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            variant="outline"
                            onClick={handleSelectRootDir}
                            disabled={isProcessing}
                            className={getSelectButtonStyles('root')}
                            onMouseEnter={() => setHoveredButton('root')}
                            onMouseLeave={() => setHoveredButton(null)}
                          >
                            <Folder size={18} />
                            {t('select')}
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="sourceDir"
                        className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        <Folder className="h-4 w-4 text-cyan-500" />
                        {t('sourceDir')}
                      </Label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          id="sourceDir"
                          value={sourceDir}
                          onChange={(e) => setSourceDir(e.target.value)}
                          placeholder={t('selectSourceDir')}
                          readOnly
                          className="h-11 flex-1 rounded-xl border border-slate-200/70 bg-white/80 text-sm shadow-sm focus-visible:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900/60"
                        />
                        <motion.div
                          className="sm:w-auto"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            variant="outline"
                            onClick={handleSelectSourceDir}
                            disabled={isProcessing}
                            className={getSelectButtonStyles('source')}
                            onMouseEnter={() => setHoveredButton('source')}
                            onMouseLeave={() => setHoveredButton(null)}
                          >
                            <Folder size={18} />
                            {t('select')}
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="excelPath"
                        className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-cyan-500" />
                        {t('excelFile')}
                      </Label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          id="excelPath"
                          value={excelPath}
                          onChange={(e) => setExcelPath(e.target.value)}
                          placeholder={t('selectExcelFile')}
                          readOnly
                          className="h-11 flex-1 rounded-xl border border-slate-200/70 bg-white/80 text-sm shadow-sm focus-visible:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900/60"
                        />
                        <motion.div
                          className="sm:w-auto"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            variant="outline"
                            onClick={handleSelectExcel}
                            disabled={isProcessing}
                            className={getSelectButtonStyles('excel')}
                            onMouseEnter={() => setHoveredButton('excel')}
                            onMouseLeave={() => setHoveredButton(null)}
                          >
                            <FileSpreadsheet size={18} />
                            {t('select')}
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="nameRule"
                        className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        <Settings className="h-4 w-4 text-cyan-500" />
                        {t('nameRule')}
                      </Label>
                      <Select
                        value={nameRule}
                        onValueChange={(value: string) => setNameRule(value as NameRule)}
                        disabled={isProcessing}
                      >
                        <SelectTrigger className="h-11 w-full rounded-xl border border-slate-200/70 bg-white/80 text-sm shadow-sm focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900/60">
                          <SelectValue placeholder={t('selectNameRule')} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border border-slate-200/60 bg-white/95 shadow-xl dark:border-slate-700 dark:bg-slate-900/95">
                          <SelectItem value="身份证号_姓名">{t('idCardName')}</SelectItem>
                          <SelectItem value="姓名_身份证号">{t('nameIdCard')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-cyan-100/80 bg-gradient-to-br from-cyan-50/80 via-white to-blue-50/80 p-4 shadow-inner dark:border-cyan-500/40 dark:from-cyan-950/60 dark:via-slate-950/50 dark:to-blue-950/40">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {t('imageOrganizeStatusTitle')}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t('imageOrganizeStatusDescription')}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusBadge.className}`}
                      >
                        <Gauge className="h-3.5 w-3.5" />
                        {statusBadge.label}
                      </span>
                    </div>
                    <div className="grid gap-4 pt-4 text-sm sm:grid-cols-3">
                      <div className="rounded-xl border border-white/70 bg-white/80 p-3 text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {t('imageOrganizeCurrentStep')}
                        </p>
                        <p className="mt-1 text-base font-semibold text-slate-800 dark:text-white">
                          {currentStep || t('imageOrganizeStatusIdle')}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/70 bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-white/5">
                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {t('processingProgress')}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <Progress
                            value={progressPercent}
                            className="h-2 flex-1 overflow-hidden rounded-full bg-white/60 dark:bg-white/10"
                          />
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {progressPercent}%
                          </span>
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/70 bg-white/80 p-3 text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {t('imageOrganizeFilesProcessed')}
                        </p>
                        <p className="mt-1 text-base font-semibold text-slate-800 dark:text-white">
                          {processedFiles}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {t('imageOrganizeActionHint')}
                      </p>
                      <motion.div
                        className="w-full sm:w-auto"
                        whileHover={!isActionDisabled ? { scale: 1.01 } : undefined}
                        whileTap={!isActionDisabled ? { scale: 0.97 } : undefined}
                      >
                        <Button
                          className={`h-12 w-full rounded-2xl text-base font-semibold shadow-lg transition-all ${
                            isActionDisabled
                              ? 'cursor-not-allowed bg-slate-200/70 text-slate-500 dark:bg-slate-800/40 dark:text-slate-500'
                              : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white shadow-cyan-500/30 hover:shadow-cyan-500/40'
                          }`}
                          disabled={isActionDisabled}
                          onClick={handleStartProcess}
                        >
                          {isProcessing ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 className="h-5 w-5 animate-spin" />
                              {t('processing')}
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              <PlayCircle className="h-5 w-5" />
                              {t('startProcess')}
                            </span>
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div {...fadeInAnimation} transition={{ duration: 0.3, delay: 0.2 }}>
              <Card className="border border-cyan-100/80 bg-white/95 shadow-xl shadow-cyan-900/10 dark:border-cyan-500/30 dark:bg-slate-950/60">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/15 to-blue-500/15 text-cyan-600 dark:from-cyan-500/10 dark:to-blue-500/10 dark:text-cyan-200">
                      <Gauge className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                        {t('processingLogs')}
                      </CardTitle>
                      <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                        {t('imageOrganizeLogsDescription')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <AnimatePresence mode="wait">
                    {isProcessing || progress.percentage > 0 ? (
                      <motion.div
                        key="logger"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4 }}
                        className="rounded-2xl border border-cyan-50 bg-white/80 p-4 dark:border-cyan-900/30 dark:bg-slate-900/60"
                      >
                        <ImageProcessLogger
                          isProcessing={isProcessing}
                          logs={logs}
                          currentProgress={currentProgress}
                          currentStep={currentStep}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty-state"
                        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/70 p-8 text-muted-foreground dark:border-slate-800 dark:bg-slate-900/40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <motion.div
                          className="text-center space-y-4"
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <motion.div
                            className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-cyan-200/70 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-500 shadow-inner dark:border-cyan-800/40"
                            animate={{
                              boxShadow: [
                                '0 0 0 0 rgba(6, 182, 212, 0.15)',
                                '0 0 0 18px rgba(6, 182, 212, 0)'
                              ]
                            }}
                            transition={{
                              duration: 2.5,
                              repeat: Infinity
                            }}
                          >
                            <Folder size={40} />
                          </motion.div>
                          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">
                            {t('readyToStart')}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {t('selectFilesAndStartProcess')}
                          </p>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ImageOrganizeTool
