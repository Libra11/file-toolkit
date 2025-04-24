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
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Label } from '@renderer/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { toast } from '@renderer/components/ui/toast'
import { Folder, FileSpreadsheet, Settings, ArrowRight } from 'lucide-react'
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
    // 验证输入
    if (!rootDir) {
      toast.warning({
        title: t('selectRootDir')
      })
      return
    }
    if (!sourceDir) {
      toast.warning({
        title: t('selectSourceDir')
      })
      return
    }
    if (!excelPath) {
      toast.warning({
        title: t('selectExcelFile')
      })
      return
    }

    // 清空之前的日志
    setLogs([])
    setIsProcessing(true)

    const initialStatus = t('preparing')
    setProgress({ status: initialStatus, percentage: 0 })
    setCurrentStep(initialStatus)
    setCurrentProgress(0)

    // 添加初始日志
    const timestamp = new Date().toISOString()
    const initialLog: ProcessLogMessage = {
      type: 'info',
      message: initialStatus,
      timestamp,
      percentage: 0,
      step: '准备处理'
    }
    setLogs([initialLog])

    // 调用主进程处理
    const result = await window.electron.ipcRenderer.invoke('image-organize:start-process', {
      rootDir,
      sourceDir,
      excelPath,
      nameRule
    })

    if (!result.success) {
      setIsProcessing(false)

      // 添加错误日志
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
    return `gap-2 border-cyan-200 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 dark:border-cyan-800/30 dark:hover:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 transition-all duration-300 ${
      isHovered ? 'shadow-md scale-105' : 'shadow-sm'
    }`
  }

  return (
    <div className="py-6 space-y-6">
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div {...fadeInAnimation} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card className="border-cyan-100 dark:border-cyan-800/30 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/10 dark:to-blue-900/10 rounded-t-lg border-b border-cyan-100 dark:border-cyan-800/30">
              <CardTitle className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400">
                <Settings className="h-5 w-5" />
                {t('fileConfiguration')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <AnimatePresence>
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Label
                    htmlFor="rootDir"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                  >
                    <Folder className="h-3.5 w-3.5 text-cyan-500" />
                    {t('rootDir')}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="rootDir"
                      value={rootDir}
                      onChange={(e) => setRootDir(e.target.value)}
                      placeholder={t('selectRootDir')}
                      readOnly
                      className="flex-1 bg-slate-50 dark:bg-slate-800/50 focus-visible:ring-cyan-500 border-cyan-100 dark:border-cyan-800/30"
                    />
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
                </motion.div>

                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <Label
                    htmlFor="sourceDir"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                  >
                    <Folder className="h-3.5 w-3.5 text-cyan-500" />
                    {t('sourceDir')}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="sourceDir"
                      value={sourceDir}
                      onChange={(e) => setSourceDir(e.target.value)}
                      placeholder={t('selectSourceDir')}
                      readOnly
                      className="flex-1 bg-slate-50 dark:bg-slate-800/50 focus-visible:ring-cyan-500 border-cyan-100 dark:border-cyan-800/30"
                    />
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
                </motion.div>

                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <Label
                    htmlFor="excelPath"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-cyan-500" />
                    {t('excelFile')}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="excelPath"
                      value={excelPath}
                      onChange={(e) => setExcelPath(e.target.value)}
                      placeholder={t('selectExcelFile')}
                      readOnly
                      className="flex-1 bg-slate-50 dark:bg-slate-800/50 focus-visible:ring-cyan-500 border-cyan-100 dark:border-cyan-800/30"
                    />
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
                </motion.div>

                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <Label
                    htmlFor="nameRule"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                  >
                    <Settings className="h-3.5 w-3.5 text-cyan-500" />
                    {t('nameRule')}
                  </Label>
                  <Select
                    value={nameRule}
                    onValueChange={(value: string) => setNameRule(value as NameRule)}
                    disabled={isProcessing}
                  >
                    <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-800/50 border-cyan-100 dark:border-cyan-800/30 focus:ring-cyan-500 shadow-sm">
                      <SelectValue placeholder={t('selectNameRule')} />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-slate-800/95 border-cyan-100 dark:border-cyan-800/30">
                      <SelectItem value="身份证号_姓名">{t('idCardName')}</SelectItem>
                      <SelectItem value="姓名_身份证号">{t('nameIdCard')}</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>

                <motion.div
                  className="pt-3"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                  whileHover={
                    !isProcessing && rootDir && sourceDir && excelPath ? { scale: 1.02 } : {}
                  }
                  whileTap={
                    !isProcessing && rootDir && sourceDir && excelPath ? { scale: 0.98 } : {}
                  }
                >
                  <Button
                    className={`w-full mt-2 ${
                      isProcessing || !rootDir || !sourceDir || !excelPath
                        ? 'bg-slate-200 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-md'
                    } transition-all duration-300 font-medium`}
                    disabled={isProcessing || !rootDir || !sourceDir || !excelPath}
                    onClick={handleStartProcess}
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        {t('processing')}
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {t('startProcess')}
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* 日志查看器卡片 */}
        <motion.div {...fadeInAnimation} transition={{ duration: 0.3, delay: 0.2 }}>
          <Card className="border-cyan-100 dark:border-cyan-800/30 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/10 dark:to-blue-900/10 rounded-t-lg border-b border-cyan-100 dark:border-cyan-800/30">
              <CardTitle className="text-cyan-700 dark:text-cyan-400 flex items-center gap-2">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {t('processingLogs')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <AnimatePresence mode="wait">
                {isProcessing || progress.percentage > 0 ? (
                  <motion.div
                    key="logger"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
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
                    className="flex flex-col items-center justify-center h-[385px] text-muted-foreground p-6"
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
                        className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-500 p-5 rounded-full mx-auto w-24 h-24 flex items-center justify-center border border-cyan-200 dark:border-cyan-800/30 shadow-inner"
                        animate={{
                          boxShadow: [
                            '0 0 0 0 rgba(6, 182, 212, 0.2)',
                            '0 0 0 15px rgba(6, 182, 212, 0)'
                          ]
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity
                        }}
                      >
                        <Folder size={40} />
                      </motion.div>
                      <h3 className="font-medium text-slate-700 dark:text-slate-300 text-lg">
                        {t('readyToStart')}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs bg-slate-50/50 dark:bg-slate-800/20 p-3 rounded-lg border border-slate-100/50 dark:border-slate-700/30">
                        {t('selectFilesAndStartProcess')}
                      </p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default ImageOrganizeTool
