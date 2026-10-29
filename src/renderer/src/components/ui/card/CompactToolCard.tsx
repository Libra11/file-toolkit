import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@renderer/lib/utils'

interface CompactToolCardProps {
  icon: ReactNode
  title: string
  description: string
  onClick?: () => void
  className?: string
  iconColor?: string
  layout?: 'grid' | 'list'
  meta?: string
}

export default function CompactToolCard({
  icon,
  title,
  description,
  onClick,
  className,
  iconColor = 'text-primary',
  layout = 'grid',
  meta
}: CompactToolCardProps): JSX.Element {
  const isList = layout === 'list'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'group relative w-full rounded-lg border border-border bg-card text-left transition-colors hover:border-primary/30 hover:bg-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-default disabled:hover:border-border disabled:hover:bg-card',
        isList ? 'flex items-center gap-3 p-3' : 'min-h-[148px] p-4',
        className
      )}
    >
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-md border border-border bg-muted/60',
          isList ? 'h-9 w-9' : 'h-10 w-10',
          iconColor
        )}
      >
        {icon}
      </span>

      <span className={cn('block min-w-0', isList ? 'flex-1 pr-5' : 'mt-4 pr-4')}>
        <span className="block truncate text-xs font-semibold text-foreground">{title}</span>
        <span
          className={cn(
            'block leading-relaxed text-muted-foreground',
            isList ? 'mt-0.5 line-clamp-1 text-[11px]' : 'mt-1.5 line-clamp-2 text-xs'
          )}
        >
          {description}
        </span>
        {!isList && meta && (
          <span className="mt-3 block text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">
            {meta}
          </span>
        )}
      </span>

      <ArrowUpRight
        className={cn(
          'h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary',
          isList ? 'absolute right-3 top-1/2 -translate-y-1/2' : 'absolute right-4 top-4'
        )}
        strokeWidth={1.7}
      />
    </button>
  )
}
