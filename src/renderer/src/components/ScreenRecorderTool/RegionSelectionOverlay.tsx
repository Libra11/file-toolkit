import { useEffect, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { Check, Crop, MousePointer2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/button'

interface Point {
  x: number
  y: number
}

interface Selection {
  x: number
  y: number
  w: number
  h: number
}

export default function RegionSelectionOverlay(): JSX.Element {
  const { t } = useTranslation()
  const [startPos, setStartPos] = useState<Point | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [hasConfirmed, setHasConfirmed] = useState(false)

  useEffect(() => {
    document.body.style.backgroundColor = 'transparent'
    document.documentElement.style.backgroundColor = 'transparent'

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        window.electron.ipcRenderer.send('close-region-selection')
      }
      if (
        event.key === 'Enter' &&
        selection &&
        selection.w > 0 &&
        selection.h > 0 &&
        !hasConfirmed
      ) {
        setHasConfirmed(true)
        window.electron.ipcRenderer.send('region-selected', selection)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return (): void => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.backgroundColor = ''
      document.documentElement.style.backgroundColor = ''
    }
  }, [hasConfirmed, selection])

  const handleMouseDown = (event: ReactMouseEvent): void => {
    if (event.button !== 0 || hasConfirmed) {
      return
    }
    setIsDragging(true)
    setStartPos({ x: event.clientX, y: event.clientY })
    setSelection(null)
  }

  const handleMouseMove = (event: ReactMouseEvent): void => {
    if (!isDragging || !startPos) {
      return
    }
    const x = Math.min(startPos.x, event.clientX)
    const y = Math.min(startPos.y, event.clientY)
    const w = Math.abs(event.clientX - startPos.x)
    const h = Math.abs(event.clientY - startPos.y)
    setSelection({ x, y, w, h })
  }

  const handleMouseUp = (): void => {
    setIsDragging(false)
    setStartPos(null)
  }

  const confirmSelection = (): void => {
    if (selection && selection.w > 0 && selection.h > 0 && !hasConfirmed) {
      setHasConfirmed(true)
      window.electron.ipcRenderer.send('region-selected', selection)
    }
  }

  const cancelSelection = (): void => {
    window.electron.ipcRenderer.send('close-region-selection')
  }

  const hasValidSelection = Boolean(selection && selection.w > 0 && selection.h > 0)

  return (
    <div
      className="fixed inset-0 z-50 cursor-crosshair select-none bg-background/30 text-foreground"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        if (isDragging) handleMouseUp()
      }}
    >
      <div className="pointer-events-none absolute left-1/2 top-5 flex w-[min(560px,calc(100%-32px))] -translate-x-1/2 items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 shadow-lg">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
            <Crop className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">{t('regionRecording')}</p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {t('regionRecordingDesc')}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-md border border-border bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">
          ESC
        </span>
      </div>

      {!selection && !isDragging && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-lg border border-border bg-card/95 px-6 py-5 text-center shadow-lg">
          <MousePointer2 className="h-6 w-6 text-primary" />
          <p className="mt-3 text-sm font-medium">{t('regionRecordingDesc')}</p>
        </div>
      )}

      {selection && (
        <div
          className="pointer-events-none absolute border-2 border-primary bg-primary/10 shadow-[0_0_0_9999px_hsl(var(--foreground)/0.38)]"
          style={{
            left: selection.x,
            top: selection.y,
            width: selection.w,
            height: selection.h
          }}
        >
          <div className="absolute left-0 top-0 flex items-center gap-2 border-b border-r border-primary bg-card px-3 py-2 font-mono text-xs font-medium text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {Math.round(selection.w)} × {Math.round(selection.h)}
          </div>
          <span className="absolute -left-1 -top-1 h-2.5 w-2.5 border border-primary bg-card" />
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 border border-primary bg-card" />
          <span className="absolute -bottom-1 -left-1 h-2.5 w-2.5 border border-primary bg-card" />
          <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 border border-primary bg-card" />
        </div>
      )}

      <div
        className="absolute bottom-5 left-1/2 flex w-[min(520px,calc(100%-32px))] -translate-x-1/2 cursor-default items-center justify-between gap-4 rounded-lg border border-border bg-card px-3 py-3 shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
        onMouseUp={(event) => {
          event.stopPropagation()
          handleMouseUp()
        }}
      >
        <div className="min-w-0 pl-1">
          <p className="text-xs font-medium text-foreground">
            {hasValidSelection
              ? `${Math.round(selection!.w)} × ${Math.round(selection!.h)}`
              : t('regionRecording')}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {hasValidSelection ? 'ENTER' : 'ESC'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={cancelSelection}>
            <X className="mr-1.5 h-3.5 w-3.5" />
            {t('cancel')}
          </Button>
          <Button
            size="sm"
            disabled={!hasValidSelection || hasConfirmed}
            onClick={confirmSelection}
          >
            <Check className="mr-1.5 h-3.5 w-3.5" />
            {t('startRecording')}
          </Button>
        </div>
      </div>
    </div>
  )
}
