/**
 * Author: Libra
 * Date: 2024-10-07 01:05:19
 * LastEditors: Libra
 * Description: Progress组件
 */
import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@renderer/lib/utils'

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    className?: string
    value: number
    max?: number
  }
>(({ className, value = 0, max = 100, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      'relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800',
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-blue-500 dark:bg-blue-400 transition-all"
      style={{ transform: `translateX(-${100 - (value / max) * 100}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
