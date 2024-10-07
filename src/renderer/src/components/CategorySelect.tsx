/**
 * Author: Libra
 * Date: 2024-10-07 01:16:14
 * LastEditors: Libra
 * Description:
 */
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

  return (
    <div className="space-y-2">
      <Label htmlFor="category">{t('category')}</Label>
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger id="category">
          <SelectValue placeholder={t('selectCategory')} />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.name} value={category.name}>
              <span className="flex items-center">
                <category.icon className="mr-2 h-4 w-4" />
                {t(category.name)}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
