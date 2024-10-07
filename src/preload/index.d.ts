import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      convertMp4ToGif: (inputPath: string, outputPath: string, options: string) => Promise<string>
      selectDirectory: () => Promise<string | undefined>
      checkFileExists: (filePath: string) => Promise<boolean>
      saveFile: (filePath: string) => Promise<string>
      minimizeWindow: () => Promise<void>
      closeWindow: () => Promise<void>
    }
  }
}
