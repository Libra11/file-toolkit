/*
 * @Author: Libra
 * @Date: 2024-10-07 01:16:39
 * @LastEditors: Libra
 * @Description:
 */
import { ImageIcon, FileText, Video, Music } from 'lucide-react'

// 定义转换类型常量
export const CONVERSION_TYPES = {
  // Image conversions
  JPG_TO_PNG: 'jpgToPng',
  PNG_TO_JPG: 'pngToJpg',
  WEBP_TO_JPG: 'webpToJpg',
  TIFF_TO_PNG: 'tiffToPng',

  // Document conversions
  PDF_TO_DOCX: 'pdfToDocx',
  DOCX_TO_PDF: 'docxToPdf',
  TXT_TO_PDF: 'txtToPdf',
  EPUB_TO_PDF: 'epubToPdf',

  // Video conversions
  MP4_TO_GIF: 'mp4ToGif',
  AVI_TO_MP4: 'aviToMp4',
  MOV_TO_MP4: 'movToMp4',
  WEBM_TO_MP4: 'webmToMp4',

  // Audio conversions
  MP3_TO_WAV: 'mp3ToWav',
  WAV_TO_MP3: 'wavToMp3',
  M4A_TO_MP3: 'm4aToMp3',
  FLAC_TO_MP3: 'flacToMp3'
} as const

export type ConversionType = (typeof CONVERSION_TYPES)[keyof typeof CONVERSION_TYPES]

export interface ConversionCategory {
  name: string
  icon: typeof ImageIcon | typeof FileText | typeof Video | typeof Music
  types: ConversionType[]
}

export const conversionCategories: ConversionCategory[] = [
  {
    name: 'image',
    icon: ImageIcon,
    types: [
      CONVERSION_TYPES.JPG_TO_PNG,
      CONVERSION_TYPES.PNG_TO_JPG,
      CONVERSION_TYPES.WEBP_TO_JPG,
      CONVERSION_TYPES.TIFF_TO_PNG
    ]
  },
  {
    name: 'document',
    icon: FileText,
    types: [
      CONVERSION_TYPES.PDF_TO_DOCX,
      CONVERSION_TYPES.DOCX_TO_PDF,
      CONVERSION_TYPES.TXT_TO_PDF,
      CONVERSION_TYPES.EPUB_TO_PDF
    ]
  },
  {
    name: 'video',
    icon: Video,
    types: [
      CONVERSION_TYPES.MP4_TO_GIF,
      CONVERSION_TYPES.AVI_TO_MP4,
      CONVERSION_TYPES.MOV_TO_MP4,
      CONVERSION_TYPES.WEBM_TO_MP4
    ]
  },
  {
    name: 'audio',
    icon: Music,
    types: [
      CONVERSION_TYPES.MP3_TO_WAV,
      CONVERSION_TYPES.WAV_TO_MP3,
      CONVERSION_TYPES.M4A_TO_MP3,
      CONVERSION_TYPES.FLAC_TO_MP3
    ]
  }
]
