/*
 * @Author: Libra
 * @Date: 2025-07-21 11:19:27
 * @LastEditors: Libra
 * @Description: GIF 导出处理器
 */
import { ipcMain, dialog } from 'electron'
import { chromium, Browser, Page } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { ffmpegPath } from '../utils/ffmpegConfig'

const execFileAsync = promisify(execFile)

interface GifExportOptions {
  frameRate?: number
  duration?: number
  quality?: 'high' | 'medium' | 'low'
  outputDir?: string
  singleFrame?: boolean
}

interface CardInfo {
  index: number
  title: string
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
}

class GifExporter {
  private browser: Browser | null = null
  private page: Page | null = null
  private frameRate: number
  private duration: number
  private quality: string
  private outputDir: string
  private tempDir: string
  private progressCallback?: (progress: any) => void

  constructor(options: GifExportOptions = {}, progressCallback?: (progress: any) => void) {
    this.frameRate = options.frameRate || 30
    this.duration = options.duration || 8000 // 8秒
    this.quality = options.quality || 'high'
    this.outputDir = options.outputDir || path.join(process.cwd(), 'gif-exports')
    this.tempDir = path.join(this.outputDir, 'temp')
    this.progressCallback = progressCallback
  }

  async init(): Promise<void> {
    console.log('🚀 初始化 GIF 导出器...')
    this.progressCallback?.({ type: 'init', message: '初始化 GIF 导出器...' })

    // 创建输出目录
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true })
    }
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true })
    }

    // 启动浏览器
    this.browser = await chromium.launch({
      args: [
        '--force-device-scale-factor=3',
        '--high-dpi-support=1',
        '--force-color-profile=srgb',
        '--disable-web-security'
      ]
    })

    const context = await this.browser.newContext({
      deviceScaleFactor: 3
    })

    this.page = await context.newPage()
    console.log('✅ 浏览器已启动')
    this.progressCallback?.({ type: 'init', message: '浏览器已启动' })
  }

  async loadPageFromHtml(htmlString: string): Promise<void> {
    if (!this.page) throw new Error('页面未初始化')

    console.log('📄 从 HTML 字符串加载页面...')
    this.progressCallback?.({ type: 'loading', message: '从 HTML 字符串加载页面...' })
    await this.page.setContent(htmlString, {
      waitUntil: 'networkidle'
    })

    // 等待页面完全渲染
    await this.page.waitForTimeout(3000)

    // 等待所有动画和样式加载完成
    await this.page.evaluate(() => {
      return new Promise<void>((resolve) => {
        if (document.readyState === 'complete') {
          setTimeout(resolve, 1000)
        } else {
          window.addEventListener('load', () => {
            setTimeout(resolve, 1000)
          })
        }
      })
    })
  }

  async getCardInfo(): Promise<CardInfo[]> {
    if (!this.page) throw new Error('页面未初始化')

    console.log('🔍 分析卡片信息...')
    this.progressCallback?.({ type: 'analyzing', message: '分析卡片信息...' })

    const cardInfo = await this.page.evaluate(() => {
      const cards = document.querySelectorAll('.card')
      const cardData: CardInfo[] = []

      cards.forEach((card, index) => {
        // 滚动到卡片位置以确保它在视口内
        card.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' })

        // 等待一下让滚动完成
        const rect = card.getBoundingClientRect()
        const title = card.querySelector('h3')?.textContent || `Card ${index + 1}`

        // 获取页面滚动偏移量
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft
        const scrollY = window.pageYOffset || document.documentElement.scrollTop

        // 计算相对于整个文档的绝对位置
        const absoluteX = rect.left + scrollX
        const absoluteY = rect.top + scrollY

        // 确保边界框有效且不为空
        const boundingBox = {
          x: Math.max(0, Math.floor(absoluteX)),
          y: Math.max(0, Math.floor(absoluteY)),
          width: Math.max(1, Math.ceil(rect.width)),
          height: Math.max(1, Math.ceil(rect.height))
        }

        // 只添加有效的卡片（宽度和高度都大于0）
        if (boundingBox.width > 0 && boundingBox.height > 0) {
          cardData.push({
            index,
            title: title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-'),
            boundingBox
          })
        }
      })

      return cardData
    })

    console.log(`📊 发现 ${cardInfo.length} 张卡片`)
    cardInfo.forEach((card, index) => {
      console.log(
        `   ${index + 1}. ${card.title} (${card.boundingBox.width}×${card.boundingBox.height}) at (${card.boundingBox.x}, ${card.boundingBox.y})`
      )
    })

    this.progressCallback?.({
      type: 'analyzing',
      message: `发现 ${cardInfo.length} 张卡片`,
      cardCount: cardInfo.length
    })
    return cardInfo
  }

  async captureFrames(
    cardInfo: CardInfo[],
    cardIndex: number,
    singleFrame: boolean = false
  ): Promise<string> {
    if (!this.page) throw new Error('页面未初始化')

    const card = cardInfo[cardIndex]
    const frameCount = singleFrame ? 1 : Math.ceil((this.duration / 1000) * this.frameRate)
    const frameInterval = singleFrame ? 0 : this.duration / frameCount

    const frameText = singleFrame ? '1 帧 (PNG)' : `${frameCount} 帧 (GIF)`
    console.log(`📸 开始截取卡片 ${cardIndex + 1} 的帧 (${frameText})...`)
    this.progressCallback?.({
      type: 'capturing',
      message: `开始截取卡片 ${cardIndex + 1} 的帧 (${frameText})...`,
      cardIndex: cardIndex + 1,
      cardTitle: card.title,
      frameCount,
      singleFrame
    })

    // 创建卡片专用的临时目录
    const cardTempDir = path.join(this.tempDir, `card-${cardIndex + 1}`)
    if (!fs.existsSync(cardTempDir)) {
      fs.mkdirSync(cardTempDir, { recursive: true })
    }

    // 滚动到当前卡片并隐藏其他卡片
    await this.page.evaluate((index) => {
      const cards = document.querySelectorAll('.card')
      const targetCard = cards[index] as HTMLElement

      if (targetCard) {
        // 滚动到目标卡片
        targetCard.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' })

        // 隐藏其他卡片，只显示当前卡片
        cards.forEach((card, i) => {
          ;(card as HTMLElement).style.visibility = i === index ? 'visible' : 'hidden'
        })
      }
    }, cardIndex)

    await this.page.waitForTimeout(1000) // 增加等待时间确保滚动完成

    // 重新获取当前卡片在视口中的位置（滚动后）
    const currentCardBounds = await this.page.evaluate((index) => {
      const cards = document.querySelectorAll('.card')
      const targetCard = cards[index] as HTMLElement

      if (targetCard) {
        const rect = targetCard.getBoundingClientRect()
        return {
          x: Math.max(0, Math.floor(rect.left)),
          y: Math.max(0, Math.floor(rect.top)),
          width: Math.ceil(rect.width),
          height: Math.ceil(rect.height)
        }
      }
      return null
    }, cardIndex)

    if (!currentCardBounds) {
      throw new Error(`无法获取卡片 ${cardIndex + 1} 的边界框`)
    }

    // 获取页面和视口尺寸
    const pageSize = await this.page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    }))

    console.log(
      `页面尺寸: ${pageSize.width}×${pageSize.height}, 视口: ${pageSize.viewportWidth}×${pageSize.viewportHeight}`
    )
    console.log(
      `卡片视口边界框: ${currentCardBounds.width}×${currentCardBounds.height} at (${currentCardBounds.x}, ${currentCardBounds.y})`
    )

    // 截取帧
    for (let frame = 0; frame < frameCount; frame++) {
      const framePath = path.join(cardTempDir, `frame_${String(frame).padStart(4, '0')}.png`)

      try {
        await this.page.screenshot({
          path: framePath,
          clip: currentCardBounds,
          type: 'png'
        })
      } catch (error) {
        console.error(`截图失败 (帧 ${frame}):`, error)
        console.error(`视口边界框:`, currentCardBounds)
        console.error(`原始边界框:`, card.boundingBox)
        throw error
      }

      // 报告帧截取进度
      if (frame % 10 === 0 || frame === frameCount - 1) {
        const progress = Math.round(((frame + 1) / frameCount) * 100)
        this.progressCallback?.({
          type: 'capturing',
          message: `截取帧进度: ${progress}% (${frame + 1}/${frameCount})`,
          cardIndex: cardIndex + 1,
          frameProgress: progress
        })
      }

      // 等待下一帧
      if (frame < frameCount - 1) {
        await this.page.waitForTimeout(frameInterval)
      }
    }

    console.log('✅ 帧截取完成')
    this.progressCallback?.({
      type: 'capturing',
      message: '帧截取完成',
      cardIndex: cardIndex + 1,
      frameProgress: 100
    })
    return cardTempDir
  }

  async generateGif(cardTempDir: string, outputPath: string): Promise<void> {
    console.log('🎨 生成 GIF...')
    this.progressCallback?.({ type: 'generating', message: '生成 GIF...' })

    const framePattern = path.join(cardTempDir, 'frame_%04d.png')
    const palettePath = path.join(cardTempDir, 'palette.png')

    try {
      // 生成调色板
      console.log('   📊 生成调色板...')
      this.progressCallback?.({ type: 'generating', message: '生成调色板...' })
      await execFileAsync(ffmpegPath, [
        '-y',
        '-r',
        this.frameRate.toString(),
        '-i',
        framePattern,
        '-vf',
        'palettegen=stats_mode=diff',
        palettePath
      ])

      // 生成 GIF
      console.log('   🎬 生成 GIF...')
      this.progressCallback?.({ type: 'generating', message: '生成 GIF...' })
      const qualityFilter = this.getQualityFilter()
      const filterComplex = `${qualityFilter}paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`

      await execFileAsync(ffmpegPath, [
        '-y',
        '-r',
        this.frameRate.toString(),
        '-i',
        framePattern,
        '-i',
        palettePath,
        '-lavfi',
        filterComplex,
        outputPath
      ])

      console.log('✅ GIF 生成完成')
      this.progressCallback?.({ type: 'generating', message: 'GIF 生成完成' })
    } catch (error) {
      console.error('❌ GIF 生成失败:', error)
      throw error
    }
  }

  async generatePng(cardTempDir: string, outputPath: string): Promise<void> {
    console.log('🎨 生成 PNG...')
    this.progressCallback?.({ type: 'generating', message: '生成 PNG...' })

    const framePath = path.join(cardTempDir, 'frame_0000.png')

    try {
      // 检查源文件是否存在
      if (!fs.existsSync(framePath)) {
        throw new Error(`源文件不存在: ${framePath}`)
      }

      // 根据质量设置处理PNG
      const qualityFilter = this.getQualityFilter()

      if (qualityFilter) {
        // 如果有质量过滤器，使用FFmpeg处理
        console.log('   🖼️ 处理 PNG 质量...')
        this.progressCallback?.({ type: 'generating', message: '处理 PNG 质量...' })

        await execFileAsync(ffmpegPath, [
          '-y',
          '-i',
          framePath,
          '-vf',
          qualityFilter.slice(0, -1), // 移除末尾的逗号
          outputPath
        ])
      } else {
        // 直接复制文件
        console.log('   📋 复制 PNG 文件...')
        this.progressCallback?.({ type: 'generating', message: '复制 PNG 文件...' })
        fs.copyFileSync(framePath, outputPath)
      }

      console.log('✅ PNG 生成完成')
      this.progressCallback?.({ type: 'generating', message: 'PNG 生成完成' })
    } catch (error) {
      console.error('❌ PNG 生成失败:', error)
      throw error
    }
  }

  private getQualityFilter(): string {
    switch (this.quality) {
      case 'high':
        return 'scale=iw:ih:flags=lanczos,'
      case 'medium':
        return 'scale=iw*0.8:ih*0.8:flags=lanczos,'
      case 'low':
        return 'scale=iw*0.6:ih*0.6:flags=lanczos,'
      default:
        return ''
    }
  }

  async cleanupTempFiles(cardTempDir: string): Promise<void> {
    try {
      const files = fs.readdirSync(cardTempDir)
      for (const file of files) {
        fs.unlinkSync(path.join(cardTempDir, file))
      }
      fs.rmdirSync(cardTempDir)
    } catch (error) {
      console.warn('⚠️  清理临时文件失败:', error)
    }
  }

  async exportAllFromHtml(htmlString: string, singleFrame: boolean = false): Promise<string[]> {
    try {
      await this.init()
      await this.loadPageFromHtml(htmlString)

      const cardInfo = await this.getCardInfo()
      const outputPaths: string[] = []

      const exportType = singleFrame ? 'PNG' : 'GIF'
      console.log(`\n🎬 开始从 HTML 字符串批量导出 ${exportType}...\n`)
      this.progressCallback?.({
        type: 'exporting',
        message: `开始批量导出 ${exportType}...`,
        totalCards: cardInfo.length,
        currentCard: 0,
        singleFrame
      })

      for (let i = 0; i < cardInfo.length; i++) {
        const card = cardInfo[i]
        const fileExtension = singleFrame ? 'png' : 'gif'
        const outputFileName = `${String(i + 1).padStart(2, '0')}-${card.title}.${fileExtension}`
        const outputPath = path.join(this.outputDir, outputFileName)

        console.log(`\n📦 处理卡片 ${i + 1}/${cardInfo.length}: ${card.title}`)
        this.progressCallback?.({
          type: 'exporting',
          message: `处理卡片 ${i + 1}/${cardInfo.length}: ${card.title}`,
          totalCards: cardInfo.length,
          currentCard: i + 1,
          cardTitle: card.title
        })

        // 截取帧
        const cardTempDir = await this.captureFrames(cardInfo, i, singleFrame)

        // 生成文件
        if (singleFrame) {
          await this.generatePng(cardTempDir, outputPath)
        } else {
          await this.generateGif(cardTempDir, outputPath)
        }

        // 清理临时文件
        await this.cleanupTempFiles(cardTempDir)

        outputPaths.push(outputPath)

        // 报告单个卡片完成
        this.progressCallback?.({
          type: 'exporting',
          message: `卡片 ${i + 1} 导出完成`,
          totalCards: cardInfo.length,
          currentCard: i + 1,
          cardCompleted: true
        })
      }

      console.log(`\n🎉 所有 ${exportType} 导出完成！`)
      this.progressCallback?.({
        type: 'completed',
        message: `所有 ${exportType} 导出完成！`,
        totalCards: cardInfo.length,
        outputPaths,
        singleFrame
      })
      return outputPaths
    } catch (error) {
      console.error('❌ 导出失败:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.progressCallback?.({ type: 'error', message: `导出失败: ${errorMessage}` })
      throw error
    } finally {
      if (this.browser) {
        await this.browser.close()
      }
    }
  }

  async exportSingleFromHtml(
    htmlString: string,
    cardIndex: number = 0,
    singleFrame: boolean = false
  ): Promise<string> {
    try {
      await this.init()
      await this.loadPageFromHtml(htmlString)

      const cardInfo = await this.getCardInfo()

      if (cardIndex >= cardInfo.length) {
        throw new Error(`卡片索引 ${cardIndex} 超出范围 (0-${cardInfo.length - 1})`)
      }

      const card = cardInfo[cardIndex]
      const fileExtension = singleFrame ? 'png' : 'gif'
      const exportType = singleFrame ? 'PNG' : 'GIF'
      const outputFileName = `single-${String(cardIndex + 1).padStart(2, '0')}-${card.title}.${fileExtension}`
      const outputPath = path.join(this.outputDir, outputFileName)

      console.log(`\n📦 从 HTML 字符串导出单张卡片 ${exportType}: ${card.title}`)
      const cardTempDir = await this.captureFrames(cardInfo, cardIndex, singleFrame)

      if (singleFrame) {
        await this.generatePng(cardTempDir, outputPath)
      } else {
        await this.generateGif(cardTempDir, outputPath)
      }

      await this.cleanupTempFiles(cardTempDir)

      console.log(`\n✅ 单张 ${exportType} 导出完成！`)
      return outputPath
    } catch (error) {
      console.error('❌ 导出失败:', error)
      throw error
    } finally {
      if (this.browser) {
        await this.browser.close()
      }
    }
  }
}

/**
 * 注册 GIF 导出相关的 IPC 处理程序
 */
export function registerGifExportHandlers(): void {
  // 选择输出目录
  ipcMain.handle('gif-export:select-output-dir', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '选择 GIF 输出目录'
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // 导出所有卡片为 GIF/PNG
  ipcMain.handle(
    'gif-export:export-all',
    async (event, htmlString: string, options: GifExportOptions) => {
      const progressCallback = (progress: any): void => {
        event.sender.send('gif-export:progress', progress)
      }
      const exporter = new GifExporter(options, progressCallback)
      return await exporter.exportAllFromHtml(htmlString, options.singleFrame || false)
    }
  )

  // 导出单张卡片为 GIF/PNG
  ipcMain.handle(
    'gif-export:export-single',
    async (event, htmlString: string, cardIndex: number, options: GifExportOptions) => {
      const progressCallback = (progress: any): void => {
        event.sender.send('gif-export:progress', progress)
      }
      const exporter = new GifExporter(options, progressCallback)
      return await exporter.exportSingleFromHtml(
        htmlString,
        cardIndex,
        options.singleFrame || false
      )
    }
  )

  // 获取卡片信息
  ipcMain.handle('gif-export:get-card-info', async (_, htmlString: string) => {
    const exporter = new GifExporter()
    try {
      await exporter.init()
      await exporter.loadPageFromHtml(htmlString)
      return await exporter.getCardInfo()
    } finally {
      if (exporter['browser']) {
        await exporter['browser'].close()
      }
    }
  })
}
