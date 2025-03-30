/*
 * @Author: Libra
 * @Date: 2024-10-07 01:16:39
 * @LastEditors: Libra
 * @Description:
 */
import { ImageIcon, Video, Music } from 'lucide-react'

// 定义转换类型常量
export const CONVERSION_TYPES = {
  // 图片转换
  JPG_TO_PNG: 'jpgToPng',
  PNG_TO_JPG: 'pngToJpg',
  WEBP_TO_JPG: 'webpToJpg',
  JPG_TO_WEBP: 'jpgToWebp',
  PNG_TO_WEBP: 'pngToWebp',
  WEBP_TO_PNG: 'webpToPng',

  // 视频转换
  MP4_TO_GIF: 'mp4ToGif',
  AVI_TO_MP4: 'aviToMp4',
  MOV_TO_MP4: 'movToMp4',
  WEBM_TO_MP4: 'webmToMp4',

  // 音频转换
  MP3_TO_WAV: 'mp3ToWav',
  WAV_TO_MP3: 'wavToMp3',
  M4A_TO_MP3: 'm4aToMp3',
  FLAC_TO_MP3: 'flacToMp3'
} as const

export type ConversionType = (typeof CONVERSION_TYPES)[keyof typeof CONVERSION_TYPES]

export function getDefaultOutputExtension(conversionType: ConversionType): string {
  const parts = conversionType.split('To')
  if (parts.length === 2) {
    return parts[1].toLowerCase()
  }
  return 'out' // 默认扩展名，以防无法解析
}

export interface ConversionCategory {
  name: string
  icon: typeof ImageIcon | typeof Video | typeof Music
  types: ConversionType[]
}

export const conversionCategories: ConversionCategory[] = [
  {
    name: 'image',
    icon: ImageIcon,
    types: [
      // JPG、PNG和WebP三种格式之间的互相转换
      CONVERSION_TYPES.JPG_TO_PNG,
      CONVERSION_TYPES.PNG_TO_JPG,
      CONVERSION_TYPES.JPG_TO_WEBP,
      CONVERSION_TYPES.WEBP_TO_JPG,
      CONVERSION_TYPES.PNG_TO_WEBP,
      CONVERSION_TYPES.WEBP_TO_PNG
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
