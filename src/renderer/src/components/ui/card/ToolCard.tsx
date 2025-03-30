/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 工具卡片组件
 */
import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { cn } from '@renderer/lib/utils'

interface ToolCardProps {
  icon: ReactNode
  title: string
  description: string
  onClick?: () => void
  className?: string
  iconColor?: string
  badge?: string
}

export default function ToolCard({
  icon,
  title,
  description,
  onClick,
  className,
  iconColor = 'text-blue-500',
  badge
}: ToolCardProps): JSX.Element {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all duration-200',
        className
      )}
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              `bg-${iconColor.split('-')[1]}-100 dark:bg-${iconColor.split('-')[1]}-900/20 ${iconColor}`
            )}
          >
            {icon}
          </div>

          {badge && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              {badge}
            </span>
          )}
        </div>

        <div className="mt-5">
          <h3 className="font-semibold text-xl text-slate-900 dark:text-white">{title}</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>

        <div className="mt-5 flex items-center text-sm font-medium text-blue-600 dark:text-blue-400">
          <span className="mr-2">{onClick ? '打开工具' : '即将推出'}</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>

      {/* 底部装饰线 */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-violet-500" />
    </motion.div>
  )
}
