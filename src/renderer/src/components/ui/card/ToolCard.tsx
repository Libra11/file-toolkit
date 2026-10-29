import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { t } from 'i18next'
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
  iconColor = 'text-primary',
  badge
}: ToolCardProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'group flex w-full flex-col rounded-lg border border-border bg-card p-5 text-left transition-colors hover:border-primary/30 hover:bg-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-default disabled:hover:border-border disabled:hover:bg-card',
        className
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted/60',
            iconColor
          )}
        >
          {icon}
        </span>
        {badge && (
          <span className="rounded border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {badge}
          </span>
        )}
      </span>

      <span className="mt-4 block text-base font-semibold tracking-[-0.02em] text-foreground">
        {title}
      </span>
      <span className="mt-1.5 block flex-1 text-xs leading-relaxed text-muted-foreground">
        {description}
      </span>

      <span
        className={cn(
          'mt-5 flex items-center justify-between border-t border-border pt-3 text-[11px] font-medium',
          onClick ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        {onClick ? t('openTool') : t('comingSoon')}
        <ArrowRight
          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
          strokeWidth={1.7}
        />
      </span>
    </button>
  )
}
