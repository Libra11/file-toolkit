import type { LucideIcon } from 'lucide-react'
import {
  Archive,
  Braces,
  FileCheck2,
  FileCog,
  FileInput,
  FileOutput,
  FileScan,
  Files,
  FileSpreadsheet,
  FolderSync,
  Grid2X2,
  Image,
  KeyRound,
  MonitorUp,
  School,
  TextCursorInput,
  Video
} from 'lucide-react'

export type ToolId =
  | 'conversion'
  | 'compression'
  | 'archive'
  | 'exam'
  | 'imageOrganize'
  | 'wordToExcel'
  | 'm3u8'
  | 'json'
  | 'batchRename'
  | 'gifExport'
  | 'fileHash'
  | 'screenRecorder'
  | 'decryption'
  | 'excelRename'
  | 'videoSprite'

export type ToolGroup = 'core' | 'practical' | 'professional'

export interface ToolDefinition {
  id: ToolId
  icon: LucideIcon
  titleKey: string
  descriptionKey: string
  group: ToolGroup
  formats?: string[]
}

export const toolGroups: { id: ToolGroup; labelKey: string }[] = [
  { id: 'core', labelKey: 'coreTools' },
  { id: 'practical', labelKey: 'practicalTools' },
  { id: 'professional', labelKey: 'professionalTools' }
]

export const toolDefinitions: ToolDefinition[] = [
  {
    id: 'conversion',
    icon: FileOutput,
    titleKey: 'fileConversion',
    descriptionKey: 'fileConversionDescription',
    group: 'core',
    formats: ['JPG', 'PNG', 'MP4', 'MP3']
  },
  {
    id: 'compression',
    icon: FileInput,
    titleKey: 'fileCompression',
    descriptionKey: 'fileCompressionDescription',
    group: 'core',
    formats: ['IMAGE', 'AUDIO', 'VIDEO']
  },
  {
    id: 'batchRename',
    icon: TextCursorInput,
    titleKey: 'batchRename',
    descriptionKey: 'batchRenameDescription',
    group: 'practical'
  },
  {
    id: 'archive',
    icon: Archive,
    titleKey: 'archiveCompression',
    descriptionKey: 'archiveCompressionDescription',
    group: 'practical',
    formats: ['ZIP', 'TAR', 'GZIP']
  },
  {
    id: 'wordToExcel',
    icon: FileSpreadsheet,
    titleKey: 'wordToExcel',
    descriptionKey: 'wordToExcelDescription',
    group: 'practical'
  },
  {
    id: 'json',
    icon: Braces,
    titleKey: 'jsonFormatter',
    descriptionKey: 'jsonFormatterDescription',
    group: 'practical'
  },
  {
    id: 'fileHash',
    icon: FileCheck2,
    titleKey: 'fileHashTool',
    descriptionKey: 'fileHashDescription',
    group: 'practical',
    formats: ['MD5', 'SHA']
  },
  {
    id: 'exam',
    icon: School,
    titleKey: 'examCreation',
    descriptionKey: 'examCreationDescription',
    group: 'professional'
  },
  {
    id: 'imageOrganize',
    icon: FolderSync,
    titleKey: 'imageOrganize',
    descriptionKey: 'imageOrganizeDescription',
    group: 'professional'
  },
  {
    id: 'm3u8',
    icon: FileScan,
    titleKey: 'm3u8Download',
    descriptionKey: 'm3u8DownloadDescription',
    group: 'professional'
  },
  {
    id: 'gifExport',
    icon: Image,
    titleKey: 'htmlCardGifExportTool',
    descriptionKey: 'htmlCardGifExportDescription',
    group: 'professional'
  },
  {
    id: 'screenRecorder',
    icon: MonitorUp,
    titleKey: 'screenRecorder',
    descriptionKey: 'screenRecorderDescription',
    group: 'professional'
  },
  {
    id: 'decryption',
    icon: KeyRound,
    titleKey: 'candidateAnswerDecryption',
    descriptionKey: 'candidateAnswerDecryptionDescription',
    group: 'professional'
  },
  {
    id: 'excelRename',
    icon: FileCog,
    titleKey: 'excelMatchRename',
    descriptionKey: 'excelMatchRenameDescription',
    group: 'professional'
  },
  {
    id: 'videoSprite',
    icon: Grid2X2,
    titleKey: 'videoSpriteTool',
    descriptionKey: 'videoSpriteDescription',
    group: 'professional'
  }
]

export const toolMap = Object.fromEntries(toolDefinitions.map((tool) => [tool.id, tool])) as Record<
  ToolId,
  ToolDefinition
>
export const defaultFavoriteTools: ToolId[] = ['conversion', 'compression', 'batchRename']
export const legacyToolIds: (ToolId | null)[] = [
  'conversion',
  'compression',
  'archive',
  'exam',
  'imageOrganize',
  'wordToExcel',
  'm3u8',
  'json',
  'batchRename',
  'gifExport',
  null,
  'fileHash',
  'screenRecorder',
  'decryption',
  'excelRename',
  'videoSprite'
]
export const workspaceIcon = Files
export const mediaIcon = Video
