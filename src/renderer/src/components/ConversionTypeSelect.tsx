/**
 * Author: Libra
 * Date: 2024-10-07 01:16:20
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

interface ConversionTypeSelectProps {
  categories: ConversionCategory[]
  selectedCategory: string
  selectedConversion: string
  onConversionChange: (conversion: string) => void
}

export default function ConversionTypeSelect({
  categories,
  selectedCategory,
  selectedConversion,
  onConversionChange
}: ConversionTypeSelectProps): JSX.Element {
  const { t } = useTranslation()
  const conversionTypes = selectedCategory
    ? categories.find((c) => c.name === selectedCategory)?.types || []
    : []

  return (
    <div className="space-y-2">
      <Label htmlFor="conversionType">{t('conversionType')}</Label>
      <Select
        value={selectedConversion}
        onValueChange={onConversionChange}
        disabled={!selectedCategory}
      >
        <SelectTrigger id="conversionType">
          <SelectValue placeholder={t('selectConversion')} />
        </SelectTrigger>
        <SelectContent>
          {conversionTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {t(type)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
