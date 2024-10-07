/*
 * @Author: Libra
 * @Date: 2024-10-07 00:34:22
 * @LastEditors: Libra
 * @Description:
 */

export interface Mp4ToGifOptions {
  scale: '320:-1' | '480:-1' | '640:-1' | '800:-1' | '1024:-1'
  fps: 10 | 15 | 20 | 25 | 30
}

export interface PngToJpgOptions {
  scale: '320:-1' | '480:-1' | '640:-1' | '800:-1' | '1024:-1'
  quality: number // 2-31
}

export interface JpgToPngOptions {
  scale: '320:-1' | '480:-1' | '640:-1' | '800:-1' | '1024:-1'
}

export type ConversionOptions = Mp4ToGifOptions & PngToJpgOptions & JpgToPngOptions
