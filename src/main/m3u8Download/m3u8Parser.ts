/*
 * @Author: Libra
 * @Date: 2025-05-14 18:10:24
 * @LastEditors: Libra
 * @Description: M3U8解析功能
 */
import axios from 'axios'
import path from 'path'
import url from 'url'

// M3U8分段接口
interface M3U8Segment {
  duration: number
  url: string
}

// 解析后的M3U8内容接口
export interface ParsedM3U8 {
  segments: M3U8Segment[]
  totalDuration: number
  baseUrl: string
}

/**
 * 从远程URL获取M3U8文件内容
 * @param m3u8Url M3U8链接地址
 * @returns M3U8文件文本内容
 */
export async function fetchM3U8Contents(m3u8Url: string): Promise<string> {
  try {
    const response = await axios.get(m3u8Url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    })

    return response.data
  } catch (error) {
    console.error('获取M3U8内容失败:', error)
    throw new Error(`获取M3U8内容失败: ${error}`)
  }
}

/**
 * 解析M3U8文件内容
 * @param content M3U8文件内容
 * @param baseUrl 基础URL，用于解析相对路径
 * @returns 解析后的M3U8信息
 */
export function parseM3U8Contents(content: string, baseUrl: string): ParsedM3U8 {
  const lines = content.split('\n').map((line) => line.trim())
  const segments: M3U8Segment[] = []
  let totalDuration = 0
  let duration: number | null = null

  // 获取baseUrl的目录部分
  const parsedBaseUrl = url.parse(baseUrl)
  const baseUrlDir = path.dirname(baseUrl)
  const isHttpUrl = parsedBaseUrl.protocol?.startsWith('http')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 检查是否是持续时间标签
    if (line.startsWith('#EXTINF:')) {
      const durationMatch = line.match(/#EXTINF:(\d+(\.\d+)?)/)
      if (durationMatch) {
        duration = parseFloat(durationMatch[1])
      }
    }
    // 不是注释且前一行有持续时间，则这是一个分段URL
    else if (!line.startsWith('#') && line && duration !== null) {
      let segmentUrl = line

      // 如果是相对路径，转换为绝对路径
      if (isHttpUrl && !segmentUrl.startsWith('http')) {
        if (segmentUrl.startsWith('/')) {
          // 以域名为基础的绝对路径
          const { protocol, host } = parsedBaseUrl
          segmentUrl = `${protocol}//${host}${segmentUrl}`
        } else {
          // 相对路径
          segmentUrl = new URL(segmentUrl, baseUrlDir + '/').href
        }
      }

      segments.push({
        duration,
        url: segmentUrl
      })

      totalDuration += duration
      duration = null
    }
  }

  return {
    segments,
    totalDuration,
    baseUrl
  }
}

/**
 * 解析M3U8内容，如果是主播放列表，则获取并解析质量最高的子播放列表
 * @param content M3U8内容
 * @param baseUrl 基础URL
 * @returns 解析后的M3U8
 */
export async function parseAndResolveM3U8(content: string, baseUrl: string): Promise<ParsedM3U8> {
  // 检查是否是主播放列表（包含多个不同分辨率的流）
  if (content.includes('#EXT-X-STREAM-INF')) {
    const lines = content.split('\n').map((line) => line.trim())
    let highestBandwidth = 0
    let highestQualityUrl = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (line.startsWith('#EXT-X-STREAM-INF')) {
        const bandwidthMatch = line.match(/BANDWIDTH=(\d+)/)

        if (bandwidthMatch) {
          const bandwidth = parseInt(bandwidthMatch[1])

          if (
            bandwidth > highestBandwidth &&
            i + 1 < lines.length &&
            !lines[i + 1].startsWith('#')
          ) {
            highestBandwidth = bandwidth
            highestQualityUrl = lines[i + 1]
          }
        }
      }
    }

    if (highestQualityUrl) {
      // 处理相对URL
      if (!highestQualityUrl.startsWith('http')) {
        highestQualityUrl = new URL(highestQualityUrl, baseUrl).href
      }

      // 获取并解析子播放列表
      const subContent = await fetchM3U8Contents(highestQualityUrl)
      return parseM3U8Contents(subContent, highestQualityUrl)
    }
  }

  // 不是主播放列表或未找到高质量流，直接解析当前内容
  return parseM3U8Contents(content, baseUrl)
}
