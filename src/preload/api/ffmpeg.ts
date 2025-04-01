/*
 * @Author: Libra
 * @Date: 2024-12-20 10:11:52
 * @LastEditors: Libra
 * @Description:
 */
import { ipcRenderer } from 'electron'
import type { Ffmpeg } from '../types/ffmpeg'

const imageConversion = {
  convertJpgToPng: async (inputPath: string, outputPath: string): Promise<string> => {
    try {
      console.log(`预加载脚本: 调用convertJpgToPng, 输入:${inputPath}, 输出:${outputPath}`)
      const result = await ipcRenderer.invoke('convert-jpg-to-png', inputPath, outputPath)
      console.log(`预加载脚本: convertJpgToPng成功, 结果:${result}`)
      return result
    } catch (error) {
      console.error('预加载脚本: convertJpgToPng错误:', error)
      throw error
    }
  },
  convertPngToJpg: async (inputPath: string, outputPath: string): Promise<string> => {
    try {
      console.log(`预加载脚本: 调用convertPngToJpg, 输入:${inputPath}, 输出:${outputPath}`)
      const result = await ipcRenderer.invoke('convert-png-to-jpg', inputPath, outputPath)
      console.log(`预加载脚本: convertPngToJpg成功, 结果:${result}`)
      return result
    } catch (error) {
      console.error('预加载脚本: convertPngToJpg错误:', error)
      throw error
    }
  },
  convertWebpToJpg: async (inputPath: string, outputPath: string): Promise<string> => {
    try {
      console.log(`预加载脚本: 调用convertWebpToJpg, 输入:${inputPath}, 输出:${outputPath}`)
      const result = await ipcRenderer.invoke('convert-webp-to-jpg', inputPath, outputPath)
      console.log(`预加载脚本: convertWebpToJpg成功, 结果:${result}`)
      return result
    } catch (error) {
      console.error('预加载脚本: convertWebpToJpg错误:', error)
      throw error
    }
  },
  convertJpgToWebp: async (inputPath: string, outputPath: string): Promise<string> => {
    try {
      console.log(`预加载脚本: 调用convertJpgToWebp, 输入:${inputPath}, 输出:${outputPath}`)
      const result = await ipcRenderer.invoke('convert-jpg-to-webp', inputPath, outputPath)
      console.log(`预加载脚本: convertJpgToWebp成功, 结果:${result}`)
      return result
    } catch (error) {
      console.error('预加载脚本: convertJpgToWebp错误:', error)
      throw error
    }
  },
  convertPngToWebp: async (inputPath: string, outputPath: string): Promise<string> => {
    try {
      console.log(`预加载脚本: 调用convertPngToWebp, 输入:${inputPath}, 输出:${outputPath}`)
      const result = await ipcRenderer.invoke('convert-png-to-webp', inputPath, outputPath)
      console.log(`预加载脚本: convertPngToWebp成功, 结果:${result}`)
      return result
    } catch (error) {
      console.error('预加载脚本: convertPngToWebp错误:', error)
      throw error
    }
  },
  convertWebpToPng: async (inputPath: string, outputPath: string): Promise<string> => {
    try {
      console.log(`预加载脚本: 调用convertWebpToPng, 输入:${inputPath}, 输出:${outputPath}`)
      const result = await ipcRenderer.invoke('convert-webp-to-png', inputPath, outputPath)
      console.log(`预加载脚本: convertWebpToPng成功, 结果:${result}`)
      return result
    } catch (error) {
      console.error('预加载脚本: convertWebpToPng错误:', error)
      throw error
    }
  }
}

const videoConversion = {
  convertMp4ToGif: async (inputPath: string, outputPath: string): Promise<string> => {
    try {
      console.log(`预加载脚本: 调用convertMp4ToGif, 输入:${inputPath}, 输出:${outputPath}`)
      const result = await ipcRenderer.invoke('convert-mp4-to-gif', inputPath, outputPath)
      console.log(`预加载脚本: convertMp4ToGif成功, 结果:${result}`)
      return result
    } catch (error) {
      console.error('预加载脚本: convertMp4ToGif错误:', error)
      throw error
    }
  },
  convertAviToMp4: async (inputPath: string, outputPath: string): Promise<string> => {
    try {
      console.log(`预加载脚本: 调用convertAviToMp4, 输入:${inputPath}, 输出:${outputPath}`)
      const result = await ipcRenderer.invoke('convert-avi-to-mp4', inputPath, outputPath)
      console.log(`预加载脚本: convertAviToMp4成功, 结果:${result}`)
      return result
    } catch (error) {
      console.error('预加载脚本: convertAviToMp4错误:', error)
      throw error
    }
  },
  convertMovToMp4: async (inputPath: string, outputPath: string): Promise<string> => {
    try {
      console.log(`预加载脚本: 调用convertMovToMp4, 输入:${inputPath}, 输出:${outputPath}`)
      const result = await ipcRenderer.invoke('convert-mov-to-mp4', inputPath, outputPath)
      console.log(`预加载脚本: convertMovToMp4成功, 结果:${result}`)
      return result
    } catch (error) {
      console.error('预加载脚本: convertPngToJpg错误:', error)
      throw error
    }
  },

  convertWebmToMp4: async (inputPath: string, outputPath: string): Promise<string> => {
    try {
      console.log(`预加载脚本: 调用convertWebmToMp4, 输入:${inputPath}, 输出:${outputPath}`)
      const result = await ipcRenderer.invoke('convert-webm-to-mp4', inputPath, outputPath)
      console.log(`预加载脚本: convertWebmToMp4成功, 结果:${result}`)
      return result
    } catch (error) {
      console.error('预加载脚本: convertWebmToMp4错误:', error)
      throw error
    }
  }
}

const audioConversion = {
  convertMp3ToWav: async (inputPath: string, outputPath: string): Promise<string> => {
    try {
      console.log(`预加载脚本: 调用convertMp3ToWav, 输入:${inputPath}, 输出:${outputPath}`)
      const result = await ipcRenderer.invoke('convert-mp3-to-wav', inputPath, outputPath)
      console.log(`预加载脚本: convertMp3ToWav成功, 结果:${result}`)
      return result
    } catch (error) {
      console.error('预加载脚本: convertMp3ToWav错误:', error)
      throw error
    }
  },
  convertWavToMp3: async (inputPath: string, outputPath: string): Promise<string> => {
    try {
      console.log(`预加载脚本: 调用convertWavToMp3, 输入:${inputPath}, 输出:${outputPath}`)
      const result = await ipcRenderer.invoke('convert-wav-to-mp3', inputPath, outputPath)
      console.log(`预加载脚本: convertWavToMp3成功, 结果:${result}`)
      return result
    } catch (error) {
      console.error('预加载脚本: convertWavToMp3错误:', error)
      throw error
    }
  },
  convertM4aToMp3: async (inputPath: string, outputPath: string): Promise<string> => {
    try {
      console.log(`预加载脚本: 调用convertM4aToMp3, 输入:${inputPath}, 输出:${outputPath}`)
      const result = await ipcRenderer.invoke('convert-m4a-to-mp3', inputPath, outputPath)
      console.log(`预加载脚本: convertM4aToMp3成功, 结果:${result}`)
      return result
    } catch (error) {
      console.error('预加载脚本: convertM4aToMp3错误:', error)
      throw error
    }
  },
  convertFlacToMp3: async (inputPath: string, outputPath: string): Promise<string> => {
    try {
      console.log(`预加载脚本: 调用convertFlacToMp3, 输入:${inputPath}, 输出:${outputPath}`)
      const result = await ipcRenderer.invoke('convert-flac-to-mp3', inputPath, outputPath)
      console.log(`预加载脚本: convertFlacToMp3成功, 结果:${result}`)
      return result
    } catch (error) {
      console.error('预加载脚本: convertFlacToMp3错误:', error)
      throw error
    }
  },
  convertMp3ToFlac: async (inputPath: string, outputPath: string): Promise<string> => {
    try {
      console.log(`预加载脚本: 调用convertMp3ToFlac, 输入:${inputPath}, 输出:${outputPath}`)
      const result = await ipcRenderer.invoke('convert-mp3-to-flac', inputPath, outputPath)
      console.log(`预加载脚本: convertMp3ToFlac成功, 结果:${result}`)
      return result
    } catch (error) {
      console.error('预加载脚本: convertMp3ToFlac错误:', error)
      throw error
    }
  }
}

export const ffmpeg: Ffmpeg = {
  ...videoConversion,
  ...imageConversion,
  ...audioConversion
}
