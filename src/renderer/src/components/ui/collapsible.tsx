/**
 * Author: Libra
 * Date: 2025-04-24 10:10:16
 * LastEditors: Libra
 * Description: 可折叠组件
 */
import * as React from 'react'
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'
import { ChevronDown } from 'lucide-react'
import { cn } from '@renderer/lib/utils'

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger> & {
    className?: string
    iconClassName?: string
    showIcon?: boolean
  }
>(({ className, children, iconClassName, showIcon = true, ...props }, ref) => (
  <CollapsiblePrimitive.Trigger
    ref={ref}
    className={cn(
      'flex items-center justify-between w-full rounded-md px-4 py-2 text-sm font-medium transition-all hover:bg-muted',
      className
    )}
    {...props}
  >
    <span>{children}</span>
    {showIcon && (
      <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', iconClassName)} />
    )}
  </CollapsiblePrimitive.Trigger>
))
CollapsibleTrigger.displayName = CollapsiblePrimitive.Trigger.displayName

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content> & {
    className?: string
  }
>(({ className, children, ...props }, ref) => (
  <CollapsiblePrimitive.Content
    ref={ref}
    className={cn(
      'overflow-hidden text-sm transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down',
      className
    )}
    {...props}
  >
    <div className={cn('p-4', className)}>{children}</div>
  </CollapsiblePrimitive.Content>
))
CollapsibleContent.displayName = CollapsiblePrimitive.Content.displayName

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
