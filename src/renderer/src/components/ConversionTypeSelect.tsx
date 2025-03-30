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
import { Badge } from '@renderer/components/ui/badge'

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

  // 从转换类型中提取输入和输出格式
  const getFormatDetails = (conversionType: string): { input: string; output: string } | null => {
    const match = conversionType.match(/([A-Za-z0-9]+)To([A-Za-z0-9]+)/)
    if (!match) return null
    return {
      input: match[1].toUpperCase(),
      output: match[2].toUpperCase()
    }
  }

  return (
    <div className="space-y-2.5">
      <Label htmlFor="conversion" className="font-medium flex items-center text-sm">
        {selectedConversion && (
          <Badge
            variant="outline"
            className="mr-2 bg-primary/5 border-primary/20 text-primary text-[10px] px-1.5 py-0"
          >
            {getFormatDetails(selectedConversion)?.output || ''}
          </Badge>
        )}
        {t('conversionType')}
      </Label>
      <Select
        value={selectedConversion}
        onValueChange={handleConversionChange}
        disabled={!selectedCategory}
      >
        <SelectTrigger
          id="conversion"
          className="w-full transition-all duration-200 border-border/50 hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary/20 ring-offset-0 disabled:opacity-50 disabled:pointer-events-none"
        >
          <SelectValue placeholder={t('selectConversion')} />
        </SelectTrigger>
        <SelectContent>
          {categories
            .find((category) => category.name === selectedCategory)
            ?.types.map((type) => {
              const formatDetails = getFormatDetails(type)
              return (
                <SelectItem
                  key={type}
                  value={type}
                  className="cursor-pointer focus:bg-primary/5 focus:text-primary"
                >
                  <div className="flex items-center">
                    <div className="flex items-center justify-center mr-2">
                      <Badge
                        variant="outline"
                        className="mr-1 text-[10px] px-1 py-0 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                      >
                        {formatDetails?.input || ''}
                      </Badge>
                      <span className="text-muted-foreground text-xs mx-0.5">→</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 py-0 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                      >
                        {formatDetails?.output || ''}
                      </Badge>
                    </div>
                  </div>
                </SelectItem>
              )
            })}
        </SelectContent>
      </Select>
    </div>
  )
}
