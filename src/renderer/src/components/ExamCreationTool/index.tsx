/**
 * Author: Libra
 * Date: 2025-04-22 15:22:50
 * LastEditors: Libra
 * Description:
 */
import { useEffect, useState } from 'react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/button'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Progress } from '@renderer/components/ui/progress'
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  Loader2,
  Plus,
  Save,
  Terminal,
  Trash2
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
import { DataRow, Panel, PanelBody, PanelHeader } from '@renderer/components/ui/panel'
import { EmptyState, Notice, StatusDot } from '@renderer/components/ui/states'
import { LogViewer } from './LogViewer'
import { cn } from '@renderer/lib/utils'

interface ExamCreationToolProps {
  onBack?: () => void
}

const examSteps = [
  {
    id: 'project',
    titleKey: 'basicInfo',
    descriptionKey: 'examStepProjectDescription'
  },
  {
    id: 'structure',
    titleKey: 'examStepStructure',
    descriptionKey: 'examStepStructureDescription'
  },
  {
    id: 'rules',
    titleKey: 'examStepRules',
    descriptionKey: 'examStepRulesDescription'
  }
] as const

type ExamStep = (typeof examSteps)[number]['id']

interface ToggleFieldProps {
  id: string
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean | 'indeterminate') => void
}

function ToggleField({
  id,
  label,
  description,
  checked,
  onCheckedChange
}: ToggleFieldProps): JSX.Element {
  return (
    <div className="flex items-start gap-3 rounded-md border border-border bg-muted/20 px-3 py-3">
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} className="mt-0.5" />
      <div className="min-w-0 space-y-0.5">
        <Label htmlFor={id} className="cursor-pointer text-xs font-medium text-foreground">
          {label}
        </Label>
        {description && (
          <p className="text-[11px] leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  )
}

const ExamCreationTool: FC<ExamCreationToolProps> = (): JSX.Element => {
  const { t } = useTranslation()
  const [config, setConfig] = useState<any>(null)
  const [defaultPeriod, setDefaultPeriod] = useState<any>(null)
  const [defaultSubject, setDefaultSubject] = useState<any>(null)
  const [defaultPart, setDefaultPart] = useState<any>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isExamCreated, setIsExamCreated] = useState<boolean>(false)
  const [showLogViewer, setShowLogViewer] = useState<boolean>(false)
  const [activeStep, setActiveStep] = useState<ExamStep>('project')

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
      <div className="flex min-h-[320px] items-center justify-center p-6">
        <Notice
          tone="loading"
          title={t('examLoadingTitle')}
          description={t('examLoadingDescription')}
          className="w-full max-w-md"
        />
      </div>
    )
  }

  const totalPeriods = config.periods.length
  const totalSubjects = config.periods.reduce((count, period) => count + period.subjects.length, 0)
  const totalParts = config.periods.reduce((count, period) => {
    return (
      count +
      period.subjects.reduce(
        (subjectCount, subject) => subjectCount + (subject.parts?.length ?? 0),
        0
      )
    )
  }, 0)
  const examTypeLabel = config.project.type === 2 ? t('examTypeThreeTier') : t('examTypeStandard')
  const summaryStats = [
    { label: t('periods'), value: totalPeriods },
    { label: t('subjects'), value: totalSubjects },
    { label: t('parts'), value: totalParts }
  ]
  const creationStatus = isExamCreated
    ? t('examCreationComplete')
    : isLoading
      ? t('examCreationInProgress')
      : t('examCreationWaiting')
  const creationProgress = isExamCreated ? 100 : isLoading ? 68 : 35
  const creationStatusColor = isExamCreated || isLoading ? 'text-primary' : 'text-muted-foreground'
  const multiRoomLabel = config.useMultipleRooms ? t('examEnabled') : t('examDisabled')
  const tokenPreview = config.token
    ? config.token.length > 28
      ? `${config.token.slice(0, 12)}...${config.token.slice(-4)}`
      : config.token
    : t('examTokenEmpty')
  const notePreview = config.project.note?.trim() ? config.project.note : t('examNoteEmpty')
  const activeStepIndex = examSteps.findIndex((step) => step.id === activeStep)
  const activeStepCopy = examSteps[activeStepIndex]

  return (
    <div className="min-w-0 pb-6">
      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[208px_minmax(0,1fr)_304px]">
        <Panel className="min-w-0">
          <PanelHeader
            title={t('examNavigationTitle')}
            description={t('examNavigationDescription')}
          />
          <PanelBody className="p-2">
            <nav
              aria-label={t('examNavigationAria')}
              className="grid gap-1 md:grid-cols-3 xl:grid-cols-1"
            >
              {examSteps.map((step, index) => {
                const active = step.id === activeStep
                return (
                  <button
                    key={step.id}
                    type="button"
                    aria-current={active ? 'step' : undefined}
                    onClick={() => setActiveStep(step.id)}
                    className={cn(
                      'flex min-w-0 items-start gap-3 rounded-md border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30',
                      active
                        ? 'border-primary/25 bg-primary/[0.07] text-primary'
                        : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-[11px] font-semibold tabular-nums',
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card text-muted-foreground'
                      )}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold">{t(step.titleKey)}</span>
                      <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
                        {t(step.descriptionKey)}
                      </span>
                    </span>
                  </button>
                )
              })}
            </nav>
            <div className="mx-1 mb-1 mt-4 border-t border-border pt-3">
              <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{t('examConfigurationProgress')}</span>
                <span className="tabular-nums">
                  {activeStepIndex + 1} / {examSteps.length}
                </span>
              </div>
              <Progress
                value={((activeStepIndex + 1) / examSteps.length) * 100}
                className="h-1 rounded-none bg-muted [&>div]:bg-primary"
              />
            </div>
          </PanelBody>
        </Panel>

        <Panel className="min-w-0">
          <PanelHeader
            eyebrow={t('examStepLabel', {
              current: activeStepIndex + 1,
              total: examSteps.length
            })}
            title={t(activeStepCopy.titleKey)}
            description={t(activeStepCopy.descriptionKey)}
          />
          <PanelBody className="min-w-0 p-5">
            {activeStep === 'project' && (
              <div className="space-y-7">
                <section className="space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-foreground">
                      {t('examProjectInfo')}
                    </h3>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {t('examProjectInfoDescription')}
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="project-name" className="text-xs">
                        {t('projectName')}
                      </Label>
                      <Input
                        id="project-name"
                        value={config.project.name}
                        onChange={(e) => handleInputChange('project.name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project-shortName" className="text-xs">
                        {t('projectShortName')}
                      </Label>
                      <Input
                        id="project-shortName"
                        value={config.project.shortName}
                        onChange={(e) => handleInputChange('project.shortName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project-type" className="text-xs">
                        {t('examType')}
                      </Label>
                      <Select
                        value={String(config.project.type || 1)}
                        onValueChange={(value) =>
                          handleInputChange('project.type', parseInt(value))
                        }
                      >
                        <SelectTrigger id="project-type" className="w-full">
                          <SelectValue placeholder={t('examSelectType')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">{t('examTypeStandard')}</SelectItem>
                          <SelectItem value="2">{t('examTypeThreeTier')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                <section className="space-y-4 border-t border-border pt-5">
                  <div>
                    <h3 className="text-xs font-semibold text-foreground">{t('examSchedule')}</h3>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {t('examScheduleDescription')}
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="project-startAt" className="text-xs">
                        {t('startTime')}
                      </Label>
                      <Input
                        id="project-startAt"
                        type="text"
                        value={config.project.startAt}
                        onChange={(e) => handleDateChange('project.startAt', e.target.value)}
                        placeholder="YYYY-MM-DD HH:MM:SS"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project-endAt" className="text-xs">
                        {t('endTime')}
                      </Label>
                      <Input
                        id="project-endAt"
                        type="text"
                        value={config.project.endAt}
                        onChange={(e) => handleDateChange('project.endAt', e.target.value)}
                        placeholder="YYYY-MM-DD HH:MM:SS"
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-4 border-t border-border pt-5">
                  <div>
                    <h3 className="text-xs font-semibold text-foreground">
                      {t('examServiceConnection')}
                    </h3>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {t('examServiceConnectionDescription')}
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="apiBaseUrl" className="text-xs">
                        {t('apiBaseUrl')}
                      </Label>
                      <Input
                        id="apiBaseUrl"
                        value={config.apiBaseUrl}
                        onChange={(e) => handleInputChange('apiBaseUrl', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="token" className="text-xs">
                        {t('token')}
                      </Label>
                      <Input
                        id="token"
                        value={config.token}
                        onChange={(e) => handleInputChange('token', e.target.value)}
                      />
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeStep === 'structure' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-semibold text-foreground">
                      {t('examStructureTitle')}
                    </h3>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {t('examStructureDescription')}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={addPeriod}
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" /> {t('addPeriod')}
                  </Button>
                </div>

                <div className="space-y-3">
                  {config.periods.map((period, periodIndex) => (
                    <Collapsible
                      key={`period-${periodIndex}`}
                      defaultOpen={periodIndex === 0}
                      className="overflow-hidden rounded-lg border border-border bg-card"
                    >
                      <div className="flex items-center gap-2 bg-muted/30 px-3 py-2">
                        <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-2.5 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30">
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
                          <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                            {t('examPeriodNumber', { number: periodIndex + 1 })}
                          </span>
                          <span className="truncate text-xs font-semibold text-foreground">
                            {period.name || t('examUnnamedPeriod')}
                          </span>
                          <span className="ml-auto hidden shrink-0 text-[11px] text-muted-foreground sm:inline">
                            {t('examSubjectCount', { count: period.subjects.length })}
                          </span>
                        </CollapsibleTrigger>
                        {config.periods.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removePeriod(periodIndex)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                            aria-label={t('examRemovePeriodNumber', { number: periodIndex + 1 })}
                            title={t('examRemovePeriod')}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      <CollapsibleContent className="border-t border-border">
                        <div className="space-y-5 p-4">
                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                              <Label htmlFor={`period-name-${periodIndex}`} className="text-xs">
                                {t('periodName')}
                              </Label>
                              <Input
                                id={`period-name-${periodIndex}`}
                                value={period.name}
                                onChange={(e) =>
                                  handleInputChange(`periods[${periodIndex}].name`, e.target.value)
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`period-duration-${periodIndex}`} className="text-xs">
                                {t('duration')}
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
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`period-startAt-${periodIndex}`} className="text-xs">
                                {t('startTime')}
                              </Label>
                              <Input
                                id={`period-startAt-${periodIndex}`}
                                type="text"
                                value={period.startAt}
                                onChange={(e) =>
                                  handleDateChange(
                                    `periods[${periodIndex}].startAt`,
                                    e.target.value
                                  )
                                }
                                placeholder="YYYY-MM-DD HH:MM:SS"
                              />
                            </div>
                          </div>

                          <div className="space-y-3 border-t border-border pt-4">
                            <div className="flex items-center justify-between gap-3">
                              <h4 className="text-xs font-semibold text-foreground">
                                {t('subjects')}
                              </h4>
                              <Button
                                type="button"
                                onClick={() => addSubject(periodIndex)}
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 text-xs"
                              >
                                <Plus className="h-3.5 w-3.5" /> {t('addSubject')}
                              </Button>
                            </div>

                            <div className="space-y-3">
                              {period.subjects.map((subject, subjectIndex) => (
                                <Collapsible
                                  key={`subject-${periodIndex}-${subjectIndex}`}
                                  defaultOpen={periodIndex === 0 && subjectIndex === 0}
                                  className="overflow-hidden rounded-md border border-border bg-background/40"
                                >
                                  <div className="flex items-center gap-2 bg-muted/20 px-3 py-2">
                                    <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-2.5 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30">
                                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
                                      <span className="shrink-0 text-[11px] text-muted-foreground">
                                        {t('examSubjectNumber', { number: subjectIndex + 1 })}
                                      </span>
                                      <span className="truncate text-xs font-medium text-foreground">
                                        {subject.name || t('examUnnamedSubject')}
                                      </span>
                                      <span className="ml-auto hidden shrink-0 text-[11px] text-muted-foreground sm:inline">
                                        {t('examPartCount', { count: subject.parts.length })}
                                      </span>
                                    </CollapsibleTrigger>
                                    {period.subjects.length > 1 && (
                                      <Button
                                        type="button"
                                        onClick={() => removeSubject(periodIndex, subjectIndex)}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                        aria-label={t('examRemoveSubjectNumber', {
                                          number: subjectIndex + 1
                                        })}
                                        title={t('examRemoveSubject')}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </div>

                                  <CollapsibleContent className="border-t border-border">
                                    <div className="space-y-4 p-4">
                                      <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                          <Label
                                            htmlFor={`subject-name-${periodIndex}-${subjectIndex}`}
                                            className="text-xs"
                                          >
                                            {t('subjectName')}
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
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label
                                            htmlFor={`subject-duration-${periodIndex}-${subjectIndex}`}
                                            className="text-xs"
                                          >
                                            {t('duration')}
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
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label
                                            htmlFor={`subject-submitSecond-${periodIndex}-${subjectIndex}`}
                                            className="text-xs"
                                          >
                                            {t('submitSecond')}
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
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label
                                            htmlFor={`subject-note-${periodIndex}-${subjectIndex}`}
                                            className="text-xs"
                                          >
                                            {t('subjectNote')}
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
                                          />
                                        </div>
                                      </div>

                                      <div className="grid gap-3 md:grid-cols-2">
                                        <ToggleField
                                          id={`calculatorEnabled-${periodIndex}-${subjectIndex}`}
                                          label={t('calculatorEnabled')}
                                          checked={subject.calculatorEnabled}
                                          onCheckedChange={(checked) =>
                                            handleInputChange(
                                              `periods[${periodIndex}].subjects[${subjectIndex}].calculatorEnabled`,
                                              checked
                                            )
                                          }
                                        />
                                        <ToggleField
                                          id={`showScore-${periodIndex}-${subjectIndex}`}
                                          label={t('showScore')}
                                          checked={subject.showScore}
                                          onCheckedChange={(checked) =>
                                            handleInputChange(
                                              `periods[${periodIndex}].subjects[${subjectIndex}].showScore`,
                                              checked
                                            )
                                          }
                                        />
                                      </div>

                                      <div className="overflow-hidden rounded-md border border-border">
                                        <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/20 px-3 py-2">
                                          <h5 className="text-xs font-semibold text-foreground">
                                            {t('parts')}
                                          </h5>
                                          <Button
                                            type="button"
                                            onClick={() => addPart(periodIndex, subjectIndex)}
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 gap-1.5 text-xs"
                                          >
                                            <Plus className="h-3.5 w-3.5" /> {t('addPart')}
                                          </Button>
                                        </div>
                                        {subject.parts.map((part, partIndex) => (
                                          <div
                                            key={`part-${periodIndex}-${subjectIndex}-${partIndex}`}
                                            className="space-y-3 border-b border-border p-3 last:border-b-0"
                                          >
                                            <div className="flex items-center justify-between gap-3">
                                              <span className="text-[11px] font-medium text-muted-foreground">
                                                {t('examPartNumber', { number: partIndex + 1 })}
                                              </span>
                                              {subject.parts.length > 1 && (
                                                <Button
                                                  type="button"
                                                  onClick={() =>
                                                    removePart(periodIndex, subjectIndex, partIndex)
                                                  }
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-7 gap-1 px-2 text-[11px] text-muted-foreground hover:text-destructive"
                                                >
                                                  <Trash2 className="h-3 w-3" /> {t('remove')}
                                                </Button>
                                              )}
                                            </div>
                                            <div className="grid gap-3 md:grid-cols-2">
                                              <div className="space-y-2">
                                                <Label
                                                  htmlFor={`part-name-${periodIndex}-${subjectIndex}-${partIndex}`}
                                                  className="text-xs"
                                                >
                                                  {t('partName')}
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
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label
                                                  htmlFor={`part-note-${periodIndex}-${subjectIndex}-${partIndex}`}
                                                  className="text-xs"
                                                >
                                                  {t('partNote')}
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
                                                />
                                              </div>
                                            </div>
                                            <div className="grid gap-3 md:grid-cols-2">
                                              <ToggleField
                                                id={`optionRandomized-${periodIndex}-${subjectIndex}-${partIndex}`}
                                                label={t('optionRandomized')}
                                                checked={part.optionRandomized}
                                                onCheckedChange={(checked) =>
                                                  handleInputChange(
                                                    `periods[${periodIndex}].subjects[${subjectIndex}].parts[${partIndex}].optionRandomized`,
                                                    checked
                                                  )
                                                }
                                              />
                                              <ToggleField
                                                id={`questionRandomized-${periodIndex}-${subjectIndex}-${partIndex}`}
                                                label={t('questionRandomized')}
                                                checked={part.questionRandomized}
                                                onCheckedChange={(checked) =>
                                                  handleInputChange(
                                                    `periods[${periodIndex}].subjects[${subjectIndex}].parts[${partIndex}].questionRandomized`,
                                                    checked
                                                  )
                                                }
                                              />
                                            </div>
                                          </div>
                                        ))}
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
            )}

            {activeStep === 'rules' && (
              <div className="space-y-7">
                <section className="space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-foreground">{t('examRulesTitle')}</h3>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {t('examRulesDescription')}
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="project-faceDiff" className="text-xs">
                        {t('examSignInMode')}
                      </Label>
                      <Select
                        value={String(config.project.faceDiff)}
                        onValueChange={(value) =>
                          handleInputChange('project.faceDiff', parseInt(value))
                        }
                      >
                        <SelectTrigger id="project-faceDiff" className="w-full">
                          <SelectValue placeholder={t('examSignInMode')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">{t('examSignInMode1')}</SelectItem>
                          <SelectItem value="2">{t('examSignInMode2')}</SelectItem>
                          <SelectItem value="3">{t('examSignInMode3')}</SelectItem>
                          <SelectItem value="4">{t('examSignInMode4')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project-lateSecond" className="text-xs">
                        {t('lateSecond')}
                      </Label>
                      <Input
                        id="project-lateSecond"
                        type="number"
                        value={config.project.lateSecond}
                        onChange={(e) =>
                          handleInputChange('project.lateSecond', parseInt(e.target.value))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <ToggleField
                      id="fixedPosition"
                      label={t('fixedPosition')}
                      checked={config.project.fixedPosition}
                      onCheckedChange={(checked) =>
                        handleInputChange('project.fixedPosition', checked)
                      }
                    />
                    <ToggleField
                      id="offlineMode"
                      label={t('offlineMode')}
                      checked={config.project.offlineMode}
                      onCheckedChange={(checked) =>
                        handleInputChange('project.offlineMode', checked)
                      }
                    />
                    <ToggleField
                      id="useMultipleRooms"
                      label={t('useMultipleRooms')}
                      checked={config.useMultipleRooms}
                      onCheckedChange={(checked) => handleInputChange('useMultipleRooms', checked)}
                    />
                  </div>
                </section>

                <section className="space-y-4 border-t border-border pt-5">
                  <div>
                    <h3 className="text-xs font-semibold text-foreground">{t('examNotesTitle')}</h3>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {t('examNotesDescription')}
                    </p>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="project-requirement" className="text-xs">
                        {t('requirement')}
                      </Label>
                      <Textarea
                        id="project-requirement"
                        value={config.project.requirement}
                        onChange={(e) => handleInputChange('project.requirement', e.target.value)}
                        className="min-h-28 resize-y"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project-admissionCardRequirement" className="text-xs">
                        {t('admissionCardRequirement')}
                      </Label>
                      <Textarea
                        id="project-admissionCardRequirement"
                        value={config.project.admissionCardRequirement}
                        onChange={(e) =>
                          handleInputChange('project.admissionCardRequirement', e.target.value)
                        }
                        className="min-h-28 resize-y"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-note" className="text-xs">
                      {t('note')}
                    </Label>
                    <Textarea
                      id="project-note"
                      value={config.project.note}
                      onChange={(e) => handleInputChange('project.note', e.target.value)}
                      className="min-h-24 resize-y"
                    />
                  </div>
                </section>
              </div>
            )}
          </PanelBody>
          <footer className="flex items-center justify-between gap-3 border-t border-border bg-muted/20 px-5 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={activeStepIndex === 0}
              onClick={() => setActiveStep(examSteps[activeStepIndex - 1].id)}
              className="gap-1.5"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> {t('previous')}
            </Button>
            {activeStepIndex < examSteps.length - 1 ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setActiveStep(examSteps[activeStepIndex + 1].id)}
                className="gap-1.5"
              >
                {t('next')} <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <span className="text-right text-[11px] text-muted-foreground">
                {t('examReviewHint')}
              </span>
            )}
          </footer>
        </Panel>

        <aside className="min-w-0 space-y-4">
          <Panel>
            <PanelHeader
              title={t('examSummaryTitle')}
              description={t('examSummaryDescription')}
              action={<StatusDot tone="active" />}
            />
            <PanelBody className="space-y-4 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {config.project.name || t('examUnnamedExam')}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {config.project.shortName || t('examShortNameEmpty')} · {examTypeLabel}
                </p>
              </div>
              <div className="grid grid-cols-3 divide-x divide-border rounded-md border border-border bg-muted/20 py-3">
                {summaryStats.map((stat) => (
                  <div key={stat.label} className="px-2 text-center">
                    <p className="text-lg font-semibold tabular-nums text-foreground">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
              <dl className="divide-y divide-border/70">
                <DataRow label={t('startTime')} value={config.project.startAt || '--'} />
                <DataRow label={t('endTime')} value={config.project.endAt || '--'} />
                <DataRow
                  label={t('apiBaseUrl')}
                  value={config.apiBaseUrl || t('examNotConfigured')}
                />
                <DataRow label={t('token')} value={tokenPreview} />
                <DataRow label={t('examMultipleRooms')} value={multiRoomLabel} />
              </dl>
              <div className="border-t border-border pt-3">
                <p className="text-[11px] font-medium text-muted-foreground">{t('note')}</p>
                <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-foreground">
                  {notePreview}
                </p>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              title={t('examCreateAndLogs')}
              description={t('examCreateAndLogsDescription')}
              action={
                <span
                  className={cn(
                    'flex items-center gap-2 text-[11px] font-medium',
                    creationStatusColor
                  )}
                >
                  <StatusDot tone={isExamCreated ? 'success' : isLoading ? 'active' : 'neutral'} />
                  {creationStatus}
                </span>
              }
            />
            <PanelBody className="space-y-4 p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{t('examTaskStatus')}</span>
                  <span className={creationStatusColor}>{creationStatus}</span>
                </div>
                <Progress
                  value={creationProgress}
                  className="h-1 rounded-none bg-muted [&>div]:bg-primary"
                />
              </div>

              <div className="grid gap-2">
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> {t('creatingExam')}
                    </>
                  ) : isExamCreated ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> {t('createNewExam')}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> {t('createExam')}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={showLogViewer ? closeLogViewer : (): void => setShowLogViewer(true)}
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                >
                  <FileSearch className="h-3.5 w-3.5" />
                  {showLogViewer
                    ? t('examHideLog')
                    : isLoading
                      ? t('examViewLiveLog')
                      : t('examViewLog')}
                </Button>
              </div>

              {isExamCreated && (
                <Notice
                  tone="success"
                  title={t('examCreationComplete')}
                  description={t('examCreationSuccessDescription')}
                />
              )}

              {showLogViewer ? (
                <div className="border-t border-border pt-3">
                  <p className="mb-2 text-[11px] font-medium text-muted-foreground">
                    {t('examLiveOutput')}
                  </p>
                  <LogViewer />
                </div>
              ) : (
                <EmptyState
                  icon={Terminal}
                  title={t('examLogCollapsed')}
                  description={t('examLogCollapsedDescription')}
                  className="min-h-[160px] border-dashed bg-muted/20 px-3 py-5"
                />
              )}
            </PanelBody>
          </Panel>
        </aside>
      </div>
    </div>
  )
}

export default ExamCreationTool
