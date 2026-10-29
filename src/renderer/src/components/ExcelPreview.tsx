/**
 * Author: Libra
 * Date: 2025-04-28 15:30:00
 * LastEditors: Libra
 * Description: Excel表格预览组件
 */
import { useRef, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/button'
import { EmptyState } from '@renderer/components/ui/states'
import { toast } from '@renderer/components/ui/toast'
import { cn } from '@renderer/lib/utils'
import { CheckCircle2, Copy, FileSpreadsheet, Info } from 'lucide-react'

interface ExcelPreviewProps {
  data: string[][]
  fixedMultipleChoiceLayout?: boolean
}

interface TableInfo {
  type: string
  maxCols: number
  hasAnswer: boolean
  normalizedData: string[][]
}

const ExcelPreview = ({
  data,
  fixedMultipleChoiceLayout = false
}: ExcelPreviewProps): JSX.Element => {
  const { t } = useTranslation()
  const tableRef = useRef<HTMLTableElement>(null)
  const [isCopied, setIsCopied] = useState<boolean>(false)

  // 根据数据分析表格结构和题目信息
  const tableInfo = useMemo((): TableInfo => {
    if (!data || data.length === 0) {
      return {
        type: 'unknown',
        maxCols: 0,
        hasAnswer: false,
        normalizedData: []
      }
    }

    // 找出最大列数
    const maxCols = Math.max(...data.map((row) => row.length))

    // 分析题目类型
    let type = 'multipleChoice'
    let hasAnswer = false

    // 固定列选择题始终包含参考答案列
    if (fixedMultipleChoiceLayout) {
      type = 'multipleChoice'
      hasAnswer = true
    }
    // 判断题特征检测
    else if (
      data.some((row) => row.some((cell) => cell === '正确') && row.some((cell) => cell === '错误'))
    ) {
      type = 'trueFalse'
      // 检查是否有答案列
      hasAnswer = data.some((row) => row.length > 3)
    }
    // 填空题特征检测
    else if (data.every((row) => row.length >= 2 && row.length <= 3)) {
      type = 'fillBlank'
      hasAnswer = true
    }
    // 选择题 - 检查是否最后一列是答案
    else {
      hasAnswer = data.some((row) => {
        const lastCell = row[row.length - 1]
        // 答案通常是单个字母或者短文本
        return lastCell && row.length > 2 && /^[A-D]$|^[A-D],|^答案/.test(lastCell)
      })
    }

    // 规范化数据，确保每行具有相同的列数
    const normalizedData = data.map((row) => {
      const newRow = [...row]
      while (newRow.length < maxCols) {
        newRow.push('')
      }
      return newRow
    })

    return {
      type,
      maxCols,
      hasAnswer,
      normalizedData
    }
  }, [data, fixedMultipleChoiceLayout])

  // 复制表格内容
  const copyTable = (): void => {
    if (tableRef.current) {
      const range = document.createRange()
      range.selectNode(tableRef.current)

      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)

        try {
          document.execCommand('copy')
          selection.removeAllRanges()
          setIsCopied(true)
          toast.success({
            title: t('tableCopied')
          })

          // 2秒后重置复制状态
          setTimeout(() => {
            setIsCopied(false)
          }, 2000)
        } catch (error) {
          console.error('复制失败:', error)
          toast.error({
            title: t('tableNotReady')
          })
        }
      }
    } else {
      toast.error({
        title: t('tableNotReady')
      })
    }
  }

  // 根据列索引和题目类型获取表头内容
  const getHeaderTitle = (
    index: number,
    maxCols: number,
    type: string,
    hasAnswer: boolean,
    fixedMultipleChoiceLayout: boolean
  ): string => {
    if (index === 0) return t('questionContent')

    if (fixedMultipleChoiceLayout) {
      if (index >= 1 && index <= 8) {
        return `${t('option')} ${String.fromCharCode(64 + index)}`
      }
      if (index === 9) return t('optionCount')
      if (index === 10) return t('referenceAnswer')
    }

    // 如果是最后一列，且有答案标记
    if (hasAnswer && index === maxCols - 1) {
      return t('answer')
    }

    switch (type) {
      case 'trueFalse':
        if (index === 1) return t('trueOption')
        if (index === 2) return t('falseOption')
        return `${t('column')} ${index}`

      case 'fillBlank':
        return index > 0 ? `${t('answer')} ${index}` : t('answer')

      case 'multipleChoice':
      default:
        // 如果选项数超过26个（超过Z），则使用AA, AB...
        if (index <= 26) {
          return `${t('option')} ${String.fromCharCode(64 + index)}`
        } else {
          const first = String.fromCharCode(64 + Math.floor((index - 1) / 26))
          const second = String.fromCharCode(64 + (((index - 1) % 26) + 1))
          return `${t('option')} ${first}${second}`
        }
    }
  }

  // 判断单元格是否为答案单元格
  const isAnswerCell = (
    colIndex: number,
    maxCols: number,
    type: string,
    hasAnswer: boolean
  ): boolean => {
    // 最后一列是答案
    if (hasAnswer && colIndex === maxCols - 1) {
      return true
    }

    // 填空题的所有非第一列都是答案
    if (type === 'fillBlank' && colIndex > 0) {
      return true
    }

    return false
  }

  const getColumnClassName = (index: number): string => {
    if (fixedMultipleChoiceLayout) {
      if (index === 0) return 'w-[360px]'
      if (index >= 1 && index <= 8) return 'w-[120px]'
      return 'w-[100px]'
    }

    if (index === 0) return 'w-5/12'
    if (tableInfo.hasAnswer && index === tableInfo.maxCols - 1) return 'w-1/12'
    return ''
  }

  const tableTypeLabel = tableInfo.type === 'unknown' ? '--' : t(tableInfo.type)

  return (
    <div className="min-w-0 max-w-full">
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-3 py-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-2 font-medium text-foreground">
              <FileSpreadsheet className="h-3.5 w-3.5 text-primary" strokeWidth={1.7} />
              {t('totalQuestions')}
              <strong className="font-semibold tabular-nums text-foreground">{data.length}</strong>
              {t('questionCount')}
            </span>
            <span aria-hidden="true" className="text-border">
              /
            </span>
            <span className="tabular-nums">
              {tableInfo.maxCols} {t('column')}
            </span>
            <span aria-hidden="true" className="text-border">
              /
            </span>
            <span>{tableTypeLabel}</span>
          </div>
          <Button
            type="button"
            onClick={copyTable}
            disabled={tableInfo.maxCols === 0}
            variant="outline"
            size="sm"
            className={cn(
              'h-8 gap-1.5 px-2.5 text-xs',
              isCopied && 'border-primary/30 text-primary'
            )}
          >
            {isCopied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {isCopied ? t('tableCopied') : t('copyTable')}
          </Button>
        </div>

        {tableInfo.maxCols > 0 ? (
          <div className="max-h-[500px] w-full max-w-full overflow-auto overscroll-contain">
            <table
              ref={tableRef}
              aria-label={t('previewResult')}
              className={cn(
                'w-full border-collapse table-fixed',
                fixedMultipleChoiceLayout && 'min-w-[1520px]',
                !fixedMultipleChoiceLayout && tableInfo.maxCols > 4 && 'min-w-[720px]'
              )}
            >
              <colgroup>
                {Array.from({ length: tableInfo.maxCols }).map((_, index) => (
                  <col key={`col-${index}`} className={getColumnClassName(index)} />
                ))}
              </colgroup>
              <thead className="sticky top-0 z-10 bg-muted">
                <tr>
                  {Array.from({ length: tableInfo.maxCols }).map((_, index) => {
                    const answerColumn = isAnswerCell(
                      index,
                      tableInfo.maxCols,
                      tableInfo.type,
                      tableInfo.hasAnswer
                    )
                    return (
                      <th
                        key={`header-${index}`}
                        scope="col"
                        className={cn(
                          'border-b border-r border-border px-3 py-2 text-left text-[11px] font-semibold leading-4 text-muted-foreground last:border-r-0',
                          answerColumn && 'bg-primary/[0.06] text-primary'
                        )}
                      >
                        {getHeaderTitle(
                          index,
                          tableInfo.maxCols,
                          tableInfo.type,
                          tableInfo.hasAnswer,
                          fixedMultipleChoiceLayout
                        )}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {tableInfo.normalizedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={cn(
                      'transition-colors hover:bg-accent/40',
                      rowIndex % 2 === 0 ? 'bg-card' : 'bg-muted/20'
                    )}
                  >
                    {row.map((cell, cellIndex) => {
                      const answerCell = isAnswerCell(
                        cellIndex,
                        tableInfo.maxCols,
                        tableInfo.type,
                        tableInfo.hasAnswer
                      )
                      return (
                        <td
                          key={cellIndex}
                          className={cn(
                            'whitespace-pre-wrap break-words border-b border-r border-border/70 px-3 py-2 align-top text-xs leading-5 text-foreground last:border-r-0',
                            cellIndex === 0 && 'font-medium',
                            answerCell && 'bg-primary/[0.035] font-medium text-primary'
                          )}
                        >
                          {cell}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={FileSpreadsheet}
            title={t('tableNotReady')}
            description={t('tipMessage')}
            className="min-h-52 rounded-none border-0 bg-card"
          />
        )}
      </div>

      <div className="flex items-start gap-1.5 px-1 pt-2 text-[11px] leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 h-3 w-3 shrink-0" />
        <span>{t('tipMessage')}</span>
      </div>
    </div>
  )
}

export default ExcelPreview
