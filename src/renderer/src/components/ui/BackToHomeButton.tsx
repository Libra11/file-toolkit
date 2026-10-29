import type { ButtonHTMLAttributes } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@renderer/lib/utils'

type BackToHomeButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export function BackToHomeButton({ className, ...props }: BackToHomeButtonProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-45',
        className
      )}
      {...props}
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.7} />
      {t('backToHome')}
    </button>
  )
}
