/*
 * @Author: Libra
 * @Date: 2025-01-09
 * @LastEditors: Libra
 * @Description: 紧凑型工具卡片组件
 */
import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
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
    <motion.button
      type="button"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-4 rounded-2xl border border-white/70 bg-white/90 px-4 py-4 text-left shadow-md shadow-indigo-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white hover:bg-white/95 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-indigo-500 dark:focus-visible:ring-offset-slate-900',
        className
      )}
    >
      <div
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white',
          iconColor
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-300 line-clamp-2">
          {description}
        </p>
      </div>
      <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300" />
    </motion.button>
  )
}
