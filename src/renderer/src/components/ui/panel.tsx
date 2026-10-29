import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@renderer/lib/utils'

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-card text-card-foreground',
        className
      )}
      {...props}
    />
  )
}

interface PanelHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  eyebrow?: ReactNode
}

export function PanelHeader({
  title,
  description,
  action,
  eyebrow,
  className,
  ...props
}: PanelHeaderProps): JSX.Element {
  return (
    <header
      className={cn(
        'flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4',
        className
      )}
      {...props}
    >
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            {eyebrow}
          </div>
        )}
        <h2 className="text-sm font-semibold tracking-[-0.01em] text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>
  )
}

export function PanelBody({ className, ...props }: HTMLAttributes<HTMLDivElement>): JSX.Element {
  return <div className={cn('p-5', className)} {...props} />
}

export function Field({
  label,
  hint,
  children,
  className
}: {
  label: ReactNode
  hint?: ReactNode
  children: ReactNode
  className?: string
}): JSX.Element {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium text-foreground">{label}</span>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

export function DataRow({
  label,
  value,
  className
}: {
  label: ReactNode
  value: ReactNode
  className?: string
}): JSX.Element {
  return (
    <div className={cn('flex items-start justify-between gap-4 py-2 text-xs', className)}>
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-all text-right font-medium text-foreground">{value}</dd>
    </div>
  )
}
