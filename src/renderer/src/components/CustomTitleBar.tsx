/**
 * Author: Libra
 * Date: 2024-10-07 17:13:50
 * LastEditors: Libra
 * Description:
 */
import React from 'react'
import { Minus, X, FileType2 } from 'lucide-react' // 导入 FileType2 图标作为应用图标

const CustomTitleBar: React.FC = () => {
  const handleMinimize = async (): Promise<void> => {
    await window.system.minimizeWindow()
  }

  const handleClose = async (): Promise<void> => {
    await window.system.closeWindow()
  }

  return (
    <div className="fixed top-0 left-0 w-full bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-md z-50 h-10 flex items-center justify-between px-4 shadow-sm select-none custom-titlebar border-b border-border/40">
      <div
        className="flex items-center flex-grow h-full"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex items-center">
          <FileType2 size={18} className="text-primary mr-2" />
          <span className="font-semibold text-sm bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            文件转换大师
          </span>
        </div>
      </div>
      <div className="flex" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={handleMinimize}
          className="p-1.5 rounded-md hover:bg-gray-200/80 dark:hover:bg-gray-800/80 transition-colors duration-200 flex items-center justify-center"
        >
          <Minus size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={handleClose}
          className="p-1.5 rounded-md hover:bg-red-500 transition-colors duration-200 flex items-center justify-center ml-1"
        >
          <X size={16} className="text-gray-600 dark:text-gray-400 group-hover:text-white" />
        </button>
      </div>
    </div>
  )
}

export default CustomTitleBar
