/**
 * Author: Libra
 * Date: 2024-10-07 01:15:57
 * LastEditors: Libra
 * Description:
 */
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import ConversionForm from '@renderer/components/ConversionForm'
import { conversionCategories } from '@renderer/lib/conversionTypes'

export default function FileConversionTool(): JSX.Element {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('conversion')

  return (
    <div className="h-full bg-gradient-to-br from-background to-secondary p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        <h1 className="mt-4 text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          {t('fileHandleTool')}
        </h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="conversion">{t('fileConversion')}</TabsTrigger>
            <TabsTrigger value="compression">{t('fileCompression')}</TabsTrigger>
          </TabsList>
          <TabsContent value="conversion" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold">{t('convertYourFile')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ConversionForm categories={conversionCategories} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="compression" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold">{t('fileCompression')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('fileCompressionComingSoon')}</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
