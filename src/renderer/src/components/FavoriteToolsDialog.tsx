import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Star } from 'lucide-react'
import { toolDefinitions, type ToolId } from '@renderer/lib/toolRegistry'
import { cn } from '@renderer/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'

const MAX_FAVORITES = 6

export default function FavoriteToolsDialog({
  open,
  onOpenChange,
  favorites,
  onSave
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  favorites: ToolId[]
  onSave: (tools: ToolId[]) => void
}): JSX.Element {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<ToolId[]>(favorites)

  useEffect(() => {
    if (open) setSelected(favorites)
  }, [open, favorites])

  const toggle = (id: ToolId): void => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length < MAX_FAVORITES
          ? [...current, id]
          : current
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-0 overflow-y-auto p-0">
        <DialogHeader className="border-b border-border px-6 py-5 text-left">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Star className="h-4 w-4" />
            {t('customizeFrequentTools')}
          </DialogTitle>
          <DialogDescription>{t('customizeFrequentToolsDescription')}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[55vh] overflow-y-auto p-3">
          {toolDefinitions.map((tool) => {
            const Icon = tool.icon
            const active = selected.includes(tool.id)
            const disabled = !active && selected.length >= MAX_FAVORITES
            return (
              <button
                key={tool.id}
                type="button"
                aria-pressed={active}
                disabled={disabled}
                onClick={() => toggle(tool.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-muted disabled:opacity-40',
                  active && 'bg-accent/70 hover:bg-accent'
                )}
              >
                <span
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border border-input text-transparent',
                    active && 'border-primary bg-primary text-primary-foreground'
                  )}
                >
                  <Check className="h-3 w-3" />
                </span>
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.7} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">{t(tool.titleKey)}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                    {t(tool.descriptionKey)}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
        <DialogFooter className="items-center border-t border-border bg-muted/35 px-5 py-3.5">
          <span className="mr-auto text-[11px] text-muted-foreground">
            {t('favoriteToolsSelectionCount', { count: selected.length, max: MAX_FAVORITES })}
          </span>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onSave(selected)
              onOpenChange(false)
            }}
          >
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
