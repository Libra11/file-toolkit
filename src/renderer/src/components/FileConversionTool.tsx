/**
 * Author: Libra
 * Date: 2024-10-07 01:15:57
 * LastEditors: Libra
 * Description:
 */
import { motion } from 'framer-motion'
import { Card, CardContent } from '@renderer/components/ui/card'
import ConversionForm from '@renderer/components/ConversionForm'
import { conversionCategories } from '@renderer/lib/conversionTypes'

interface FileConversionToolProps {
  activeCategory?: string
}

export default function FileConversionTool({
  activeCategory
}: FileConversionToolProps): JSX.Element {
  const fallbackCategory = conversionCategories[0]?.name ?? ''
  const resolvedCategory = activeCategory ?? fallbackCategory

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border border-slate-200/30 dark:border-slate-700/30 shadow-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
        <CardContent className="p-6 space-y-6">
          <ConversionForm categories={conversionCategories} activeCategory={resolvedCategory} />
        </CardContent>
      </Card>
    </motion.div>
  )
}
