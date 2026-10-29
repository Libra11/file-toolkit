import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@renderer/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium leading-4 transition-colors',
  {
    variants: {
      variant: {
        default: 'border-primary/20 bg-primary/[0.08] text-primary',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-destructive/20 bg-destructive/[0.07] text-destructive',
        outline: 'border-border bg-transparent text-muted-foreground'
      }
    },
    defaultVariants: { variant: 'default' }
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <div className={cn(badgeVariants({ variant }), className)} ref={ref} {...props} />
  )
)
Badge.displayName = 'Badge'
export { Badge, badgeVariants }
