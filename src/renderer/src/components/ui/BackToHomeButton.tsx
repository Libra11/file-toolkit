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
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-200 dark:focus-visible:ring-slate-700',
        className
      )}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
      {t('backToHome')}
    </button>
  )
}
