/**
 * Author: Libra
 * Date: 2024-10-07 01:16:20
 * LastEditors: Libra
 * Description:
 */
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

  return (
    <div className="space-y-2">
      <Label htmlFor="conversion">{t('selectCategory')}</Label>
      <Select
        value={selectedConversion}
        onValueChange={handleConversionChange}
        disabled={!selectedCategory}
      >
        <SelectTrigger>
          <SelectValue placeholder={t('selectConversion')} />
        </SelectTrigger>
        <SelectContent>
          {categories
            .find((category) => category.name === selectedCategory)
            ?.types.map((type) => (
              <SelectItem key={type} value={type}>
                {t(type)}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  )
}
