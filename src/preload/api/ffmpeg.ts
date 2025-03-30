/*
 * @Author: Libra
 * @Date: 2024-12-20 10:11:52
 * @LastEditors: Libra
 * @Description:
 */
import { ipcRenderer } from 'electron'
import type { Ffmpeg } from '../types/ffmpeg'

export const ffmpeg: Ffmpeg = {
  convertMp4ToGif: async (inputPath, outputPath) => {
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
  convertPngToJpg: async (inputPath, outputPath) => {
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
  convertJpgToPng: async (inputPath, outputPath) => {
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
  convertWebpToJpg: async (inputPath, outputPath) => {
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
  convertJpgToWebp: async (inputPath, outputPath) => {
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
  convertPngToWebp: async (inputPath, outputPath) => {
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
  convertWebpToPng: async (inputPath, outputPath) => {
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
