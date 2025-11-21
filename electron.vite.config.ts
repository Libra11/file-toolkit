/*
 * @Author: Libra
 * @Date: 2024-10-07 00:28:07
 * @LastEditors: Libra
 * @Description:
 */
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@': resolve('src'),
        '@main': resolve('src/main'),
        '@renderer': resolve('src/renderer/src'),
        '@preload': resolve('src/preload'),
        '@shared': resolve('src/shared')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@': resolve('src'),
        '@main': resolve('src/main'),
        '@renderer': resolve('src/renderer/src'),
        '@preload': resolve('src/preload'),
        '@shared': resolve('src/shared')
      }
    }
  },
  renderer: {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve('src'),
        '@main': resolve('src/main'),
        '@renderer': resolve('src/renderer/src'),
        '@preload': resolve('src/preload'),
        '@shared': resolve('src/shared')
      }
    }
  }
})
