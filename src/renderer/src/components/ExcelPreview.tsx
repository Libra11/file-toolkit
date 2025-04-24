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

const ExcelPreview = ({ data }: ExcelPreviewProps): JSX.Element => {
  const { t } = useTranslation()
  const tableRef = useRef<HTMLTableElement>(null)
  const [isCopied, setIsCopied] = useState<boolean>(false)

  // 根据数据推测题目类型
  const questionType = useMemo(() => {
    if (!data || data.length === 0) return 'unknown'

    const firstRow = data[0]
    // 检查是否为判断题（通常包含"正确"、"错误"字样）
    if (firstRow.some((cell) => cell === '正确') && firstRow.some((cell) => cell === '错误')) {
      return 'trueFalse'
    }
    // 检查是否为填空题（通常第一列之后直接是答案，没有选项A、B、C等）
    else if (firstRow.length >= 2 && firstRow.length <= 3) {
      return 'fillBlank'
    }
    // 默认为选择题
    else {
      return 'multipleChoice'
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

  // 获取表头标题
  const getHeaderTitle = (index: number): string => {
    if (index === 0) return t('questionContent', '题目内容')

    switch (questionType) {
      case 'trueFalse':
        if (index === 1) return t('trueOption', '正确')
        if (index === 2) return t('falseOption', '错误')
        if (index === 3) return t('answer', '答案')
        return `${t('column', '列')} ${index + 1}`

      case 'fillBlank':
        return index === 1 ? t('answer', '答案') : `${t('answer', '答案')} ${index}`

      case 'multipleChoice':
      default:
        return `${t('option', '选项')} ${String.fromCharCode(64 + index)}`
    }
  }

  return (
    <div className="space-y-4 p-4">
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
            {data[0]?.map((_, index) => (
              <col
                key={`col-${index}`}
                className={
                  index === 0
                    ? 'w-5/12' // 第一列占40%宽度
                    : ''
                } // 其他列自适应
              />
            ))}
          </colgroup>
          <thead className="sticky top-0 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-900/30 dark:to-indigo-900/30 backdrop-blur-sm">
            <tr>
              {data[0]?.map((_, index) => (
                <th
                  key={`header-${index}`}
                  className="py-3 px-4 text-left text-sm font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700"
                >
                  {getHeaderTitle(index)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
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
                      border-b border-slate-200 dark:border-slate-700 p-3 text-slate-700 dark:text-slate-300
                      ${cellIndex === 0 ? 'font-medium' : ''} 
                      ${cellIndex === 0 ? 'whitespace-normal break-words' : 'whitespace-normal'}
                      ${cellIndex === row.length - 1 && questionType === 'multipleChoice' ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}
                      ${questionType === 'fillBlank' && cellIndex > 0 ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}
                      ${questionType === 'trueFalse' && cellIndex === row.length - 1 ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}
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
