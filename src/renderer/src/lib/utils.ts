/*
 * @Author: Libra
 * @Date: 2024-03-30
 * @LastEditors: Libra
 * @Description: 工具函数库
 */
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并类名，解决tailwind类冲突问题
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
