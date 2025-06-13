/**
 * Author: Libra
 * Date: 2025-04-22 15:22:50
 * LastEditors: Libra
 * Description:
 */
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Separator } from '@renderer/components/ui/separator'
import { Checkbox } from '@renderer/components/ui/checkbox'
import {
  PlusCircle,
  Trash2,
  Save,
  Settings2,
  FileUp,
  Zap,
  ArrowRight,
  CheckCircle2
} from 'lucide-react'
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

  return (
    <div className="w-full py-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 border border-blue-100/50 dark:border-blue-800/30 shadow-sm"
      >
        <div className="flex items-center space-x-3 mb-3">
          <div className="bg-blue-500 text-white p-2 rounded-lg shadow-md">
            <Zap className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-blue-800 dark:text-blue-300">离线考试创建工具</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 pl-10">
          快速创建离线考试，一键生成所有必要的配置和资源
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-4 border-b border-indigo-100/80 dark:border-indigo-800/30">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-500 text-white h-8 w-8 rounded-full flex items-center justify-center shadow-sm">
              <FileUp className="h-4 w-4" />
            </div>
            <h2 className="text-xl font-semibold text-indigo-800 dark:text-indigo-300">
              创建离线考试
            </h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
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
                <Label htmlFor="project-shortName" className="text-indigo-700 dark:text-indigo-400">
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
                      <Label htmlFor="offlineMode" className="text-indigo-700 dark:text-indigo-400">
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

                    <div className="space-y-2">
                      <Label
                        htmlFor="project-submitSecond"
                        className="text-indigo-700 dark:text-indigo-400"
                      >
                        允许交卷时间（秒）
                      </Label>
                      <Input
                        id="project-submitSecond"
                        type="number"
                        value={config.project.submitSecond}
                        onChange={(e) =>
                          handleInputChange('project.submitSecond', parseInt(e.target.value))
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
                    <Label htmlFor="project-note" className="text-indigo-700 dark:text-indigo-400">
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

          {/* 提交按钮 */}
          <motion.div
            className="flex justify-end pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur-md opacity-20 -z-10 group-hover:opacity-30 transition-opacity" />
              {isExamCreated ? (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsExamCreated(false)}
                    className={cn(
                      'flex items-center gap-2 h-12 px-6 relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-md rounded-xl border-none'
                    )}
                  >
                    <span className="relative z-10 flex items-center justify-center font-medium text-lg">
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      考试创建完成
                    </span>
                  </Button>

                  <Button
                    onClick={() => setShowLogViewer(true)}
                    variant="outline"
                    className="flex items-center gap-2 h-12 px-6 border-green-200 hover:border-green-300 text-green-700 hover:text-green-800 dark:border-green-800/40 dark:hover:border-green-700/60 dark:text-green-400 dark:hover:text-green-300"
                  >
                    <span className="flex items-center justify-center font-medium">查看日志</span>
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className={cn(
                    'flex items-center gap-2 h-12 px-6 relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-md rounded-xl border-none',
                    isLoading && 'from-indigo-500 to-indigo-700'
                  )}
                >
                  <span
                    className="absolute inset-0 w-full h-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] group-hover:animate-shimmer"
                    style={{ transform: 'translateX(-100%)' }}
                  ></span>
                  <span className="relative z-10 flex items-center justify-center font-medium text-lg">
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        生成中...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" />
                        开始生成考试
                      </>
                    )}
                  </span>
                </Button>
              )}
            </motion.div>
          </motion.div>

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
      </motion.div>
    </div>
  )
}
