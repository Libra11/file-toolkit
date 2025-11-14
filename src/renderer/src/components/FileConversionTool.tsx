/**
 * Author: Libra
 * Date: 2024-10-07 01:15:57
 * LastEditors: Libra
 * Description:
 */
import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@renderer/components/ui/card'
import { useTranslation } from 'react-i18next'
import { FileType2, Sparkles } from 'lucide-react'
import ConversionForm from '@renderer/components/ConversionForm'
import { conversionCategories } from '@renderer/lib/conversionTypes'

interface FileConversionToolProps {
  activeCategory?: string
}

export default function FileConversionTool({
  activeCategory
}: FileConversionToolProps): JSX.Element {
  const { t } = useTranslation()
  const fallbackCategory = conversionCategories[0]?.name ?? ''
  const resolvedCategory = activeCategory ?? fallbackCategory

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-6 shadow-2xl shadow-blue-900/10 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/60 md:p-8">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-blue-100/60 via-white to-transparent dark:from-blue-900/25 dark:via-slate-900" />
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-100/70 px-3 py-1 text-sm font-medium text-blue-600 dark:bg-blue-900/40 dark:text-blue-200">
              <FileType2 className="h-4 w-4" />
              {t('fileConversionTool')}
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                {t('fileConversion')}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('fileConversionDescription')}
              </p>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-blue-100/70 bg-blue-50/60 p-4 text-sm text-blue-700 shadow-inner dark:border-blue-500/30 dark:bg-blue-900/20 dark:text-blue-100 md:flex-row md:items-start md:gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-blue-500 shadow-sm dark:bg-white/10 dark:text-blue-200">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold">{t('fileConversionTipTitle')}</p>
                <p className="text-xs leading-relaxed text-blue-600/80 dark:text-blue-100/80">
                  {t('fileConversionTipDescription')}
                </p>
              </div>
            </div>
          </div>

          <ConversionForm categories={conversionCategories} activeCategory={resolvedCategory} />
        </div>
      </div>
    </motion.div>
  )
}
