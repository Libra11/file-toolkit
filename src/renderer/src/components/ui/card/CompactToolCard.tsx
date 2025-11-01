/*
 * @Author: Libra
 * @Date: 2025-01-09
 * @LastEditors: Libra
 * @Description: 紧凑型工具卡片组件
 */
import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { cn } from '@renderer/lib/utils'

interface CompactToolCardProps {
  icon: ReactNode
  title: string
  description: string
  onClick?: () => void
  className?: string
  iconColor?: string
}

export default function CompactToolCard({
  icon,
  title,
  description,
  onClick,
  className,
  iconColor = 'text-blue-500'
}: CompactToolCardProps): JSX.Element {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-xl border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-slate-50/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700/60 dark:bg-slate-800/60 dark:hover:bg-slate-700/60 dark:focus-visible:ring-indigo-500 dark:focus-visible:ring-offset-slate-900',
        className
      )}
    >
      <div className="flex items-center space-x-3 p-4">
        {/* 图标 */}
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
            `bg-${iconColor.split('-')[1]}-100 dark:bg-${iconColor.split('-')[1]}-900/20 ${iconColor}`
          )}
        >
          {icon}
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-slate-900 dark:text-white text-sm truncate">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {description}
          </p>
        </div>

        {/* 箭头 */}
        <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
      </div>
    </motion.div>
  )
}
