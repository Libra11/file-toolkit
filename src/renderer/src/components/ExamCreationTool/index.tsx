/**
 * Author: Libra
 * Date: 2025-04-22 15:22:50
 * LastEditors: Libra
 * Description:
 */
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Progress } from '@renderer/components/ui/progress'
import { Separator } from '@renderer/components/ui/separator'
import {
  PlusCircle,
  Trash2,
  Save,
  Settings2,
  FileUp,
  Zap,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  FileSearch,
  Loader2
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@renderer/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@renderer/components/ui/collapsible'
import { Textarea } from '@renderer/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@renderer/components/ui/dialog'
import { LogViewer } from './LogViewer'
import { cn } from '@renderer/lib/utils'

export default function ExamCreationTool(): JSX.Element {
  const [config, setConfig] = useState<any>(null)
  const [defaultPeriod, setDefaultPeriod] = useState<any>(null)
  const [defaultSubject, setDefaultSubject] = useState<any>(null)
  const [defaultPart, setDefaultPart] = useState<any>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isExamCreated, setIsExamCreated] = useState<boolean>(false)
  const [showLogViewer, setShowLogViewer] = useState<boolean>(false)

  const getDefaultConfig = async (): Promise<any> => {
    return await window.exam.getDefaultConfig()
  }

  // 处理日期变更 - 直接使用输入值
  const handleDateChange = (field: string, value: string): void => {
    handleInputChange(field, value)
  }

  useEffect(() => {
    getDefaultConfig().then((config) => {
      console.log(config)
      setConfig(config)
      const defaultPeriod = config.periods[0]
      const defaultSubject = defaultPeriod.subjects[0]
      const defaultPart = defaultSubject.parts[0]
      setDefaultPeriod(defaultPeriod)
      setDefaultSubject(defaultSubject)
      setDefaultPart(defaultPart)
    })
  }, [])

  const handleInputChange = (field: string, value: unknown): void => {
    console.log(field, value)
    if (field.includes('.')) {
      const parts = field.split('.')
      setConfig((prev) => {
        const newConfig = { ...prev }
        let current: Record<string, unknown> = newConfig
        for (let i = 0; i < parts.length - 1; i++) {
          if (parts[i].includes('[')) {
            // 处理数组
            const arrayPart = parts[i].split('[')
            const arrayName = arrayPart[0]
            const index = parseInt(arrayPart[1].replace(']', ''))
            current = current[arrayName] as Record<string, unknown>
            if (Array.isArray(current)) {
              current = current[index] as Record<string, unknown>
            }
          } else {
            current = current[parts[i]] as Record<string, unknown>
          }
        }
        const lastPart = parts[parts.length - 1]
        if (lastPart.includes('[')) {
          // 处理数组
          const arrayPart = lastPart.split('[')
          const arrayName = arrayPart[0]
          const index = parseInt(arrayPart[1].replace(']', ''))
          const arr = current[arrayName] as unknown[]
          if (Array.isArray(arr)) {
            arr[index] = value
          }
        } else {
          current[lastPart] = value
        }
        return newConfig
      })
    } else {
      setConfig((prev) => ({
        ...prev,
        [field]: value
      }))
    }
  }

  // 添加新时段
  const addPeriod = (): void => {
    setConfig((prev) => {
      const newConfig = { ...prev }
      newConfig.periods = [...prev.periods, { ...defaultPeriod }]
      return newConfig
    })
  }

  // 删除时段
  const removePeriod = (periodIndex: number): void => {
    setConfig((prev) => {
      const newConfig = { ...prev }
      newConfig.periods = prev.periods.filter((_, index) => index !== periodIndex)
      return newConfig
    })
  }

  // 添加新科目到指定时段
  const addSubject = (periodIndex: number): void => {
    setConfig((prev) => {
      const newConfig = { ...prev }
      const period = { ...newConfig.periods[periodIndex] }
      period.subjects = [...period.subjects, { ...defaultSubject }]
      newConfig.periods[periodIndex] = period
      return newConfig
    })
  }

  // 删除科目
  const removeSubject = (periodIndex: number, subjectIndex: number): void => {
    setConfig((prev) => {
      const newConfig = { ...prev }
      const period = { ...newConfig.periods[periodIndex] }
      period.subjects = period.subjects.filter((_, index) => index !== subjectIndex)
      newConfig.periods[periodIndex] = period
      return newConfig
    })
  }

  // 添加新子卷到指定科目
  const addPart = (periodIndex: number, subjectIndex: number): void => {
    setConfig((prev) => {
      const newConfig = { ...prev }
      const period = { ...newConfig.periods[periodIndex] }
      const subject = { ...period.subjects[subjectIndex] }
      subject.parts = [...subject.parts, { ...defaultPart }]
      period.subjects[subjectIndex] = subject
      newConfig.periods[periodIndex] = period
      return newConfig
    })
  }

  // 删除子卷
  const removePart = (periodIndex: number, subjectIndex: number, partIndex: number): void => {
    setConfig((prev) => {
      const newConfig = { ...prev }
      const period = { ...newConfig.periods[periodIndex] }
      const subject = { ...period.subjects[subjectIndex] }
      subject.parts = subject.parts.filter((_, index) => index !== partIndex)
      period.subjects[subjectIndex] = subject
      newConfig.periods[periodIndex] = period
      return newConfig
    })
  }

  // 监听日志消息，当收到创建完成的消息时更新状态（但不自动关闭日志）
  useEffect(() => {
    if (!isLoading) return

    const handleLogMessage = (log: { type: string; message: string }): void => {
      // 检测到成功完成消息时
      if (
        log.type === 'success' &&
        (log.message.includes('所有考试内容创建完成') || log.message.includes('考试上线成功'))
      ) {
        // 设置考试创建成功状态，但不关闭日志窗口
        setIsLoading(false)
        setIsExamCreated(true)
      }

      // 检测到错误消息时
      if (log.type === 'error' && log.message.includes('创建考试失败')) {
        // 设置加载状态为false，但保持日志窗口打开
        setIsLoading(false)
      }
    }

    // 注册日志监听器
    const unsubscribe = window.exam.onLog(handleLogMessage)

    // 清理函数
    return (): void => {
      unsubscribe()
    }
  }, [isLoading])

  const handleSubmit = async (): Promise<void> => {
    try {
      setIsLoading(true)
      setIsExamCreated(false)
      setShowLogViewer(true) // 显示日志查看器
      // 通过IPC调用主进程创建考试
      console.log(config)
      await window.exam.setDefaultConfig(config)
      await window.exam.createExam()
    } catch (error) {
      console.error('创建考试失败:', error)
      // 出错时设置状态为false，但保持日志窗口打开
      setIsLoading(false)
    }
    // 不在finally块中设置isLoading，而是通过监听日志消息来设置
  }

  // 关闭日志查看器
  const closeLogViewer = (): void => {
    setShowLogViewer(false)
  }

  if (!config) {
    return (
      <div className="flex justify-center items-center h-screen">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 shadow-lg rounded-xl p-10 border border-indigo-100 dark:border-indigo-800/30"
        >
          加载配置中...
        </motion.div>
      </div>
    )
  }

  const totalPeriods = config.periods.length
  const totalSubjects = config.periods.reduce(
    (count, period) => count + period.subjects.length,
    0
  )
  const totalParts = config.periods.reduce((count, period) => {
    return (
      count +
      period.subjects.reduce(
        (subjectCount, subject) => subjectCount + (subject.parts?.length ?? 0),
        0
      )
    )
  }, 0)
  const examTypeLabel = config.project.type === 2 ? '三级架构考试' : '普通考试'
  const heroStats = [
    { label: '时段数量', value: totalPeriods, caption: '多场景时段划分' },
    { label: '科目数量', value: totalSubjects, caption: '适配主观/客观题型' },
    { label: '子卷数量', value: totalParts, caption: '细粒度卷别拆分' }
  ]
  const creationStatus = isExamCreated ? '创建完成' : isLoading ? '生成中' : '待创建'
  const creationProgress = isExamCreated ? 100 : isLoading ? 68 : 35
  const creationStatusColor = isExamCreated
    ? 'text-green-600 dark:text-green-300'
    : isLoading
      ? 'text-indigo-600 dark:text-indigo-300'
      : 'text-slate-500 dark:text-slate-400'
  const statusPillClass = cn(
    'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-colors',
    isExamCreated
      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
      : isLoading
        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
        : 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300'
  )
  const multiRoomLabel = config.useMultipleRooms ? '已启用' : '未启用'
  const tokenPreview = config.token
    ? config.token.length > 28
      ? `${config.token.slice(0, 12)}...${config.token.slice(-4)}`
      : config.token
    : '未填写 Token'
  const notePreview = config.project.note?.trim()
    ? config.project.note
    : '已按默认模板载入配置，建议生成前复核基本信息和须知内容。'

  return (
    <div className="w-full pb-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/90 p-5 shadow-2xl shadow-blue-900/10 backdrop-blur-sm transition-all duration-500 dark:border-white/10 dark:bg-slate-900/60"
      >
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-white/60 to-transparent dark:from-blue-900/40 dark:via-slate-900" />
        <div className="space-y-5 relative">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 text-white p-3 rounded-2xl shadow-md flex items-center justify-center">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  离线考试创建工具
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  快速生成考试配置和资源，支持多场景自动化创建
                </p>
              </div>
            </div>
            <Badge className="border-blue-200 bg-white/80 text-blue-600 dark:border-blue-800/40 dark:bg-blue-950/30 dark:text-blue-200">
              {examTypeLabel}
            </Badge>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-blue-100/80 bg-blue-50/70 px-4 py-3 text-sm text-blue-700 shadow-inner dark:border-blue-800/50 dark:bg-blue-900/20 dark:text-blue-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-blue-500 shadow-sm dark:bg-white/10 dark:text-blue-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-base font-semibold text-slate-900 dark:text-white">温馨提示</p>
              <p className="text-xs leading-relaxed text-blue-600/90 dark:text-blue-200">
                请先确认主项目信息，再对时段/科目等设置进行微调，创建过程会实时回显到下方状态卡片。
              </p>
            </div>
          </div>
          <div className="grid gap-3 pt-1 sm:grid-cols-3">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-blue-100/80 bg-white/80 p-3 shadow-sm dark:border-blue-800/30 dark:bg-slate-900/50"
              >
                <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{stat.caption}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="overflow-hidden"
        >
        <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-xl shadow-blue-900/10 dark:border-slate-700/60 dark:bg-slate-900/60">
          <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-4 border-b border-indigo-100/80 dark:border-indigo-800/30">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500 text-white h-10 w-10 rounded-full flex items-center justify-center shadow-sm">
                <FileUp className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-indigo-800 dark:text-indigo-300">
                  创建离线考试
                </CardTitle>
                <CardDescription className="text-sm text-indigo-600 dark:text-indigo-400">
                  自动生成考试配置与资源，提升创建效率。
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            {/* 基本信息 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h3 className="font-semibold text-lg flex items-center text-indigo-700 dark:text-indigo-400">
                <ArrowRight className="mr-2 h-5 w-5" />
                基本信息
              </h3>
              <Separator className="bg-indigo-100 dark:bg-indigo-800/50" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name" className="text-indigo-700 dark:text-indigo-400">
                    考试名称
                  </Label>
                  <Input
                    id="project-name"
                    value={config.project.name}
                    onChange={(e) => handleInputChange('project.name', e.target.value)}
                    className="border-indigo-200 dark:border-indigo-800/40 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="project-shortName"
                    className="text-indigo-700 dark:text-indigo-400"
                  >
                    考试简称
                  </Label>
                  <Input
                    id="project-shortName"
                    value={config.project.shortName}
                    onChange={(e) => handleInputChange('project.shortName', e.target.value)}
                    className="border-indigo-200 dark:border-indigo-800/40 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project-type" className="text-indigo-700 dark:text-indigo-400">
                    考试类型
                  </Label>
                  <Select
                    value={String(config.project.type || 1)}
                    onValueChange={(value) => handleInputChange('project.type', parseInt(value))}
                  >
                    <SelectTrigger className="w-full border-indigo-200 dark:border-indigo-800/40 focus:border-indigo-500 focus:ring-indigo-500">
                      <SelectValue placeholder="选择考试类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">普通考试</SelectItem>
                      <SelectItem value="2">三级架构考试</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project-startAt" className="text-indigo-700 dark:text-indigo-400">
                    开始时间
                  </Label>
                  <Input
                    id="project-startAt"
                    type="text"
                    value={config.project.startAt}
                    onChange={(e) => handleDateChange('project.startAt', e.target.value)}
                    className="border-indigo-200 dark:border-indigo-800/40 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="格式：YYYY-MM-DD HH:MM:SS"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project-endAt" className="text-indigo-700 dark:text-indigo-400">
                    结束时间
                  </Label>
                  <Input
                    id="project-endAt"
                    type="text"
                    value={config.project.endAt}
                    onChange={(e) => handleDateChange('project.endAt', e.target.value)}
                    className="border-indigo-200 dark:border-indigo-800/40 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="格式：YYYY-MM-DD HH:MM:SS"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apiBaseUrl" className="text-indigo-700 dark:text-indigo-400">
                    API基础URL
                  </Label>
                  <Input
                    id="apiBaseUrl"
                    value={config.apiBaseUrl}
                    onChange={(e) => handleInputChange('apiBaseUrl', e.target.value)}
                    className="border-indigo-200 dark:border-indigo-800/40 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="token" className="text-indigo-700 dark:text-indigo-400">
                    API令牌
                  </Label>
                  <Input
                    id="token"
                    value={config.token}
                    onChange={(e) => handleInputChange('token', e.target.value)}
                    className="border-indigo-200 dark:border-indigo-800/40 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <Collapsible className="mt-4 border rounded-md border-indigo-200 dark:border-indigo-800/40 overflow-hidden">
                <CollapsibleTrigger className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 w-full flex justify-between items-center px-4 py-3 text-indigo-700 dark:text-indigo-400">
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    <span className="font-medium">更多设置</span>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-4 space-y-4 bg-white dark:bg-slate-800/80">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="project-faceDiff"
                          className="text-indigo-700 dark:text-indigo-400"
                        >
                          签到模式
                        </Label>
                        <Select
                          value={String(config.project.faceDiff)}
                          onValueChange={(value) =>
                            handleInputChange('project.faceDiff', parseInt(value))
                          }
                        >
                          <SelectTrigger className="w-full border-indigo-200 dark:border-indigo-800/40 focus:border-indigo-500 focus:ring-indigo-500">
                            <SelectValue placeholder="签到模式" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - 无报名照片，无需拍照</SelectItem>
                            <SelectItem value="2">2 - 无报名照片，需拍照</SelectItem>
                            <SelectItem value="3">3 - 有报名照片，无需拍照</SelectItem>
                            <SelectItem value="4">4 - 有报名照片，需拍照</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2 h-full pt-8">
                        <Checkbox
                          id="fixedPosition"
                          checked={config.project.fixedPosition}
                          onCheckedChange={(checked) =>
                            handleInputChange('project.fixedPosition', checked)
                          }
                          className="text-indigo-500 border-indigo-300 dark:border-indigo-700"
                        />
                        <Label
                          htmlFor="fixedPosition"
                          className="text-indigo-700 dark:text-indigo-400"
                        >
                          固定座位
                        </Label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2 h-full">
                        <Checkbox
                          id="offlineMode"
                          checked={config.project.offlineMode}
                          onCheckedChange={(checked) =>
                            handleInputChange('project.offlineMode', checked)
                          }
                          className="text-indigo-500 border-indigo-300 dark:border-indigo-700"
                        />
                        <Label
                          htmlFor="offlineMode"
                          className="text-indigo-700 dark:text-indigo-400"
                        >
                          离线模式
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2 h-full">
                        <Checkbox
                          id="useMultipleRooms"
                          checked={config.useMultipleRooms}
                          onCheckedChange={(checked) =>
                            handleInputChange('useMultipleRooms', checked)
                          }
                          className="text-indigo-500 border-indigo-300 dark:border-indigo-700"
                        />
                        <Label
                          htmlFor="useMultipleRooms"
                          className="text-indigo-700 dark:text-indigo-400"
                        >
                          使用多考场
                        </Label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="project-lateSecond"
                          className="text-indigo-700 dark:text-indigo-400"
                        >
                          允许迟到时间（秒）
                        </Label>
                        <Input
                          id="project-lateSecond"
                          type="number"
                          value={config.project.lateSecond}
                          onChange={(e) =>
                            handleInputChange('project.lateSecond', parseInt(e.target.value))
                          }
                          className="border-indigo-200 dark:border-indigo-800/40 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="project-requirement"
                        className="text-indigo-700 dark:text-indigo-400"
                      >
                        考试机须知
                      </Label>
                      <Textarea
                        id="project-requirement"
                        value={config.project.requirement}
                        onChange={(e) => handleInputChange('project.requirement', e.target.value)}
                        className="min-h-20 border-indigo-200 dark:border-indigo-800/40 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="project-admissionCardRequirement"
                        className="text-indigo-700 dark:text-indigo-400"
                      >
                        准考证须知
                      </Label>
                      <Textarea
                        id="project-admissionCardRequirement"
                        value={config.project.admissionCardRequirement}
                        onChange={(e) =>
                          handleInputChange('project.admissionCardRequirement', e.target.value)
                        }
                        className="min-h-20 border-indigo-200 dark:border-indigo-800/40 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="project-note"
                        className="text-indigo-700 dark:text-indigo-400"
                      >
                        备注
                      </Label>
                      <Textarea
                        id="project-note"
                        value={config.project.note}
                        onChange={(e) => handleInputChange('project.note', e.target.value)}
                        className="min-h-20 border-indigo-200 dark:border-indigo-800/40 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </motion.div>

            {/* 时段信息 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg flex items-center text-indigo-700 dark:text-indigo-400">
                  <ArrowRight className="mr-2 h-5 w-5" />
                  时段信息
                </h3>
                <Button
                  onClick={addPeriod}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 hover:border-indigo-300 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/40 dark:hover:border-indigo-700/60"
                >
                  <PlusCircle className="w-4 h-4" /> 添加时段
                </Button>
              </div>
              <Separator className="bg-indigo-100 dark:bg-indigo-800/50" />

              <div className="space-y-4">
                {config.periods.map((period, periodIndex) => (
                  <Collapsible
                    key={`period-${periodIndex}`}
                    className="border border-indigo-200 dark:border-indigo-800/40 rounded-lg shadow-md overflow-hidden"
                  >
                    <CollapsibleTrigger className="w-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-4 flex justify-between items-center border-b border-indigo-100/80 dark:border-indigo-800/30">
                      <div className="flex items-center">
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-1.5 rounded-md mr-2">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-indigo-800 dark:text-indigo-300">
                          时段 {periodIndex + 1}: {period.name || '未命名时段'}
                        </span>
                      </div>

                      {config.periods.length > 1 && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            removePeriod(periodIndex)
                          }}
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 border-red-200 hover:border-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:border-red-800/40"
                        >
                          <Trash2 className="w-4 h-4" /> 删除
                        </Button>
                      )}
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="p-4 space-y-6 bg-white/80 dark:bg-slate-800/80">
                        {/* 时段基本信息 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor={`period-name-${periodIndex}`}
                              className="text-indigo-700 dark:text-indigo-400"
                            >
                              时段名称
                            </Label>
                            <Input
                              id={`period-name-${periodIndex}`}
                              value={period.name}
                              onChange={(e) =>
                                handleInputChange(`periods[${periodIndex}].name`, e.target.value)
                              }
                              className="border-indigo-200 dark:border-indigo-800/40 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor={`period-duration-${periodIndex}`}
                              className="text-indigo-700 dark:text-indigo-400"
                            >
                              时长(秒)
                            </Label>
                            <Input
                              id={`period-duration-${periodIndex}`}
                              type="number"
                              value={period.duration}
                              onChange={(e) =>
                                handleInputChange(
                                  `periods[${periodIndex}].duration`,
                                  parseInt(e.target.value)
                                )
                              }
                              className="border-indigo-200 dark:border-indigo-800/40 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor={`period-startAt-${periodIndex}`}
                              className="text-indigo-700 dark:text-indigo-400"
                            >
                              开始时间
                            </Label>
                            <Input
                              id={`period-startAt-${periodIndex}`}
                              type="text"
                              value={period.startAt}
                              onChange={(e) =>
                                handleDateChange(`periods[${periodIndex}].startAt`, e.target.value)
                              }
                              className="border-indigo-200 dark:border-indigo-800/40 focus:border-indigo-500 focus:ring-indigo-500"
                              placeholder="格式：YYYY-MM-DD HH:MM:SS"
                            />
                          </div>
                        </div>

                        {/* 科目信息 */}
                        <div className="space-y-4 mt-6">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium text-sm flex items-center text-indigo-700 dark:text-indigo-400">
                              <ArrowRight className="mr-1.5 h-4 w-4" />
                              科目信息
                            </h4>
                            <Button
                              onClick={() => addSubject(periodIndex)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 hover:border-indigo-300 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/40 dark:hover:border-indigo-700/60"
                            >
                              <PlusCircle className="w-4 h-4" /> 添加科目
                            </Button>
                          </div>
                          <Separator className="bg-indigo-100 dark:bg-indigo-800/50" />

                          <div className="space-y-3">
                            {period.subjects.map((subject, subjectIndex) => (
                              <Collapsible
                                key={`subject-${periodIndex}-${subjectIndex}`}
                                className="border border-blue-200 dark:border-blue-800/40 rounded-lg shadow-sm overflow-hidden ml-4"
                              >
                                <CollapsibleTrigger className="w-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-3 flex justify-between items-center border-b border-blue-100/80 dark:border-blue-800/30">
                                  <div className="flex items-center">
                                    <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1.5 rounded-md mr-2">
                                      <ArrowRight className="h-4 w-4" />
                                    </div>
                                    <span className="font-medium text-blue-800 dark:text-blue-300">
                                      科目 {subjectIndex + 1}: {subject.name || '未命名科目'}
                                    </span>
                                  </div>

                                  {period.subjects.length > 1 && (
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        removeSubject(periodIndex, subjectIndex)
                                      }}
                                      variant="destructive"
                                      size="sm"
                                      className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 border-red-200 hover:border-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:border-red-800/40"
                                    >
                                      <Trash2 className="w-4 h-4" /> 删除
                                    </Button>
                                  )}
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                  <div className="p-4 space-y-4 bg-white/80 dark:bg-slate-800/80">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label
                                          htmlFor={`subject-name-${periodIndex}-${subjectIndex}`}
                                          className="text-blue-700 dark:text-blue-400"
                                        >
                                          科目名称
                                        </Label>
                                        <Input
                                          id={`subject-name-${periodIndex}-${subjectIndex}`}
                                          value={subject.name}
                                          onChange={(e) =>
                                            handleInputChange(
                                              `periods[${periodIndex}].subjects[${subjectIndex}].name`,
                                              e.target.value
                                            )
                                          }
                                          className="border-blue-200 dark:border-blue-800/40 focus:border-blue-500 focus:ring-blue-500"
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label
                                          htmlFor={`subject-duration-${periodIndex}-${subjectIndex}`}
                                          className="text-blue-700 dark:text-blue-400"
                                        >
                                          时长(秒)
                                        </Label>
                                        <Input
                                          id={`subject-duration-${periodIndex}-${subjectIndex}`}
                                          type="number"
                                          value={subject.duration}
                                          onChange={(e) =>
                                            handleInputChange(
                                              `periods[${periodIndex}].subjects[${subjectIndex}].duration`,
                                              parseInt(e.target.value)
                                            )
                                          }
                                          className="border-blue-200 dark:border-blue-800/40 focus:border-blue-500 focus:ring-blue-500"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`calculatorEnabled-${periodIndex}-${subjectIndex}`}
                                          checked={subject.calculatorEnabled}
                                          onCheckedChange={(checked) =>
                                            handleInputChange(
                                              `periods[${periodIndex}].subjects[${subjectIndex}].calculatorEnabled`,
                                              checked
                                            )
                                          }
                                          className="text-blue-500 border-blue-300 dark:border-blue-700"
                                        />
                                        <Label
                                          htmlFor={`calculatorEnabled-${periodIndex}-${subjectIndex}`}
                                          className="text-blue-700 dark:text-blue-400"
                                        >
                                          启用计算器
                                        </Label>
                                      </div>

                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`showScore-${periodIndex}-${subjectIndex}`}
                                          checked={subject.showScore}
                                          onCheckedChange={(checked) =>
                                            handleInputChange(
                                              `periods[${periodIndex}].subjects[${subjectIndex}].showScore`,
                                              checked
                                            )
                                          }
                                          className="text-blue-500 border-blue-300 dark:border-blue-700"
                                        />
                                        <Label
                                          htmlFor={`showScore-${periodIndex}-${subjectIndex}`}
                                          className="text-blue-700 dark:text-blue-400"
                                        >
                                          显示分数
                                        </Label>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <Label
                                        htmlFor={`subject-submitSecond-${periodIndex}-${subjectIndex}`}
                                        className="text-blue-700 dark:text-blue-400"
                                      >
                                        允许交卷时间（秒）
                                      </Label>
                                      <Input
                                        id={`subject-submitSecond-${periodIndex}-${subjectIndex}`}
                                        type="number"
                                        value={subject.submitSecond}
                                        onChange={(e) =>
                                          handleInputChange(
                                            `periods[${periodIndex}].subjects[${subjectIndex}].submitSecond`,
                                            parseInt(e.target.value)
                                          )
                                        }
                                        className="border-blue-200 dark:border-blue-800/40 focus:border-blue-500 focus:ring-blue-500"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label
                                        htmlFor={`subject-note-${periodIndex}-${subjectIndex}`}
                                        className="text-blue-700 dark:text-blue-400"
                                      >
                                        备注
                                      </Label>
                                      <Input
                                        id={`subject-note-${periodIndex}-${subjectIndex}`}
                                        value={subject.note}
                                        onChange={(e) =>
                                          handleInputChange(
                                            `periods[${periodIndex}].subjects[${subjectIndex}].note`,
                                            e.target.value
                                          )
                                        }
                                        className="border-blue-200 dark:border-blue-800/40 focus:border-blue-500 focus:ring-blue-500"
                                      />
                                    </div>

                                    {/* 子卷信息 */}
                                    <div className="space-y-4 mt-6">
                                      <div className="flex justify-between items-center">
                                        <h5 className="font-medium text-sm flex items-center text-blue-700 dark:text-blue-400">
                                          <ArrowRight className="mr-1.5 h-4 w-4" />
                                          子卷信息
                                        </h5>
                                        <Button
                                          onClick={() => addPart(periodIndex, subjectIndex)}
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-300 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/40 dark:hover:border-blue-700/60"
                                        >
                                          <PlusCircle className="w-4 h-4" /> 添加子卷
                                        </Button>
                                      </div>
                                      <Separator className="bg-blue-100 dark:bg-blue-800/50" />

                                      <div className="space-y-2">
                                        {subject.parts.map((part, partIndex) => (
                                          <Collapsible
                                            key={`part-${periodIndex}-${subjectIndex}-${partIndex}`}
                                            className="border border-purple-200 dark:border-purple-800/40 rounded-lg shadow-sm overflow-hidden ml-4"
                                          >
                                            <CollapsibleTrigger className="w-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-3 flex justify-between items-center border-b border-purple-100/80 dark:border-purple-800/30">
                                              <div className="flex items-center">
                                                <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-1 rounded-md mr-2">
                                                  <ArrowRight className="h-4 w-4" />
                                                </div>
                                                <span className="font-medium text-purple-800 dark:text-purple-300">
                                                  子卷 {partIndex + 1}: {part.name || '未命名子卷'}
                                                </span>
                                              </div>

                                              {subject.parts.length > 1 && (
                                                <Button
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    removePart(periodIndex, subjectIndex, partIndex)
                                                  }}
                                                  variant="destructive"
                                                  size="sm"
                                                  className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 border-red-200 hover:border-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:border-red-800/40"
                                                >
                                                  <Trash2 className="w-3 h-3" /> 删除
                                                </Button>
                                              )}
                                            </CollapsibleTrigger>

                                            <CollapsibleContent>
                                              <div className="p-4 space-y-4 bg-white/80 dark:bg-slate-800/80">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                  <div className="space-y-2">
                                                    <Label
                                                      htmlFor={`part-name-${periodIndex}-${subjectIndex}-${partIndex}`}
                                                      className="text-purple-700 dark:text-purple-400"
                                                    >
                                                      名称
                                                    </Label>
                                                    <Input
                                                      id={`part-name-${periodIndex}-${subjectIndex}-${partIndex}`}
                                                      value={part.name}
                                                      onChange={(e) =>
                                                        handleInputChange(
                                                          `periods[${periodIndex}].subjects[${subjectIndex}].parts[${partIndex}].name`,
                                                          e.target.value
                                                        )
                                                      }
                                                      className="border-purple-200 dark:border-purple-800/40 focus:border-purple-500 focus:ring-purple-500"
                                                    />
                                                  </div>

                                                  <div className="space-y-2">
                                                    <Label
                                                      htmlFor={`part-note-${periodIndex}-${subjectIndex}-${partIndex}`}
                                                      className="text-purple-700 dark:text-purple-400"
                                                    >
                                                      备注
                                                    </Label>
                                                    <Input
                                                      id={`part-note-${periodIndex}-${subjectIndex}-${partIndex}`}
                                                      value={part.note}
                                                      onChange={(e) =>
                                                        handleInputChange(
                                                          `periods[${periodIndex}].subjects[${subjectIndex}].parts[${partIndex}].note`,
                                                          e.target.value
                                                        )
                                                      }
                                                      className="border-purple-200 dark:border-purple-800/40 focus:border-purple-500 focus:ring-purple-500"
                                                    />
                                                  </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-purple-50/50 dark:bg-purple-900/10 p-3 rounded-lg border border-purple-100 dark:border-purple-800/30">
                                                  <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                      id={`optionRandomized-${periodIndex}-${subjectIndex}-${partIndex}`}
                                                      checked={part.optionRandomized}
                                                      onCheckedChange={(checked) =>
                                                        handleInputChange(
                                                          `periods[${periodIndex}].subjects[${subjectIndex}].parts[${partIndex}].optionRandomized`,
                                                          checked
                                                        )
                                                      }
                                                      className="text-purple-500 border-purple-300 dark:border-purple-700"
                                                    />
                                                    <Label
                                                      htmlFor={`optionRandomized-${periodIndex}-${subjectIndex}-${partIndex}`}
                                                      className="text-purple-700 dark:text-purple-400"
                                                    >
                                                      选项乱序
                                                    </Label>
                                                  </div>

                                                  <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                      id={`questionRandomized-${periodIndex}-${subjectIndex}-${partIndex}`}
                                                      checked={part.questionRandomized}
                                                      onCheckedChange={(checked) =>
                                                        handleInputChange(
                                                          `periods[${periodIndex}].subjects[${subjectIndex}].parts[${partIndex}].questionRandomized`,
                                                          checked
                                                        )
                                                      }
                                                      className="text-purple-500 border-purple-300 dark:border-purple-700"
                                                    />
                                                    <Label
                                                      htmlFor={`questionRandomized-${periodIndex}-${subjectIndex}-${partIndex}`}
                                                      className="text-purple-700 dark:text-purple-400"
                                                    >
                                                      题目乱序
                                                    </Label>
                                                  </div>
                                                </div>
                                              </div>
                                            </CollapsibleContent>
                                          </Collapsible>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </motion.div>

          </CardContent>
        </Card>
        </motion.div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="rounded-3xl border border-slate-200 bg-white/95 shadow-xl shadow-blue-900/10 dark:border-slate-700/60 dark:bg-slate-900/70">
              <CardHeader className="p-5 border-b border-slate-100/80 dark:border-slate-800/60">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                      考试概览
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                      快速了解当前配置状态
                    </CardDescription>
                  </div>
                  <Badge className="border-indigo-200 bg-indigo-50/80 text-indigo-700 dark:border-indigo-800/40 dark:bg-indigo-900/30 dark:text-indigo-200">
                    {examTypeLabel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {heroStats.map((stat) => (
                    <div
                      key={`overview-${stat.label}`}
                      className="rounded-2xl border border-slate-100/80 bg-white/80 p-3 shadow-sm dark:border-slate-800/40 dark:bg-slate-900/60"
                    >
                      <p className="text-[0.7rem] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        {stat.label}
                      </p>
                      <p className="text-xl font-semibold text-slate-900 dark:text-white">{stat.value}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{stat.caption}</p>
                    </div>
                  ))}
                </div>
                <Separator className="bg-slate-100 dark:bg-slate-800/60" />
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <div>
                    <p>开始时间</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {config.project.startAt || '--'}
                    </p>
                  </div>
                  <div>
                    <p>结束时间</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {config.project.endAt || '--'}
                    </p>
                  </div>
                </div>
                <Separator className="bg-slate-100 dark:bg-slate-800/60" />
                <div className="space-y-3 text-xs text-slate-500 dark:text-slate-400">
                  <div>
                    <p className="text-[0.7rem] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      API 基础
                    </p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 break-all">
                      {config.apiBaseUrl || '未配置'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.7rem] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      Access Token
                    </p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 break-all">
                      {tokenPreview}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>多考场</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'border px-3 py-1 text-xs font-semibold',
                        config.useMultipleRooms
                          ? 'border-green-200 bg-green-50/80 text-green-700 dark:border-green-800/30 dark:bg-green-900/20 dark:text-green-300'
                          : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200'
                      )}
                    >
                      {multiRoomLabel}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="rounded-3xl border border-indigo-100/80 bg-white/95 shadow-xl shadow-indigo-900/10 dark:border-indigo-800/40 dark:bg-slate-900/70">
              <CardHeader className="p-5 border-b border-indigo-100/80 dark:border-indigo-900/40">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                      创建状态
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                      实时监控任务进度与日志
                    </CardDescription>
                  </div>
                  <div className={statusPillClass}>
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        isExamCreated
                          ? 'bg-green-500'
                          : isLoading
                            ? 'bg-indigo-500'
                            : 'bg-slate-400 dark:bg-slate-500'
                      )}
                    />
                    {creationStatus}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>流程追踪</span>
                    <span className={cn('font-semibold', creationStatusColor)}>{creationStatus}</span>
                  </div>
                  <Progress value={creationProgress} className="h-2 bg-slate-100 dark:bg-slate-800/70" />
                </div>
                <div className="rounded-2xl border border-indigo-100/80 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 p-4 text-sm text-slate-600 shadow-inner dark:border-indigo-800/40 dark:from-indigo-900/30 dark:to-purple-900/20 dark:text-slate-200">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-200">
                    当前考试
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {config.project.name || '未命名考试'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{notePreview}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <div>
                    <p>准考证须知</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
                      {config.project.admissionCardRequirement || '未填写'}
                    </p>
                  </div>
                  <div>
                    <p>考试机须知</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
                      {config.project.requirement || '未填写'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className={cn(
                      'h-12 w-full justify-center rounded-2xl border-none text-base font-medium text-white shadow-lg shadow-indigo-500/30 transition-all',
                      'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600',
                      isLoading && 'opacity-90'
                    )}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        生成中...
                      </>
                    ) : isExamCreated ? (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        再次创建考试
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" />
                        开始生成考试
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowLogViewer(true)}
                    variant="outline"
                    className="h-12 w-full justify-center rounded-2xl border-indigo-200/70 text-indigo-700 hover:border-indigo-300 hover:text-indigo-800 dark:border-indigo-800/40 dark:text-indigo-300 dark:hover:text-indigo-200"
                  >
                    <FileSearch className="mr-2 h-5 w-5" />
                    {isLoading ? '实时查看日志' : '打开日志面板'}
                  </Button>
                  {isExamCreated && (
                    <div className="flex items-center justify-center gap-2 rounded-2xl bg-green-50/80 p-3 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">
                      <CheckCircle2 className="h-4 w-4" />
                      创建完成，可继续生成
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* 日志查看器弹窗 */}
      <Dialog open={showLogViewer} onOpenChange={setShowLogViewer}>
        <DialogContent className="sm:max-w-[800px] h-auto overflow-hidden p-0">
          <DialogHeader className="pb-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 m-0 rounded-t-lg border-b border-green-200 dark:border-green-800/30 p-4">
            <DialogTitle className="text-lg text-green-800 dark:text-green-300 flex items-center">
              <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-1.5 rounded-md mr-2">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              考试创建日志
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10 max-h-[420px] overflow-hidden">
            <LogViewer />
          </div>
          <DialogFooter className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10 border-t border-green-100 dark:border-green-800/20 py-3 px-6">
            <Button
              onClick={closeLogViewer}
              className="bg-green-500 hover:bg-green-600 text-white hover:text-white"
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
