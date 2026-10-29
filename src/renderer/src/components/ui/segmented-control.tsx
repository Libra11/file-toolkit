import type { LucideIcon } from 'lucide-react'
import { cn } from '@renderer/lib/utils'

export interface SegmentOption<T extends string> {
  value: T
  label: string
  icon?: LucideIcon
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
  ariaLabel
}: {
  value: T
  onChange: (value: T) => void
  options: SegmentOption<T>[]
  className?: string
  ariaLabel?: string
}): JSX.Element {
  return (
    <div
      className={cn(
        'inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-border bg-muted/60 p-1',
        className
      )}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const Icon = option.icon
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex h-8 shrink-0 items-center justify-center gap-2 rounded-md px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
              active && 'bg-card text-foreground shadow-sm ring-1 ring-border/70'
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
