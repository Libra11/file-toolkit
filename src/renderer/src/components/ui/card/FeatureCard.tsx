import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
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
  onClick,
  active = false,
  className
}: FeatureCardProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-pressed={active}
      className={cn(
        'group flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-default',
        active
          ? 'border-primary/35 bg-accent/60'
          : 'border-border bg-card hover:border-input hover:bg-muted/35',
        className
      )}
    >
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-md border',
          active
            ? 'border-primary/20 bg-card text-primary'
            : 'border-border bg-muted/60 text-muted-foreground group-hover:text-primary'
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold tracking-[-0.01em] text-foreground">
          {title}
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
          {description}
        </span>
      </span>
      <ArrowUpRight
        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-primary"
        strokeWidth={1.7}
      />
    </button>
  )
}
