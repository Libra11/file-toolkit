import * as React from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@renderer/lib/utils'

export type ToastVariant = 'default' | 'success' | 'warning' | 'destructive'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
  dismissAllToasts: () => void
}

type ToastMessage = Omit<Toast, 'id'>
type Listener = (toast: ToastMessage) => void
let listeners: Listener[] = []

function subscribe(listener: Listener): () => void {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

function emit(toast: ToastMessage): void {
  listeners.forEach((listener) => listener(toast))
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const dismissToast = React.useCallback((id: string): void => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = React.useCallback(
    (toast: Omit<Toast, 'id'>): void => {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast = { id, ...toast }
      setToasts((prev) => [...prev, newToast])

      if (toast.duration !== 0) {
        setTimeout(() => {
          dismissToast(id)
        }, toast.duration || 3000)
      }
    },
    [dismissToast]
  )

  const dismissAllToasts = React.useCallback((): void => {
    setToasts([])
  }, [])

  React.useEffect(() => {
    return subscribe((toast) => {
      addToast(toast)
    })
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast, dismissAllToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextType {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast 必须在 ToastProvider 内使用')
  }
  return context
}

function ToastContainer(): JSX.Element {
  const { toasts } = useToast()

  if (toasts.length === 0) return <></>

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

const variantStyles: Record<ToastVariant, string> = {
  default: 'border-border bg-card',
  success: 'border-primary/30 bg-card',
  warning: 'border-input bg-secondary/60',
  destructive: 'border-destructive/30 bg-card'
}

const iconStyles: Record<ToastVariant, string> = {
  default: 'text-muted-foreground',
  success: 'text-primary',
  warning: 'text-foreground',
  destructive: 'text-destructive'
}

function ToastItem({ toast }: { toast: Toast }): JSX.Element {
  const { dismissToast } = useToast()
  const variant = toast.variant || 'default'
  const Icon =
    variant === 'success'
      ? CheckCircle2
      : variant === 'warning'
        ? AlertTriangle
        : variant === 'destructive'
          ? AlertCircle
          : Info

  return (
    <div
      role={variant === 'destructive' ? 'alert' : 'status'}
      aria-live={variant === 'destructive' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={cn(
        'pointer-events-auto rounded-md border p-3.5 text-card-foreground shadow-lg animate-in fade-in slide-in-from-bottom-2',
        variantStyles[variant]
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', iconStyles[variant])} strokeWidth={1.8} />
        <div className="min-w-0 flex-1">
          {toast.title ? <div className="text-sm font-medium leading-5">{toast.title}</div> : null}
          {toast.description ? (
            <div className="mt-1 break-words text-xs leading-5 text-muted-foreground">
              {toast.description}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={() => dismissToast(toast.id)}
          className="-mr-1 -mt-1 rounded-sm p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export const toast = {
  default: (props: Omit<Toast, 'id' | 'variant'>): void => {
    emit({ ...props, variant: 'default' })
  },
  success: (props: Omit<Toast, 'id' | 'variant'>): void => {
    emit({ ...props, variant: 'success' })
  },
  warning: (props: Omit<Toast, 'id' | 'variant'>): void => {
    emit({ ...props, variant: 'warning' })
  },
  error: (props: Omit<Toast, 'id' | 'variant'>): void => {
    emit({ ...props, variant: 'destructive' })
  }
}
