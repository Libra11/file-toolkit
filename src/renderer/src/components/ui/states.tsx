import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { AlertCircle, CheckCircle2, FileUp, Info, Loader2 } from 'lucide-react'
import { cn } from '@renderer/lib/utils'

export function EmptyState({
  icon: Icon = FileUp,
  title,
  description,
  action,
  className
}: {
  icon?: LucideIcon
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}): JSX.Element {
  return (
    <div
      className={cn(
        'flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed border-input/80 bg-muted/25 px-5 py-8 text-center',
        className
      )}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
        <Icon className="h-5 w-5" strokeWidth={1.6} />
      </div>
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Notice({
  title,
  description,
  tone = 'info',
  className,
  action
}: {
  title: ReactNode
  description?: ReactNode
  tone?: 'info' | 'success' | 'error' | 'loading'
  className?: string
  action?: ReactNode
}): JSX.Element {
  const Icon =
    tone === 'success'
      ? CheckCircle2
      : tone === 'error'
        ? AlertCircle
        : tone === 'loading'
          ? Loader2
          : Info
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-3',
        tone === 'success' && 'border-primary/25 bg-primary/[0.06]',
        tone === 'error' && 'border-destructive/25 bg-destructive/[0.06]',
        tone === 'info' && 'border-border bg-muted/40',
        tone === 'loading' && 'border-primary/25 bg-primary/[0.06]',
        className
      )}
    >
      <Icon
        className={cn(
          'mt-0.5 h-4 w-4 shrink-0 text-muted-foreground',
          (tone === 'success' || tone === 'loading') && 'text-primary',
          tone === 'error' && 'text-destructive',
          tone === 'loading' && 'animate-spin'
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground">{title}</p>
        {description && (
          <div className="mt-1 break-all text-xs leading-relaxed text-muted-foreground">
            {description}
          </div>
        )}
      </div>
      {action}
    </div>
  )
}

export function StatusDot({
  tone = 'neutral',
  className
}: {
  tone?: 'neutral' | 'active' | 'success' | 'error'
  className?: string
}): JSX.Element {
  return (
    <span
      className={cn(
        'inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60',
        tone === 'active' && 'bg-primary',
        tone === 'success' && 'bg-emerald-600 dark:bg-emerald-400',
        tone === 'error' && 'bg-destructive',
        className
      )}
    />
  )
}
