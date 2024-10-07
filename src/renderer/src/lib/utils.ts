/*
 * @Author: Libra
 * @Date: 2024-10-07 00:51:48
 * @LastEditors: Libra
 * @Description:
 */
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
