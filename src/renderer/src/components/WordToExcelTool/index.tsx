/**
 * Author: Libra
 * Date: 2025-04-28 15:45:00
 * LastEditors: Libra
 * Description: Word转Excel工具组件
 */
import { useState } from 'react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Panel, PanelBody, PanelHeader } from '@renderer/components/ui/panel'
import { SegmentedControl } from '@renderer/components/ui/segmented-control'
import type { SegmentOption } from '@renderer/components/ui/segmented-control'
import { EmptyState, Notice } from '@renderer/components/ui/states'
import { toast } from '@renderer/components/ui/toast'
import { CheckSquare, Download, FileSpreadsheet, FileText, ListChecks } from 'lucide-react'
import ExcelPreview from '@renderer/components/ExcelPreview'

// 导入xlsx库
import * as XLSX from 'xlsx'

const MULTIPLE_CHOICE_OPTION_COLUMNS = 8

type QuestionType = 'multipleChoice' | 'trueFalse' | 'fillBlank'

interface WordToExcelToolProps {
  onBack?: () => void
}

const WordToExcelTool: FC<WordToExcelToolProps> = (): JSX.Element => {
  const { t } = useTranslation()

  // 文件名
  const [fileName, setFileName] = useState<string>('')
  // 答案匹配规则
  const [answer, setAnswer] = useState<string>('')
  // 原始数据
  const [oriData, setOriData] = useState<string>('')
  // 预览数据
  const [sheetData, setSheetData] = useState<string[][]>([])
  // 当前是否为选择题固定列预览
  const [isMultipleChoicePreview, setIsMultipleChoicePreview] = useState<boolean>(false)
  // 显示预览
  const [showPreview, setShowPreview] = useState<boolean>(false)
  // 当前解析题型
  const [questionType, setQuestionType] = useState<QuestionType>('multipleChoice')

  const questionTypeOptions: SegmentOption<QuestionType>[] = [
    { value: 'multipleChoice', label: t('multipleChoice'), icon: ListChecks },
    { value: 'trueFalse', label: t('trueFalse'), icon: CheckSquare },
    { value: 'fillBlank', label: t('fillBlank'), icon: FileText }
  ]

  // 将文本转换为选择题格式
  const transformData = (text: string): string[][] => {
    text = text
      .replace(/^(\d+)[、．．\s](\.?)/gm, '$1.')
      .replace(/^([A-Z])[、．．\s](\.?)/gm, '$1.')
    const questionArr = text.split(/^\d+\.+/gm).slice(1)

    return questionArr.map((item) => {
      return item.split(new RegExp(answer ? `[A-Z][.]|${answer}` : '[A-Z][.]', 'gm'))
    })
  }

  // 将文本转换为判断题格式
  const transformData2 = (text: string): string[][] => {
    text = text.replace(/^(\d+)[、．．\s](\.?)/gm, '$1.')
    const questionArr = text.split(/^\d+\.+/gm).slice(1)

    return questionArr.map((item) => {
      return answer ? item.split(new RegExp(`${answer}`, 'gm')) : [item]
    })
  }

  // 将文本转换为填空题格式
  const transformData3 = (text: string): string[][] => {
    text = text
      .replace(/^(\d+)[、．．\s](\.?)/gm, '$1.')
      .replace(/[（-）]/g, (match) => (match === '（' ? '(' : ')'))
      .replace(/_{2,}/g, '()')

    const questionArr = text.split(/^\d+\.+/gm).slice(1)
    const reg = /\((.*?)\)/g

    return questionArr.map((item) => {
      let match
      const res = [item.replace(reg, '(  )')]
      const matches: string[] = []

      // 创建一个新的RegExp对象，因为全局regexp在使用exec时会记住上次匹配位置
      const regExp = new RegExp(reg)
      while ((match = regExp.exec(item)) !== null) {
        const m = match[1].replace(/\s/g, '')
        if (m) {
          matches.push(m)
        }
      }

      return [...res, ...matches]
    })
  }

  // 处理选择题导出
  const handleMultipleChoice = (): void => {
    if (!oriData.trim()) {
      toast.warning({
        title: t('originalData'),
        description: t('wordToExcelOriginalDataRequired')
      })
      return
    }

    const data = transformData(oriData).map((item) => {
      const row = [...item]
      const referenceAnswer = answer ? row.pop() || '' : ''
      const [question = '', ...options] = row
      const fixedOptions = options.slice(0, MULTIPLE_CHOICE_OPTION_COLUMNS)
      const optionCount = fixedOptions.length

      while (fixedOptions.length < MULTIPLE_CHOICE_OPTION_COLUMNS) {
        fixedOptions.push('')
      }

      return [question, ...fixedOptions, String(optionCount), referenceAnswer]
    })

    setSheetData(data)
    setIsMultipleChoicePreview(true)
    setShowPreview(true)
  }

  // 处理判断题导出
  const handleTrueFalse = (): void => {
    if (!oriData.trim()) {
      toast.warning({
        title: t('originalData'),
        description: t('wordToExcelOriginalDataRequired')
      })
      return
    }

    const data = transformData2(oriData).map((item) =>
      answer ? [item[0], '正确', '错误', item[1] || ''] : [item[0], '正确', '错误']
    )

    setSheetData(data)
    setIsMultipleChoicePreview(false)
    setShowPreview(true)
  }

  // 处理填空题导出
  const handleFillBlank = (): void => {
    if (!oriData.trim()) {
      toast.warning({
        title: t('originalData'),
        description: t('wordToExcelOriginalDataRequired')
      })
      return
    }

    const data = transformData3(oriData)
    setSheetData(data)
    setIsMultipleChoicePreview(false)
    setShowPreview(true)
  }

  const handlePreview = (): void => {
    if (questionType === 'multipleChoice') {
      handleMultipleChoice()
    } else if (questionType === 'trueFalse') {
      handleTrueFalse()
    } else {
      handleFillBlank()
    }
  }

  // 导出到Excel
  const exportToExcel = (): void => {
    try {
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData)
      XLSX.utils.book_append_sheet(workbook, worksheet, 'All Data')
      XLSX.writeFile(workbook, fileName ? `${fileName}.xlsx` : '试卷.xlsx')

      toast.success({
        title: t('wordToExcelExportSuccess'),
        description: t('wordToExcelExportSuccessDescription')
      })
      setShowPreview(false)
    } catch (error) {
      console.error('导出Excel失败:', error)
      toast.error({
        title: t('wordToExcelExportFailed'),
        description: t('wordToExcelExportFailedDescription')
      })
    }
  }

  const outputFileName = fileName ? `${fileName}.xlsx` : '试卷.xlsx'
  const sourceLineCount = oriData ? oriData.split(/\r?\n/).length : 0

  return (
    <div className="min-w-0 space-y-4 pb-6">
      <section className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg border border-border bg-card px-4 py-3 text-card-foreground">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <FileSpreadsheet className="h-4 w-4" strokeWidth={1.7} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {t('outputFile')}
            </p>
            <p
              className="mt-0.5 max-w-[280px] truncate text-sm font-semibold text-foreground"
              title={outputFileName}
            >
              {outputFileName}
            </p>
          </div>
        </div>
        <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs lg:ml-auto">
          <div className="flex items-center gap-2">
            <dt className="text-muted-foreground">{t('format')}</dt>
            <dd className="font-medium text-foreground">XLSX</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="text-muted-foreground">{t('answerMatching')}</dt>
            <dd
              className="max-w-[10rem] truncate font-medium text-foreground"
              title={answer || t('wordToExcelNotSet')}
            >
              {answer || t('wordToExcelNotSet')}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="text-muted-foreground">{t('wordToExcelOriginalContent')}</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {t('wordToExcelCharacterCount', { count: oriData.length })}
            </dd>
          </div>
        </dl>
      </section>

      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-2">
        <Panel className="min-w-0">
          <PanelHeader
            title={t('wordToExcelInputAndParsing')}
            description={t('wordToExcelInputDescription')}
          />
          <PanelBody className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-medium text-foreground">
                {t('wordToExcelQuestionType')}
              </span>
              <SegmentedControl
                value={questionType}
                onChange={setQuestionType}
                options={questionTypeOptions}
                ariaLabel={t('wordToExcelQuestionType')}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="excel-file-name" className="text-xs font-medium text-foreground">
                  {t('generateFileName')}
                </label>
                <Input
                  id="excel-file-name"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder={t('fileNamePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="excel-answer-rule" className="text-xs font-medium text-foreground">
                  {t('answerMatching')}
                </label>
                <Input
                  id="excel-answer-rule"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={t('answerMatchingPlaceholder')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="word-source-data" className="text-xs font-medium text-foreground">
                  {t('originalData')}
                </label>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {t('wordToExcelLineCount', { count: sourceLineCount })}
                </span>
              </div>
              <Textarea
                id="word-source-data"
                value={oriData}
                onChange={(e) => setOriData(e.target.value)}
                placeholder={t('originalData')}
                spellCheck={false}
                className="min-h-[340px] resize-y font-mono text-xs leading-6"
              />
            </div>

            <Notice title={t('wordToExcelTipTitle')} description={t('wordToExcelTipDescription')} />

            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {t('wordToExcelParseNotice')}
              </p>
              <Button type="button" onClick={handlePreview} className="shrink-0 gap-2">
                <FileSpreadsheet className="h-4 w-4" /> {t('wordToExcelParseAndPreview')}
              </Button>
            </div>
          </PanelBody>
        </Panel>

        <Panel className="min-w-0">
          <PanelHeader
            title={t('previewResult')}
            description={
              showPreview
                ? t('wordToExcelPreviewReadyDescription', { count: sheetData.length })
                : t('wordToExcelPreviewEmptyDescription')
            }
            action={
              <Button
                type="button"
                onClick={exportToExcel}
                disabled={!showPreview || sheetData.length === 0}
                size="sm"
                className="gap-2"
              >
                <Download className="h-3.5 w-3.5" /> {t('export')}
              </Button>
            }
          />
          <PanelBody className="min-w-0 p-0">
            {showPreview ? (
              <ExcelPreview data={sheetData} fixedMultipleChoiceLayout={isMultipleChoicePreview} />
            ) : (
              <EmptyState
                icon={FileSpreadsheet}
                title={t('wordToExcelAwaitingPreview')}
                description={t('wordToExcelAwaitingPreviewDescription')}
                className="min-h-[480px] rounded-none border-0 bg-muted/10"
              />
            )}
          </PanelBody>
        </Panel>
      </div>
    </div>
  )
}

export default WordToExcelTool
