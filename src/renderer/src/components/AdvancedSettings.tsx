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
import { Settings, Info } from 'lucide-react'
import { ConversionOptions } from '@shared/types'
import { useEffect, useState } from 'react'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@renderer/components/ui/select'
import { Dispatch, SetStateAction } from 'react'
import { Slider } from '@renderer/components/ui/slider'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@renderer/components/ui/tooltip'
import { advancedSettingsConfig, ConversionType } from '@renderer/lib/conversionTypes'

interface AdvancedSettingsProps {
  conversionType: ConversionType
  onOptionsChange: Dispatch<SetStateAction<ConversionOptions>>
}

export default function AdvancedSettings({
  conversionType,
  onOptionsChange
}: AdvancedSettingsProps): JSX.Element {
  const { t } = useTranslation()
  const [conversionOptions, setConversionOptions] = useState<ConversionOptions>({
    fps: 10,
    scale: '-1:-1', // Use inputFileScale if provided, otherwise default to '480:-1'
    quality: 5
  })

  const scaleOptions = ['-1:-1', '320:-1', '480:-1', '640:-1', '800:-1', '1024:-1']
  const fpsOptions = [10, 15, 20, 25, 30]

  useEffect(() => {
    onOptionsChange(conversionOptions)
  }, [conversionOptions, onOptionsChange])

  const handleOptionChange = (option: string, value: string | number): void => {
    setConversionOptions((prev) => ({ ...prev, [option]: value }))
  }

  const renderSetting = (setting: string): JSX.Element | null => {
    switch (setting) {
      case 'fps':
        return (
          <div key={setting} className="ml-1 space-y-2 flex-1 mr-4">
            <Label htmlFor="fps">{t('fps')}</Label>
            <Select
              defaultValue={conversionOptions.fps!.toString()}
              onValueChange={(value) => handleOptionChange('fps', parseInt(value))}
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
        )
      case 'scale':
        return (
          <div key={setting} className="mr-1 space-y-2 flex-1">
            <Label htmlFor="scale">{t('scale')}</Label>
            <Select
              defaultValue={conversionOptions.scale}
              onValueChange={(value) => handleOptionChange('scale', value)}
            >
              <SelectTrigger id="scale">
                <SelectValue placeholder={t('selectScale')} />
              </SelectTrigger>
              <SelectContent>
                {scaleOptions.map((scale) => (
                  <SelectItem key={scale} value={scale}>
                    {scale.split(':')[0] === '-1'
                      ? t('originalResolution')
                      : `${scale.split(':')[0]}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      case 'quality':
        return (
          <div key={setting} className="ml-1 space-y-2 flex-1 mr-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Label htmlFor="quality" className="flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    {t('quality')}{' '}
                    <span className="ml-2 text-sm text-gray-500">
                      ({conversionOptions.quality})
                    </span>
                  </Label>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('qualityTooltip')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Slider
              className="h-10"
              id="quality"
              min={2}
              max={31}
              step={1}
              value={[conversionOptions.quality!]}
              onValueChange={(value) => handleOptionChange('quality', value[0])}
            />
          </div>
        )
      default:
        return null
    }
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
            <div className="flex">{advancedSettingsConfig[conversionType]?.map(renderSetting)}</div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
