/*
 * @Author: Libra
 * @Date: 2025-11-21 14:03:47
 * @LastEditTime: 2025-11-21 15:25:34
 * @LastEditors: Libra
 * @Description:
 */
import { ipcMain, desktopCapturer, BrowserWindow, screen } from 'electron'
import { is } from '@electron-toolkit/utils'
import { join } from 'path'

let selectionWindow: BrowserWindow | null = null

export function registerScreenRecorderHandlers(): void {
  ipcMain.handle('get-screen-sources', async () => {
    const sources = await desktopCapturer.getSources({ types: ['screen'] })
    return sources.map((source) => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL()
    }))
  })

  ipcMain.handle('open-region-selection-window', () => {
    if (selectionWindow) {
      selectionWindow.focus()
      return
    }

    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height, x, y } = primaryDisplay.bounds

    selectionWindow = new BrowserWindow({
      width,
      height,
      x,
      y,
      frame: false,
      transparent: true,
      // fullscreen: true, // Caused black screen on some macOS versions/setups
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      enableLargerThanScreen: true,
      hasShadow: false,
      backgroundColor: '#00000000', // Fully transparent
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        contextIsolation: true,
        nodeIntegration: false
      }
    })

    // Load the same URL but with a query param
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      selectionWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?mode=region-selection`)
    } else {
      selectionWindow.loadFile(join(__dirname, '../renderer/index.html'), {
        search: 'mode=region-selection'
      })
    }

    selectionWindow.on('closed', () => {
      selectionWindow = null
    })
  })

  ipcMain.on('close-region-selection', () => {
    if (selectionWindow) {
      selectionWindow.close()
    }
  })

  ipcMain.on('region-selected', (_event, bounds) => {
    console.log('[Main] Region selected:', bounds)

    const allWindows = BrowserWindow.getAllWindows()
    console.log('[Main] Found windows:', allWindows.length)

    // Send to all windows
    allWindows.forEach((win) => {
      console.log('[Main] Checking window ID:', win.id)
      // Check if this is the selection window
      if (selectionWindow && win.id === selectionWindow.id) {
        console.log('[Main] Skipping selection window ID:', win.id)
        return
      }

      console.log('[Main] Sending region-selected-success to window ID:', win.id)
      win.webContents.send('region-selected-success', bounds)
      win.show()
      win.focus()
    })

    // Close selection window with a slight delay to ensure message is sent
    if (selectionWindow) {
      console.log('[Main] scheduling selection window close')
      setTimeout(() => {
        if (selectionWindow) {
          selectionWindow.close()
        }
      }, 100)
    }
  })
}
