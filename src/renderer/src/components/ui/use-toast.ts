/*
 * @Author: Libra
 * @Date: 2025-04-25 10:30:00
 * @LastEditors: Libra
 * @Description: Toast hook
 */

import { useState } from 'react'

type ToastVariant = 'default' | 'destructive' | 'success' | 'warning'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastActionElement {
  altText: string
}

type ToastProps = Toast & {
  onDismiss: () => void
}

// 模拟 shadcn 的 toast 函数
export function toast(props: Omit<Toast, 'id'>): { id: string; dismiss: () => void } {
  const id = Math.random().toString(36).slice(2, 11)
  const toast: Toast = {
    id,
    duration: 5000,
    ...props
  }

  // 在实际项目中可以使用状态管理或自定义事件通知系统来处理 toast
  // 这里简化处理，直接使用 DOM API 创建提示
  const toastElement = document.createElement('div')
  toastElement.className = `fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-md border p-4 text-card-foreground shadow-lg animate-in fade-in slide-in-from-bottom-2
    ${
      props.variant === 'destructive'
        ? 'border-destructive/30 bg-card'
        : props.variant === 'success'
          ? 'border-primary/30 bg-card'
          : props.variant === 'warning'
            ? 'border-input bg-secondary/60'
            : 'border-border bg-card'
    }`

  toastElement.setAttribute('role', props.variant === 'destructive' ? 'alert' : 'status')
  toastElement.setAttribute('aria-live', props.variant === 'destructive' ? 'assertive' : 'polite')
  toastElement.setAttribute('aria-atomic', 'true')

  // 创建标题元素（如果提供）
  if (props.title) {
    const titleElement = document.createElement('div')
    titleElement.className = 'text-sm font-medium leading-5 text-foreground'
    titleElement.textContent = props.title
    toastElement.appendChild(titleElement)
  }

  // 创建描述元素（如果提供）
  if (props.description) {
    const descElement = document.createElement('div')
    descElement.className = 'mt-1 break-words text-xs leading-5 text-muted-foreground'
    descElement.textContent = props.description
    toastElement.appendChild(descElement)
  }

  document.body.appendChild(toastElement)

  // 设置消失时间
  setTimeout(() => {
    toastElement.classList.add('opacity-0', 'transition-opacity')
    setTimeout(() => {
      document.body.removeChild(toastElement)
    }, 300)
  }, toast.duration)

  // 返回删除函数
  const dismiss = (): void => {
    try {
      document.body.removeChild(toastElement)
    } catch (error) {
      console.error('Failed to remove toast element:', error)
    }
  }

  return { id, dismiss }
}

export function useToast(): {
  toast: (props: Toast) => string
  dismiss: (id: string) => void
  toasts: ToastProps[]
} {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  function addToast(props: Toast): string {
    setToasts((prev): ToastProps[] => [
      ...prev,
      { ...props, onDismiss: () => dismissToast(props.id) }
    ])
    return props.id
  }

  function dismissToast(id: string): void {
    setToasts((prev): ToastProps[] => prev.filter((toast) => toast.id !== id))
  }

  return {
    toast: addToast,
    dismiss: dismissToast,
    toasts
  }
}

export type { ToastActionElement, ToastProps }
