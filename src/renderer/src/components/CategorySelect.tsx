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
import { ImageIcon, FileText, Video, Music } from 'lucide-react'

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

  // 获取当前选中类别的图标
  const getSelectedIcon = (): JSX.Element | null => {
    if (!selectedCategory) return null

    const category = categories.find((c) => c.name === selectedCategory)
    if (!category) return null

    const Icon = category.icon
    return <Icon className="h-4 w-4 text-primary" />
  }

  const getCategoryIcon = (categoryName: string): JSX.Element => {
    switch (categoryName) {
      case 'image':
        return <ImageIcon className="h-4 w-4 mr-2 text-blue-500" />
      case 'document':
        return <FileText className="h-4 w-4 mr-2 text-amber-500" />
      case 'video':
        return <Video className="h-4 w-4 mr-2 text-red-500" />
      case 'audio':
        return <Music className="h-4 w-4 mr-2 text-purple-500" />
      default:
        return <ImageIcon className="h-4 w-4 mr-2 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-2.5">
      <Label htmlFor="category" className="font-medium flex items-center text-sm">
        {getSelectedIcon()}
        {selectedCategory && <span className="ml-1.5">{t('category')}</span>}
        {!selectedCategory && t('category')}
      </Label>
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger
          id="category"
          className="w-full transition-all duration-200 border-border/50 hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary/20 ring-offset-0"
        >
          <SelectValue placeholder={t('selectCategory')} />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem
              key={category.name}
              value={category.name}
              className="flex items-center cursor-pointer focus:bg-primary/5 focus:text-primary"
            >
              <div className="flex items-center">
                {getCategoryIcon(category.name)}
                {t(category.name)}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
