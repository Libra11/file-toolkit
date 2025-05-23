/**
 * Author: Libra
 * Date: 2025-04-28 15:30:00
 * LastEditors: Libra
 * Description: Excel表格预览组件
 */
import { useRef, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Button } from '@renderer/components/ui/button'
import { toast } from '@renderer/components/ui/toast'
import { Copy, CheckCircle2 } from 'lucide-react'

interface ExcelPreviewProps {
  data: string[][]
}

interface TableInfo {
  type: string
  maxCols: number
  hasAnswer: boolean
  normalizedData: string[][]
}

const ExcelPreview = ({ data }: ExcelPreviewProps): JSX.Element => {
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

    // 判断题特征检测
    if (
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
  }, [data])

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
    hasAnswer: boolean
  ): string => {
    if (index === 0) return t('questionContent', '题目内容')

    // 如果是最后一列，且有答案标记
    if (hasAnswer && index === maxCols - 1) {
      return t('answer', '答案')
    }

    switch (type) {
      case 'trueFalse':
        if (index === 1) return t('trueOption', '正确')
        if (index === 2) return t('falseOption', '错误')
        return `${t('column', '列')} ${index}`

      case 'fillBlank':
        return index > 0 ? `${t('answer', '答案')} ${index}` : t('answer', '答案')

      case 'multipleChoice':
      default:
        // 如果选项数超过26个（超过Z），则使用AA, AB...
        if (index <= 26) {
          return `${t('option', '选项')} ${String.fromCharCode(64 + index)}`
        } else {
          const first = String.fromCharCode(64 + Math.floor((index - 1) / 26))
          const second = String.fromCharCode(64 + (((index - 1) % 26) + 1))
          return `${t('option', '选项')} ${first}${second}`
        }
    }
  }

  // 判断单元格是否为答案单元格
  const isAnswerCell = (
    rowIndex: number,
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

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-slate-700 dark:text-slate-300 flex items-center gap-2 bg-slate-100/70 dark:bg-slate-700/30 px-3 py-1.5 rounded-lg shadow-sm">
          <span className="text-sm font-medium">{t('totalQuestions')}</span>{' '}
          <span className="text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
            {data.length}
          </span>{' '}
          <span className="text-sm font-medium">{t('questionCount')}</span>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={copyTable}
            className={`flex items-center gap-2 transition-all duration-300 ${
              isCopied
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
            } text-white shadow-md`}
          >
            {isCopied ? <CheckCircle2 size={16} className="animate-pulse" /> : <Copy size={16} />}
            {isCopied ? t('tableCopied') : t('copyTable')}
          </Button>
        </motion.div>
      </div>

      <div className="overflow-auto max-h-[500px] rounded-lg border border-slate-200 dark:border-slate-700 shadow-md bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
        <table ref={tableRef} className="w-full border-collapse table-fixed">
          <colgroup>
            {Array.from({ length: tableInfo.maxCols }).map((_, index) => (
              <col
                key={`col-${index}`}
                className={
                  index === 0
                    ? 'w-5/12' // 第一列占42%宽度
                    : tableInfo.hasAnswer && index === tableInfo.maxCols - 1
                      ? 'w-1/12' // 答案列较窄
                      : '' // 其他列自适应
                }
              />
            ))}
          </colgroup>
          <thead className="sticky top-0 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-900/30 dark:to-indigo-900/30 backdrop-blur-sm">
            <tr>
              {Array.from({ length: tableInfo.maxCols }).map((_, index) => (
                <th
                  key={`header-${index}`}
                  className="py-3 px-4 text-left text-sm font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700"
                >
                  {getHeaderTitle(index, tableInfo.maxCols, tableInfo.type, tableInfo.hasAnswer)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableInfo.normalizedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`
                  transition-colors duration-150 hover:bg-blue-50/50 dark:hover:bg-blue-900/20
                  ${rowIndex % 2 === 0 ? 'bg-slate-50/70 dark:bg-slate-700/30' : 'bg-white/70 dark:bg-slate-800/20'}
                `}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`
                      border-b border-slate-200 dark:border-slate-700 p-3 text-slate-700 dark:text-slate-300 break-all
                      ${cellIndex === 0 ? 'font-medium' : ''} 
                      ${cellIndex === 0 ? 'whitespace-normal break-words' : 'whitespace-normal'}
                      ${isAnswerCell(rowIndex, cellIndex, tableInfo.maxCols, tableInfo.type, tableInfo.hasAnswer) ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}
                    `}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <motion.div
        className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        {t('tipMessage', '提示：可以直接复制表格并粘贴到Excel中')}
      </motion.div>
    </div>
  )
}

export default ExcelPreview
