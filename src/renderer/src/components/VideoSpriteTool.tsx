import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Film,
  Image,
  Grid3x3,
  Play,
  Download,
  Settings,
  RefreshCw,
  FileImage,
  FileVideo,
  ArrowRight
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { toast } from '@renderer/components/ui/toast'
import { BackToHomeButton } from './ui/BackToHomeButton'

interface VideoSpriteToolProps {
  onBack?: () => void
}

export function VideoSpriteTool({ onBack }: VideoSpriteToolProps): JSX.Element {
  const { t } = useTranslation()

  // 视频转拼图状态
  const [videoPath, setVideoPath] = useState<string>('')
  const [videoOutputDir, setVideoOutputDir] = useState<string>('')
  const [videoTotalFrames, setVideoTotalFrames] = useState<number>(6)
  const [videoScale, setVideoScale] = useState<number>(0.5)
  const [videoColumns, setVideoColumns] = useState<number>(3)
  const [videoFormat, setVideoFormat] = useState<'png' | 'jpg'>('png')
  const [isVideoProcessing, setIsVideoProcessing] = useState(false)

  // 拼图转GIF状态
  const [imagePath, setImagePath] = useState<string>('')
  const [imageOutputDir, setImageOutputDir] = useState<string>('')
  const [imageFps, setImageFps] = useState<number>(10)
  const [frameWidth, setFrameWidth] = useState<number>(100)
  const [frameHeight, setFrameHeight] = useState<number>(100)
  const [gridRows, setGridRows] = useState<number>(2)
  const [gridColumns, setGridColumns] = useState<number>(3)
  const [totalFrames, setTotalFrames] = useState<number>(6)
  const [isImageProcessing, setIsImageProcessing] = useState(false)

  // 选择视频
  const handleSelectVideo = async (): Promise<void> => {
    const path = await window.videoSprite.selectVideo()
    if (path) {
      setVideoPath(path)
      // 设置默认输出目录为视频所在目录
      const dir = path.substring(0, path.lastIndexOf('/'))
      setVideoOutputDir(dir)
    }
  }

  // 选择图片
  const handleSelectImage = async (): Promise<void> => {
    const path = await window.videoSprite.selectImage()
    if (path) {
      setImagePath(path)
      const dir = path.substring(0, path.lastIndexOf('/'))
      setImageOutputDir(dir)
    }
  }

  // 选择输出目录
  const handleSelectOutputDir = async (type: 'video' | 'image'): Promise<void> => {
    const result = await window.system.selectDirectory()
    if (result) {
      if (type === 'video') {
        setVideoOutputDir(result)
      } else {
        setImageOutputDir(result)
      }
    }
  }

  // 视频转拼图
  const handleVideoToSprite = async (): Promise<void> => {
    if (!videoPath) {
      toast.warning({ title: t('vsSelectVideoFirst') })
      return
    }

    setIsVideoProcessing(true)
    const startTime = Date.now()

    try {
      const result = await window.videoSprite.videoToSprite({
        videoPath,
        outputDir: videoOutputDir || videoPath.substring(0, videoPath.lastIndexOf('/')),
        config: {
          totalFrames: videoTotalFrames,
          scale: videoScale,
          columns: videoColumns,
          format: videoFormat
        }
      })

      // 最小加载时间
      const elapsed = Date.now() - startTime
      if (elapsed < 800) {
        await new Promise((resolve) => setTimeout(resolve, 800 - elapsed))
      }

      if (result.success) {
        toast.success({
          title: t('vsExportSuccess'),
          description: result.outputPath
        })
      } else {
        toast.error({
          title: t('vsExportFailed'),
          description: result.error
        })
      }
    } catch (e) {
      toast.error({ title: t('error'), description: String(e) })
    } finally {
      setIsVideoProcessing(false)
    }
  }

  // 拼图转GIF
  const handleSpriteToGif = async (): Promise<void> => {
    if (!imagePath) {
      toast.warning({ title: t('vsSelectImageFirst') })
      return
    }

    setIsImageProcessing(true)
    const startTime = Date.now()

    try {
      const result = await window.videoSprite.spriteToGif({
        imagePath,
        outputDir: imageOutputDir || imagePath.substring(0, imagePath.lastIndexOf('/')),
        config: {
          fps: imageFps,
          frameWidth,
          frameHeight,
          rows: gridRows,
          columns: gridColumns,
          totalFrames
        }
      })

      // 最小加载时间
      const elapsed = Date.now() - startTime
      if (elapsed < 800) {
        await new Promise((resolve) => setTimeout(resolve, 800 - elapsed))
      }

      if (result.success) {
        toast.success({
          title: t('vsExportSuccess'),
          description: result.outputPath
        })
      } else {
        toast.error({
          title: t('vsExportFailed'),
          description: result.error
        })
      }
    } catch (e) {
      toast.error({ title: t('error'), description: String(e) })
    } finally {
      setIsImageProcessing(false)
    }
  }

  return (
    <div className="h-full w-full overflow-hidden">
      {/* 外层渐变卡片 */}
      <div className="flex flex-col h-full rounded-[32px] border border-white/60 bg-gradient-to-br from-violet-50/50 via-white/80 to-cyan-50/50 backdrop-blur-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900 p-6 md:p-8 overflow-hidden">
        {/* Header */}
        <div className="shrink-0 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-violet-600 backdrop-blur-sm dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300">
              <Grid3x3 className="h-3.5 w-3.5" />
              {t('videoSpriteTool')}
            </span>

            {onBack && (
              <BackToHomeButton
                onClick={onBack}
                className="rounded-full shadow-sm hover:shadow-md transition-all bg-white text-slate-600 hover:text-violet-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-violet-400"
              />
            )}
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
              {t('videoSpriteTool')}
            </h1>
            <p className="text-base text-slate-500 dark:text-slate-400 max-w-2xl">
              {t('videoSpriteDescription')}
            </p>
          </div>
        </div>

        {/* 内层白色卡片 */}
        <div className="flex-1 min-h-0 overflow-hidden rounded-[24px] border border-white bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/50">
          <Tabs defaultValue="video-to-sprite" className="h-full flex flex-col">
            <div className="border-b border-slate-100 dark:border-slate-800 px-6 pt-4">
              <TabsList className="bg-slate-100/50 dark:bg-slate-800/50">
                <TabsTrigger
                  value="video-to-sprite"
                  className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
                >
                  <Film className="h-4 w-4" />
                  {t('vsVideoToSprite')}
                </TabsTrigger>
                <TabsTrigger
                  value="sprite-to-gif"
                  className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
                >
                  <Image className="h-4 w-4" />
                  {t('vsSpriteToGif')}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* 视频转拼图 */}
            <TabsContent value="video-to-sprite" className="flex-1 overflow-auto p-6 m-0">
              <div className="max-w-2xl mx-auto space-y-8">
                {/* 选择视频 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400">
                      <FileVideo className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {t('vsSelectVideo')}
                    </h3>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full justify-start h-12 rounded-xl border-slate-200 bg-white shadow-sm hover:border-violet-300 hover:ring-2 hover:ring-violet-100 text-left font-normal transition-all dark:border-slate-700 dark:bg-slate-800"
                    onClick={handleSelectVideo}
                  >
                    <Film className="mr-3 h-4 w-4 text-violet-500/80 shrink-0" />
                    {videoPath ? (
                      <span className="truncate text-sm font-medium">
                        {videoPath.split('/').pop()}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-sm">{t('select')}</span>
                    )}
                  </Button>
                </div>

                {/* 配置 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400">
                      <Settings className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {t('vsConfig')}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-500 uppercase">
                        {t('vsTotalFrames')}
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={videoTotalFrames}
                        onChange={(e) => setVideoTotalFrames(Number(e.target.value))}
                        className="h-10 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-500 uppercase">
                        {t('vsScale')}
                      </Label>
                      <Select
                        value={String(videoScale)}
                        onValueChange={(v) => setVideoScale(Number(v))}
                      >
                        <SelectTrigger className="h-10 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">100%</SelectItem>
                          <SelectItem value="0.75">75%</SelectItem>
                          <SelectItem value="0.5">50%</SelectItem>
                          <SelectItem value="0.25">25%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-500 uppercase">
                        {t('vsColumns')}
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        value={videoColumns}
                        onChange={(e) => setVideoColumns(Number(e.target.value))}
                        className="h-10 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-500 uppercase">
                        {t('vsFormat')}
                      </Label>
                      <Select
                        value={videoFormat}
                        onValueChange={(v: 'png' | 'jpg') => setVideoFormat(v)}
                      >
                        <SelectTrigger className="h-10 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="png">PNG</SelectItem>
                          <SelectItem value="jpg">JPG</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* 输出目录 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                      <Download className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {t('outputFolder')}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={videoOutputDir}
                      readOnly
                      placeholder={t('vsOutputDir')}
                      className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800/70 dark:border-slate-700 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    <Button
                      variant="outline"
                      className="h-10 rounded-xl px-4 border-slate-200 bg-white hover:border-violet-300 hover:ring-2 hover:ring-violet-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-violet-400 dark:hover:ring-violet-500/30"
                      onClick={() => handleSelectOutputDir('video')}
                    >
                      {t('select')}
                    </Button>
                  </div>
                </div>

                {/* 执行按钮 */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-4"
                >
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:from-violet-700 hover:to-cyan-600 shadow-lg shadow-violet-500/20 active:scale-[0.98] transition-all rounded-xl h-12"
                    disabled={!videoPath || isVideoProcessing}
                    onClick={handleVideoToSprite}
                  >
                    {isVideoProcessing ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="mr-2 h-4 w-4" />
                    )}
                    {isVideoProcessing ? t('processing') : t('vsGenerateSprite')}
                  </Button>
                </motion.div>
              </div>
            </TabsContent>

            {/* 拼图转GIF */}
            <TabsContent value="sprite-to-gif" className="flex-1 overflow-auto p-6 m-0">
              <div className="max-w-2xl mx-auto space-y-8">
                {/* 选择图片 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                      <FileImage className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {t('vsSelectImage')}
                    </h3>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full justify-start h-12 rounded-xl border-slate-200 bg-white shadow-sm hover:border-emerald-300 hover:ring-2 hover:ring-emerald-100 text-left font-normal transition-all dark:border-slate-700 dark:bg-slate-800"
                    onClick={handleSelectImage}
                  >
                    <Image className="mr-3 h-4 w-4 text-emerald-500/80 shrink-0" />
                    {imagePath ? (
                      <span className="truncate text-sm font-medium">
                        {imagePath.split('/').pop()}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-sm">{t('select')}</span>
                    )}
                  </Button>
                </div>

                {/* 帧配置 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                      <Grid3x3 className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {t('vsFrameConfig')}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-500 uppercase">
                        {t('vsFrameWidth')}
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={frameWidth}
                        onChange={(e) => setFrameWidth(Number(e.target.value))}
                        className="h-10 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-500 uppercase">
                        {t('vsFrameHeight')}
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={frameHeight}
                        onChange={(e) => setFrameHeight(Number(e.target.value))}
                        className="h-10 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-500 uppercase">
                        {t('vsRows')}
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={gridRows}
                        onChange={(e) => setGridRows(Number(e.target.value))}
                        className="h-10 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-500 uppercase">
                        {t('vsColumns')}
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={gridColumns}
                        onChange={(e) => setGridColumns(Number(e.target.value))}
                        className="h-10 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-500 uppercase">
                        {t('vsTotalFrames')}
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={totalFrames}
                        onChange={(e) => setTotalFrames(Number(e.target.value))}
                        className="h-10 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-500 uppercase">
                        {t('vsFps')}
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        value={imageFps}
                        onChange={(e) => setImageFps(Number(e.target.value))}
                        className="h-10 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* 输出目录 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                      <Download className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {t('outputFolder')}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={imageOutputDir}
                      readOnly
                      placeholder={t('vsOutputDir')}
                      className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800/70 dark:border-slate-700 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    <Button
                      variant="outline"
                      className="h-10 rounded-xl px-4 border-slate-200 bg-white hover:border-violet-300 hover:ring-2 hover:ring-violet-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-violet-400 dark:hover:ring-violet-500/30"
                      onClick={() => handleSelectOutputDir('image')}
                    >
                      {t('select')}
                    </Button>
                  </div>
                </div>

                {/* 执行按钮 */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-4"
                >
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-emerald-600 to-cyan-500 text-white hover:from-emerald-700 hover:to-cyan-600 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all rounded-xl h-12"
                    disabled={!imagePath || isImageProcessing}
                    onClick={handleSpriteToGif}
                  >
                    {isImageProcessing ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    {isImageProcessing ? t('processing') : t('vsGenerateGif')}
                  </Button>
                </motion.div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
