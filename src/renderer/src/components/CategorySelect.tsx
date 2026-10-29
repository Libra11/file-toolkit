import { useTranslation } from 'react-i18next'
import { Label } from '@renderer/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { ConversionCategory } from '@renderer/lib/conversionTypes'
import { ImageIcon } from 'lucide-react'

interface CategorySelectProps {
  categories: ConversionCategory[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

export default function CategorySelect({
  categories,
  selectedCategory,
  onCategoryChange
}: CategorySelectProps): JSX.Element {
  const { t } = useTranslation()

  const getCategoryIcon = (categoryName: string): JSX.Element => {
    const category = categories.find((item) => item.name === categoryName)
    const Icon = category?.icon ?? ImageIcon
    return <Icon className="mr-2 h-4 w-4 shrink-0 text-primary" />
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="category" className="text-xs font-medium text-foreground">
        {t('category')}
      </Label>
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger
          id="category"
          className="h-10 rounded-md border-border bg-card transition-colors hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/15"
        >
          <SelectValue placeholder={t('selectCategory')} />
        </SelectTrigger>
        <SelectContent className="rounded-md">
          {categories.map((category) => (
            <SelectItem
              key={category.name}
              value={category.name}
              className="cursor-pointer rounded-md focus:bg-accent focus:text-accent-foreground"
            >
              <div className="flex min-w-0 items-center">
                {getCategoryIcon(category.name)}
                <span className="truncate">{t(category.name)}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
