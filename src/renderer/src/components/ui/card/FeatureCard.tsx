/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 特性卡片组件
 */
import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@renderer/lib/utils'

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  gradient?: string
  onClick?: () => void
  active?: boolean
  className?: string
}

export default function FeatureCard({
  icon,
  title,
  description,
  gradient = 'from-blue-500 to-violet-500',
  onClick,
  active = false,
  className
}: FeatureCardProps): JSX.Element {
  return (
    <motion.div
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      whileTap={{ y: 0, transition: { duration: 0.2 } }}
      className={cn(
        'relative overflow-hidden rounded-xl p-px cursor-pointer',
        active
          ? `bg-gradient-to-r ${gradient}`
          : 'bg-slate-200 dark:bg-slate-800 hover:bg-gradient-to-r hover:shadow-md hover:shadow-slate-200/10 dark:hover:shadow-slate-800/20',
        `hover:${gradient}`,
        className
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          'relative flex flex-col space-y-4 rounded-xl p-5 h-full z-20',
          active ? 'bg-white/10 backdrop-blur-xl' : 'bg-white dark:bg-slate-900'
        )}
      >
        <div
          className={cn(
            'p-3 rounded-full w-12 h-12 flex items-center justify-center',
            active
              ? 'bg-white/20 text-white'
              : `bg-gradient-to-r ${gradient} bg-clip-text text-transparent`
          )}
        >
          {icon}
        </div>

        <div className="space-y-2">
          <h3
            className={cn(
              'font-bold text-lg',
              active ? 'text-white' : 'text-slate-900 dark:text-slate-100'
            )}
          >
            {title}
          </h3>
          <p
            className={cn(
              'text-sm',
              active ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
            )}
          >
            {description}
          </p>
        </div>

        {active && (
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-violet-500/20 blur-xl" />
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/5 to-transparent" />
          </div>
        )}
      </div>
    </motion.div>
  )
}
