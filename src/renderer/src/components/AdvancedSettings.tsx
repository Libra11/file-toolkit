/**
 * Author: Libra
 * Date: 2024-10-07 01:16:34
 * LastEditors: Libra
 * Description:
 */
import { useTranslation } from 'react-i18next'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@renderer/components/ui/accordion'
import { Label } from '@renderer/components/ui/label'
import { Settings } from 'lucide-react'
import { Mp4ToGifOptions } from '@shared/types'
import { useEffect, useState } from 'react'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@renderer/components/ui/select'
import { Dispatch, SetStateAction } from 'react'

interface AdvancedSettingsProps {
  selectedCategory: string
  conversionType: string
  onOptionsChange: Dispatch<SetStateAction<Mp4ToGifOptions>>
}

export default function AdvancedSettings({
  selectedCategory,
  conversionType,
  onOptionsChange
}: AdvancedSettingsProps): JSX.Element {
  const { t } = useTranslation()
  const [conversionOptions, setConversionOptions] = useState<Mp4ToGifOptions>({
    fps: 10,
    scale: '480:-1'
  })

  const scaleOptions = ['320:-1', '480:-1', '640:-1', '800:-1', '1024:-1']
  const fpsOptions = [10, 15, 20, 25, 30]

  useEffect(() => {
    onOptionsChange(conversionOptions)
  }, [conversionOptions, onOptionsChange])

  const handleFpsChange = (value: string): void => {
    const fps = parseInt(value) as 10 | 15 | 20 | 25 | 30
    setConversionOptions((prev) => ({ ...prev, fps }))
  }

  const handleScaleChange = (value: string): void => {
    setConversionOptions((prev) => ({
      ...prev,
      scale: value as '320:-1' | '480:-1' | '640:-1' | '800:-1' | '1024:-1'
    }))
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="advanced-settings">
        <AccordionTrigger>
          <span className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            {t('advancedSettings')}
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 pt-4">
            {selectedCategory === 'video' && conversionType === 'mp4ToGif' && (
              <div className="flex">
                <div className="ml-1 space-y-2 flex-1 mr-4">
                  <Label htmlFor="fps">{t('fps')}</Label>
                  <Select
                    defaultValue={conversionOptions.fps.toString()}
                    onValueChange={handleFpsChange}
                  >
                    <SelectTrigger id="fps">
                      <SelectValue placeholder={t('selectFps')} />
                    </SelectTrigger>
                    <SelectContent>
                      {fpsOptions.map((fps) => (
                        <SelectItem key={fps} value={fps.toString()}>
                          {fps}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="mr-1 space-y-2 flex-1">
                  <Label htmlFor="scale">{t('scale')}</Label>
                  <Select defaultValue={conversionOptions.scale} onValueChange={handleScaleChange}>
                    <SelectTrigger id="scale">
                      <SelectValue placeholder={t('selectScale')} />
                    </SelectTrigger>
                    <SelectContent>
                      {scaleOptions.map((scale) => (
                        <SelectItem key={scale} value={scale}>
                          {scale.split(':')[0]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Add more category-specific settings here */}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
