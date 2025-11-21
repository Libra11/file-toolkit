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
  toastElement.className = `fixed bottom-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg 
    ${
      props.variant === 'destructive'
        ? 'bg-red-500 text-white'
        : props.variant === 'success'
          ? 'bg-green-500 text-white'
          : props.variant === 'warning'
            ? 'bg-amber-500 text-white'
            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
    }`

  // 创建标题元素（如果提供）
  if (props.title) {
    const titleElement = document.createElement('div')
    titleElement.className = 'font-semibold'
    titleElement.textContent = props.title
    toastElement.appendChild(titleElement)
  }

  // 创建描述元素（如果提供）
  if (props.description) {
    const descElement = document.createElement('div')
    descElement.className = 'text-sm'
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
