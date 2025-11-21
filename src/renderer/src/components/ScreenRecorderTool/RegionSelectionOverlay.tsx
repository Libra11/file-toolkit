import React, { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'

export default function RegionSelectionOverlay(): JSX.Element {
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selection, setSelection] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [hasConfirmed, setHasConfirmed] = useState(false)

  useEffect(() => {
    // Ensure body is transparent
    document.body.style.backgroundColor = 'transparent'
    document.documentElement.style.backgroundColor = 'transparent'
    
    // Close on Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.electron.ipcRenderer.send('close-region-selection')
      }
      if (e.key === 'Enter' && selection) {
        confirmSelection()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      // Reset background (though window will close anyway)
      document.body.style.backgroundColor = ''
      document.documentElement.style.backgroundColor = ''
    }
  }, [selection])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartPos({ x: e.clientX, y: e.clientY })
    setSelection(null)
    setHasConfirmed(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && startPos) {
      const x = Math.min(startPos.x, e.clientX)
      const y = Math.min(startPos.y, e.clientY)
      const w = Math.abs(e.clientX - startPos.x)
      const h = Math.abs(e.clientY - startPos.y)
      setSelection({ x, y, w, h })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    if (selection && !hasConfirmed) {
      confirmSelection(selection)
    }
  }

  const confirmSelection = (finalSelection?: { x: number; y: number; w: number; h: number }) => {
    const target = finalSelection ?? selection
    if (target && !hasConfirmed) {
      setHasConfirmed(true)
      console.log('Confirming selection, sending bounds:', target)
      // Send bounds to main process
      // We need to account for device pixel ratio if necessary, but usually electron handles logical coords
      window.electron.ipcRenderer.send('region-selected', target)
    }
  }

  const cancelSelection = () => {
    window.electron.ipcRenderer.send('close-region-selection')
  }

  return (
    <div 
      className="fixed inset-0 z-50 cursor-crosshair select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Dimmed Background */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Selection Box */}
      {selection && (
        <div
          className="absolute border-2 border-blue-500 bg-white/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
          style={{
            left: selection.x,
            top: selection.y,
            width: selection.w,
            height: selection.h
          }}
        >
          {/* Dimensions Label */}
          <div className="absolute -top-8 left-0 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow">
            {selection.w} x {selection.h}
          </div>

          {/* Action Buttons */}
          {!isDragging && (
            <div className="absolute -bottom-12 right-0 flex gap-2 pointer-events-auto">
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  cancelSelection()
                }}
                className="p-2 bg-slate-700 text-white rounded-full hover:bg-slate-600 shadow-lg"
              >
                <X size={16} />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  confirmSelection()
                }}
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-500 shadow-lg"
              >
                <Check size={16} />
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Helper Text */}
      {!selection && !isDragging && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-shadow text-xl font-semibold drop-shadow-md pointer-events-none">
          Click and drag to select a region
        </div>
      )}
    </div>
  )
}
