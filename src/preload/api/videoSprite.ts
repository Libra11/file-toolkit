import { ipcRenderer } from 'electron'

export interface VideoSpriteConfig {
  totalFrames: number  // 总共提取多少帧
  scale?: number
  columns: number
  rows?: number
  format?: 'png' | 'jpg'
}

export interface SpriteGifConfig {
  fps: number
  frameWidth: number
  frameHeight: number
  rows: number
  columns: number
  totalFrames?: number
}

export const videoSprite = {
  selectVideo: (): Promise<string | null> => ipcRenderer.invoke('video-sprite:select-video'),
  selectImage: (): Promise<string | null> => ipcRenderer.invoke('video-sprite:select-image'),
  
  // 视频 -> 拼图
  videoToSprite: (params: {
    videoPath: string
    outputDir: string
    config: VideoSpriteConfig
  }): Promise<{ success: boolean; outputPath: string; error?: string }> => 
    ipcRenderer.invoke('video-sprite:video-to-sprite', params),

  // 拼图 -> GIF
  spriteToGif: (params: {
    imagePath: string
    outputDir: string
    config: SpriteGifConfig
  }): Promise<{ success: boolean; outputPath: string; error?: string }> =>
    ipcRenderer.invoke('video-sprite:sprite-to-gif', params)
}
