/**
 * Author: Libra
 * Date: 2025-04-28 15:45:00
 * LastEditors: Libra
 * Description: Word转Excel工具组件
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Card, CardContent } from '@renderer/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { toast } from '@renderer/components/ui/toast'
import { ListChecks, CheckSquare, FileText, FileSpreadsheet, Sparkles } from 'lucide-react'
import ExcelPreview from '@renderer/components/ExcelPreview'

// 导入xlsx库
import * as XLSX from 'xlsx'

// 渐入动画配置
const fadeInAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
}

const WordToExcelTool = (): JSX.Element => {
  const { t } = useTranslation()

  // 文件名
  const [fileName, setFileName] = useState<string>('')
  // 答案匹配规则
  const [answer, setAnswer] = useState<string>('')
  // 原始数据
  const [oriData, setOriData] = useState<string>('')
  // 预览数据
  const [sheetData, setSheetData] = useState<string[][]>([])
  // 显示预览对话框
  const [showPreview, setShowPreview] = useState<boolean>(false)
  // 悬停按钮
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)

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
      return item.split(answer ? new RegExp(`${answer}`, 'gm') : null) || [item]
    })
  }

  // 将文本转换为填空题格式
  const transformData3 = (text: string): string[][] => {
    text = text
      .replace(/^(\d+)[、．．\s](\.?)/gm, '$1.')
      .replace(/[\uFF08-\uFF09]/g, (match) => (match === '\uFF08' ? '(' : ')'))
      .replace(/_{2,}/g, '()')

    const questionArr = text.split(/^\d+\.+/gm).slice(1)
    const reg = /\((.*?)\)/g

    return questionArr.map((item) => {
      let match
      const res = [item.replace(reg, '(  )')]
      const matches = []

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
        description: '请输入原始数据'
      })
      return
    }

    let data = transformData(oriData)

    if (answer) {
      const maxLen = Math.max(...data.map((item) => item.length)) - 1
      data = data.map((item) => {
        const answers = item.pop() || ''
        while (item.length < maxLen) {
          item.push('')
        }
        item.push(answers)
        return item
      })
    }

    setSheetData(data)
    setShowPreview(true)
  }

  // 处理判断题导出
  const handleTrueFalse = (): void => {
    if (!oriData.trim()) {
      toast.warning({
        title: t('originalData'),
        description: '请输入原始数据'
      })
      return
    }

    const data = transformData2(oriData).map((item) =>
      answer ? [item[0], '正确', '错误', item[1] || ''] : [item[0], '正确', '错误']
    )

    setSheetData(data)
    setShowPreview(true)
  }

  // 处理填空题导出
  const handleFillBlank = (): void => {
    if (!oriData.trim()) {
      toast.warning({
        title: t('originalData'),
        description: '请输入原始数据'
      })
      return
    }

    const data = transformData3(oriData)
    setSheetData(data)
    setShowPreview(true)
  }

  // 导出到Excel
  const exportToExcel = (): void => {
    try {
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData)
      XLSX.utils.book_append_sheet(workbook, worksheet, 'All Data')
      XLSX.writeFile(workbook, fileName ? `${fileName}.xlsx` : '试卷.xlsx')

      toast.success({
        title: '导出成功',
        description: '文件已成功导出'
      })
      setShowPreview(false)
    } catch (error) {
      console.error('导出Excel失败:', error)
      toast.error({
        title: '导出失败',
        description: '请检查xlsx库是否正确安装'
      })
    }
  }

  // 获取按钮样式
  const getButtonStyle = (type: string): string => {
    const baseStyle = 'gap-2 transition-all duration-300 font-medium shadow-sm'
    const isHovered = hoveredButton === type

    switch (type) {
      case 'multiple':
        return `${baseStyle} bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white ${isHovered ? 'shadow-lg scale-105' : ''}`
      case 'trueFalse':
        return `${baseStyle} bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white ${isHovered ? 'shadow-lg scale-105' : ''}`
      case 'fillBlank':
        return `${baseStyle} bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white ${isHovered ? 'shadow-lg scale-105' : ''}`
      default:
        return baseStyle
    }
  }

  return (
    <>
      <motion.div
        className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-6 shadow-2xl shadow-blue-900/10 backdrop-blur-sm transition-all duration-500 dark:border-white/10 dark:bg-slate-900/60"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.45 }}
      >
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-white/50 to-transparent dark:from-blue-900/40 dark:via-slate-900" />
        <div className="space-y-6">
          <div className="flex flex-col gap-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:from-blue-900/50 dark:to-indigo-900/50 dark:text-blue-200">
              <FileSpreadsheet className="h-4 w-4" />
              {t('wordToExcel')}
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('wordToExcel')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('wordToExcelDescription')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-blue-100/70 bg-blue-50/70 px-4 py-3 text-sm text-blue-700 shadow-inner dark:border-blue-800/60 dark:bg-blue-900/20 dark:text-blue-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-blue-500 shadow-sm dark:bg-white/10 dark:text-blue-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-base font-semibold text-slate-900 dark:text-white">{t('wordToExcelTipTitle')}</p>
              <p className="text-xs leading-relaxed text-blue-600/90 dark:text-blue-200">
                {t('wordToExcelTipDescription')}
              </p>
            </div>
          </div>

          <Card className="overflow-hidden rounded-3xl border border-blue-100/70 bg-white/95 shadow-xl shadow-blue-900/10 dark:border-blue-800/40 dark:bg-slate-900/60">
            <CardContent className="space-y-6 px-6 pt-6 pb-6">
              <AnimatePresence>
                <motion.div
                  key="fileConfig"
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  {...fadeInAnimation}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-blue-500" />
                      {t('generateFileName')}
                    </label>
                    <Input
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder={t('fileNamePlaceholder')}
                      className="bg-slate-50 dark:bg-slate-800/50 focus-visible:ring-blue-500 border-blue-100 dark:border-blue-800/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <CheckSquare className="h-3.5 w-3.5 text-blue-500" />
                      {t('answerMatching')}
                    </label>
                    <Input
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder={t('answerMatchingPlaceholder')}
                      className="bg-slate-50 dark:bg-slate-800/50 focus-visible:ring-blue-500 border-blue-100 dark:border-blue-800/30"
                    />
                  </div>
                </motion.div>

                <motion.div
                  key="textareaSection"
                  className="space-y-2"
                  {...fadeInAnimation}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-blue-500" />
                    {t('originalData')}
                  </label>
                  <Textarea
                    value={oriData}
                    onChange={(e) => setOriData(e.target.value)}
                    placeholder={t('originalData')}
                    className="min-h-[300px] bg-slate-50 dark:bg-slate-800/50 focus-visible:ring-blue-500 border-blue-100 dark:border-blue-800/30 resize-none shadow-inner"
                  />
                </motion.div>

                <motion.div
                  key="buttonSection"
                  className="flex flex-wrap gap-3 pt-2"
                  {...fadeInAnimation}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={handleMultipleChoice}
                      className={getButtonStyle('multiple')}
                      onMouseEnter={() => setHoveredButton('multiple')}
                      onMouseLeave={() => setHoveredButton(null)}
                    >
                      <ListChecks size={18} />
                      {t('multipleChoice')}
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={handleTrueFalse}
                      className={getButtonStyle('trueFalse')}
                      onMouseEnter={() => setHoveredButton('trueFalse')}
                      onMouseLeave={() => setHoveredButton(null)}
                    >
                      <CheckSquare size={18} />
                      {t('trueFalse')}
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={handleFillBlank}
                      className={getButtonStyle('fillBlank')}
                      onMouseEnter={() => setHoveredButton('fillBlank')}
                      onMouseLeave={() => setHoveredButton(null)}
                    >
                      <FileText size={18} />
                      {t('fillBlank')}
                    </Button>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* 预览对话框 */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl bg-white dark:bg-slate-800/95 border border-blue-100 dark:border-blue-800/30">
          <DialogHeader>
            <DialogTitle className="text-blue-700 dark:text-blue-400 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              {t('previewResult')}
            </DialogTitle>
            <DialogDescription>{t('previewResult')}</DialogDescription>
          </DialogHeader>

          <div className="py-4 border border-slate-100 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 shadow-inner">
            <ExcelPreview data={sheetData} />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
              className="border-blue-200 hover:bg-blue-50 dark:border-blue-800/30 dark:hover:bg-blue-900/20"
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={exportToExcel}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md"
            >
              {t('export')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default WordToExcelTool
