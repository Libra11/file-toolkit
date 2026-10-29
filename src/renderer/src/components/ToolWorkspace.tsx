import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Grid2X2, Image, Music, Video } from 'lucide-react'
import { toolDefinitions, toolGroups, toolMap, type ToolId } from '@renderer/lib/toolRegistry'
import { conversionCategories } from '@renderer/lib/conversionTypes'
import { Button } from '@renderer/components/ui/button'
import { SegmentedControl } from '@renderer/components/ui/segmented-control'
import FileConversionTool from '@renderer/components/FileConversionTool'
import ImageCompressionTool from '@renderer/components/ImageCompressionTool'
import AudioCompressionTool from '@renderer/components/AudioCompressionTool'
import VideoCompressionTool from '@renderer/components/VideoCompressionTool'
import ArchiveCompressionTool from '@renderer/components/ArchiveCompressionTool'
import ExamCreationTool from '@renderer/components/ExamCreationTool'
import ImageOrganizeTool from '@renderer/components/ImageOrganizeTool'
import WordToExcelTool from '@renderer/components/WordToExcelTool'
import M3u8DownloadTool from '@renderer/components/M3u8DownloadTool'
import BatchRenameTool from '@renderer/components/BatchRenameTool'
import { GifExportTool } from '@renderer/components/GifExportTool'
import FileHashTool from '@renderer/components/FileHashTool'
import JsonFormatterTool from '@renderer/components/JsonFormatterTool'
import ScreenRecorderTool from '@renderer/components/ScreenRecorderTool'
import CandidateAnswerDecryptionTool from '@renderer/components/CandidateAnswerDecryptionTool'
import ExcelMatchRenameTool from '@renderer/components/ExcelMatchRenameTool'
import { VideoSpriteTool } from '@renderer/components/VideoSpriteTool'

type CompressionMode = 'image' | 'audio' | 'video'

export default function ToolWorkspace({
  toolId,
  onBack
}: {
  toolId: ToolId
  onBack: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const [conversionMode, setConversionMode] = useState('image')
  const [compressionMode, setCompressionMode] = useState<CompressionMode>('image')
  const tool = toolMap[toolId]

  useEffect(() => {
    setConversionMode('image')
    setCompressionMode('image')
  }, [toolId])

  const renderTool = (): JSX.Element => {
    switch (toolId) {
      case 'conversion':
        return <FileConversionTool activeCategory={conversionMode} onBack={onBack} />
      case 'compression':
        if (compressionMode === 'audio') return <AudioCompressionTool onBack={onBack} />
        if (compressionMode === 'video') return <VideoCompressionTool onBack={onBack} />
        return <ImageCompressionTool onBack={onBack} />
      case 'archive':
        return <ArchiveCompressionTool onBack={onBack} />
      case 'exam':
        return <ExamCreationTool onBack={onBack} />
      case 'imageOrganize':
        return <ImageOrganizeTool onBack={onBack} />
      case 'wordToExcel':
        return <WordToExcelTool onBack={onBack} />
      case 'm3u8':
        return <M3u8DownloadTool onBack={onBack} />
      case 'batchRename':
        return <BatchRenameTool onBack={onBack} />
      case 'gifExport':
        return <GifExportTool onBack={onBack} />
      case 'fileHash':
        return <FileHashTool onBack={onBack} />
      case 'json':
        return <JsonFormatterTool onBack={onBack} />
      case 'screenRecorder':
        return <ScreenRecorderTool onBack={onBack} />
      case 'decryption':
        return <CandidateAnswerDecryptionTool onBack={onBack} />
      case 'excelRename':
        return <ExcelMatchRenameTool onBack={onBack} />
      case 'videoSprite':
        return <VideoSpriteTool onBack={onBack} />
    }
  }

  return (
    <div className="mx-auto min-h-full w-full max-w-[1600px] p-5 sm:p-6 lg:px-8">
      <div className="border-b border-border pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <span>{t(toolGroups.find((group) => group.id === tool.group)?.labelKey ?? '')}</span>
              <span className="text-border">/</span>
              <span>
                {String(toolDefinitions.findIndex((item) => item.id === toolId) + 1).padStart(
                  2,
                  '0'
                )}
              </span>
            </div>
            <h1 className="text-xl font-semibold tracking-[-0.025em] text-foreground sm:text-2xl">
              {t(tool.titleKey)}
            </h1>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              {t(tool.descriptionKey)}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onBack}>
            <Grid2X2 className="mr-2 h-3.5 w-3.5" />
            {t('allTools')}
          </Button>
        </div>

        {toolId === 'conversion' && (
          <SegmentedControl
            className="mt-5"
            value={conversionMode}
            onChange={setConversionMode}
            ariaLabel={t('category')}
            options={conversionCategories.map((category) => ({
              value: category.name,
              label: t(category.name),
              icon: category.icon
            }))}
          />
        )}
        {toolId === 'compression' && (
          <SegmentedControl
            className="mt-5"
            value={compressionMode}
            onChange={setCompressionMode}
            ariaLabel={t('category')}
            options={[
              { value: 'image', label: t('imageCompression'), icon: Image },
              { value: 'audio', label: t('audioCompression'), icon: Music },
              { value: 'video', label: t('videoCompression'), icon: Video }
            ]}
          />
        )}
      </div>
      <div className="py-5">{renderTool()}</div>
    </div>
  )
}
