import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@renderer/lib/utils'

const alertVariants = cva(
  'relative w-full rounded-md border px-3.5 py-3 text-xs [&>svg+div]:translate-y-[-2px] [&>svg]:absolute [&>svg]:left-3.5 [&>svg]:top-3.5 [&>svg]:h-4 [&>svg]:w-4 [&>svg~*]:pl-6',
  {
    variants: {
      variant: {
        default: 'border-border bg-muted/40 text-foreground [&>svg]:text-muted-foreground',
        destructive:
          'border-destructive/25 bg-destructive/[0.06] text-destructive [&>svg]:text-destructive',
        success: 'border-primary/25 bg-primary/[0.06] text-primary [&>svg]:text-primary'
      }
    },
    defaultVariants: { variant: 'default' }
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
))
Alert.displayName = 'Alert'
const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <h5 ref={ref} className={cn('mb-1 font-medium leading-normal', className)} {...props} />
))
AlertTitle.displayName = 'AlertTitle'
const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-xs leading-relaxed text-muted-foreground [&_p]:leading-relaxed', className)}
    {...props}
  />
))
AlertDescription.displayName = 'AlertDescription'
export { Alert, AlertTitle, AlertDescription }
