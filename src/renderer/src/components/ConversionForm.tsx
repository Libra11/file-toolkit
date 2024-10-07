/**
 * Author: Libra
 * Date: 2024-10-07 01:16:09
 * LastEditors: Libra
 * Description:
 */
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FileType2, Loader2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import CategorySelect from '@renderer/components/CategorySelect'
import ConversionTypeSelect from '@renderer/components/ConversionTypeSelect'
import FileInput from '@renderer/components/FileInput'
import AdvancedSettings from '@renderer/components/AdvancedSettings'
import { CONVERSION_TYPES, ConversionCategory } from '@renderer/lib/conversionTypes'

interface ConversionFormProps {
  categories: ConversionCategory[]
}

export default function ConversionForm({ categories }: ConversionFormProps): JSX.Element {
  const { t } = useTranslation()
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedConversion, setSelectedConversion] = useState('')
  const [isConverting, setIsConverting] = useState(false)
  const [convertedFilePath, setConvertedFilePath] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [advancedOptions, setAdvancedOptions] = useState({})

  const handleConvert = async (): Promise<void> => {
    console.log(selectedFile, selectedConversion)
    if (!selectedFile || !selectedConversion) return

    setIsConverting(true)
    try {
      if (selectedConversion === CONVERSION_TYPES.MP4_TO_GIF) {
        const inputPath = selectedFile.path
        const defaultFileName = 'output.gif'
        const outputPath = await window.api.saveFile(defaultFileName)

        if (!outputPath) {
          throw new Error('No output file selected')
        }

        const optionsStr = JSON.stringify(advancedOptions)

        const convertedPath = await window.api.convertMp4ToGif(inputPath, outputPath, optionsStr)
        setConvertedFilePath(convertedPath)
      }
      // Add more conversion types here in the future
    } catch (error) {
      console.error('Conversion error:', error)
      // Handle error (e.g., show error message to user)
    } finally {
      setIsConverting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <CategorySelect
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
        <ConversionTypeSelect
          categories={categories}
          selectedCategory={selectedCategory}
          selectedConversion={selectedConversion}
          onConversionChange={setSelectedConversion}
        />
      </div>

      <AnimatePresence>
        {selectedConversion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <FileInput onFileSelect={setSelectedFile} />
            <AdvancedSettings
              selectedCategory={selectedCategory}
              conversionType={selectedConversion}
              onOptionsChange={setAdvancedOptions}
            />

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                className="w-full h-12 text-lg relative overflow-hidden group"
                onClick={handleConvert}
                disabled={isConverting || !selectedFile}
              >
                <span className="relative z-10 flex items-center justify-center w-full h-full">
                  {isConverting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t('converting')}
                    </>
                  ) : (
                    <>
                      <FileType2 className="mr-2 h-5 w-5" />
                      {t('convertFile')}
                    </>
                  )}
                </span>
              </Button>
            </motion.div>
            {convertedFilePath && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">{t('preview')}</h3>
                <img
                  src={`myapp://${convertedFilePath}`}
                  alt="Converted GIF"
                  className="max-w-full h-auto"
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
