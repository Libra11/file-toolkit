import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { ConversionCategory, ConversionType } from '@renderer/lib/conversionTypes'
import { Label } from '@renderer/components/ui/label'
import { FileInput, FileOutput, ArrowRight } from 'lucide-react'

interface ConversionTypeSelectProps {
  categories: ConversionCategory[]
  selectedCategory: string
  selectedConversion: ConversionType | ''
  onConversionChange: (conversion: ConversionType | '') => void
}

export default function ConversionTypeSelect({
  categories,
  selectedCategory,
  selectedConversion,
  onConversionChange
}: ConversionTypeSelectProps): JSX.Element {
  const { t } = useTranslation()

  const handleConversionChange = (value: string): void => {
    onConversionChange(value as ConversionType | '')
  }

  const getFormatDetails = (conversionType: string): { input: string; output: string } | null => {
    const match = conversionType.match(/([A-Za-z0-9]+)To([A-Za-z0-9]+)/)
    if (!match) return null
    return {
      input: match[1].toUpperCase(),
      output: match[2].toUpperCase()
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="conversion" className="text-xs font-medium text-foreground">
        {t('conversionType')}
      </Label>
      <Select
        value={selectedConversion}
        onValueChange={handleConversionChange}
        disabled={!selectedCategory}
      >
        <SelectTrigger
          id="conversion"
          className="h-10 rounded-md border-border bg-card transition-colors hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:pointer-events-none disabled:opacity-50"
        >
          <SelectValue placeholder={t('selectConversion')} />
        </SelectTrigger>
        <SelectContent className="rounded-md">
          {categories
            .find((category) => category.name === selectedCategory)
            ?.types.map((type) => {
              const formatDetails = getFormatDetails(type)
              return (
                <SelectItem
                  key={type}
                  value={type}
                  className="cursor-pointer rounded-md focus:bg-accent focus:text-accent-foreground"
                >
                  <div className="flex items-center gap-1.5 py-0.5">
                    <span className="inline-flex min-w-[3.5rem] items-center justify-center gap-1 rounded-sm border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-foreground">
                      <FileInput className="h-3 w-3 text-muted-foreground" />
                      {formatDetails?.input || ''}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="inline-flex min-w-[3.5rem] items-center justify-center gap-1 rounded-sm border border-primary/20 bg-primary/5 px-1.5 py-0.5 font-mono text-[10px] font-medium text-primary">
                      <FileOutput className="h-3 w-3" />
                      {formatDetails?.output || ''}
                    </span>
                  </div>
                </SelectItem>
              )
            })}
        </SelectContent>
      </Select>
    </div>
  )
}
