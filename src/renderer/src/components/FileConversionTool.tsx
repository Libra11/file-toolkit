import ConversionForm from '@renderer/components/ConversionForm'
import { conversionCategories } from '@renderer/lib/conversionTypes'

interface FileConversionToolProps {
  activeCategory?: string
  onBack?: () => void
}

export default function FileConversionTool({
  activeCategory
}: FileConversionToolProps): JSX.Element {
  const fallbackCategory = conversionCategories[0]?.name ?? ''
  const resolvedCategory = activeCategory ?? fallbackCategory

  // Navigation belongs to the outer workspace. onBack remains in the props for compatibility.
  return (
    <div className="w-full min-w-0">
      <ConversionForm categories={conversionCategories} activeCategory={resolvedCategory} />
    </div>
  )
}
