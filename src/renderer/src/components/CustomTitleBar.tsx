/**
 * Author: Libra
 * Date: 2024-10-07 17:13:50
 * LastEditors: Libra
 * Description:
 */
import React from 'react'
// 删除未使用的 useTranslation 导入
import { Minus, X } from 'lucide-react' // 导入 lucide-react 图标

const CustomTitleBar: React.FC = () => {
  // 删除未使用的 useTranslation 钩子

  const handleMinimize = async (): Promise<void> => {
    await window.api.minimizeWindow()
  }

  const handleClose = async (): Promise<void> => {
    await window.api.closeWindow()
  }

  return (
    <div className="fixed top-0 left-0 w-full bg-[hsl(var(--background))] z-50 h-8 flex items-center justify-between px-2 select-none custom-titlebar">
      <div
        className="flex items-center flex-grow h-full"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* 这里可以添加应用程序图标或名称 */}
      </div>
      <div className="flex space-x-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={handleMinimize}
          className="p-1 rounded-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          <Minus size={14} className="text-gray-600 dark:text-gray-300" />
        </button>
        <button
          onClick={handleClose}
          className="p-1 rounded-sm hover:bg-red-500 transition-colors duration-200"
        >
          <X size={14} className="text-gray-600 dark:text-gray-300 hover:text-white" />
        </button>
      </div>
    </div>
  )
}

export default CustomTitleBar
