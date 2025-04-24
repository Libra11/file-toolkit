/*
 * @Author: Libra
 * @Date: 2025-04-25 10:30:00
 * @LastEditors: Libra
 * @Description: Toast 组件
 */
import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@renderer/lib/utils'

// Toast 类型定义
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

// 创建 Context
const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

// Toast 提供器
export function ToastProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>): void => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { id, ...toast }
    setToasts((prev) => [...prev, newToast])

    // 自动关闭
    if (toast.duration !== 0) {
      setTimeout(() => {
        dismissToast(id)
      }, toast.duration || 3000)
    }
  }, [])

  const dismissToast = React.useCallback((id: string): void => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const dismissAllToasts = React.useCallback((): void => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast, dismissAllToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

// 使用 Toast 的 Hook
export function useToast(): ToastContextType {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast 必须在 ToastProvider 内使用')
  }
  return context
}

// Toast 容器
function ToastContainer(): JSX.Element {
  const { toasts } = useToast()

  if (toasts.length === 0) return <></>

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-2 max-w-xs w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

// 单个 Toast 项
function ToastItem({ toast }: { toast: Toast }): JSX.Element {
  const { dismissToast } = useToast()

  const variantStyles = {
    default: 'bg-background border',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    destructive: 'bg-red-50 border-red-200 text-red-800'
  }

  return (
    <div
      className={cn(
        'rounded-md shadow-md border p-4 animate-in fade-in slide-in-from-bottom-5',
        variantStyles[toast.variant || 'default']
      )}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          {toast.title && <div className="font-medium">{toast.title}</div>}
          {toast.description && <div className="text-sm opacity-90 mt-1">{toast.description}</div>}
        </div>
        <button
          onClick={() => dismissToast(toast.id)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

// 创建独立的 toast 调用函数
const getToast = (): { addToast: (toast: Omit<Toast, 'id'>) => void } => {
  try {
    return useToast()
  } catch (error) {
    console.error('Toast context not available:', error)
    // 提供一个默认实现，当 context 不可用时
    return {
      addToast: (toast: Omit<Toast, 'id'>): void => {
        console.warn('Toast unavailable:', toast)
      }
    }
  }
}

// 导出 toast 方法
export const toast = {
  // 常规 toast
  default: (props: Omit<Toast, 'id' | 'variant'>): void => {
    const { addToast } = getToast()
    addToast({ ...props, variant: 'default' })
  },
  // 成功 toast
  success: (props: Omit<Toast, 'id' | 'variant'>): void => {
    const { addToast } = getToast()
    addToast({ ...props, variant: 'success' })
  },
  // 警告 toast
  warning: (props: Omit<Toast, 'id' | 'variant'>): void => {
    const { addToast } = getToast()
    addToast({ ...props, variant: 'warning' })
  },
  // 错误 toast
  error: (props: Omit<Toast, 'id' | 'variant'>): void => {
    const { addToast } = getToast()
    addToast({ ...props, variant: 'destructive' })
  }
}
