/*
 * @Author: Libra
 * @Date: 2024-10-07 00:28:07
 * @LastEditors: Libra
 * @Description:
 */
import { app, shell, BrowserWindow, ipcMain, protocol } from 'electron'
import path, { join } from 'path'
import { electronApp, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import '@main/ffmpeg'
import checkUpdate from './utils/update'
import { registerAllHandlers } from './handlers'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 450,
    height: 660,
    show: false,
    resizable: true,
    autoHideMenuBar: true,
    frame: false, // Add this line to remove the default frame
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      webSecurity: false, // 允许访问媒体设备
      allowRunningInsecureContent: true, // 允许不安全内容以支持媒体访问
      nodeIntegration: false,
      experimentalFeatures: true // 启用实验性功能
    }
  })

  // Add these IPC handlers
  ipcMain.handle('minimize-window', () => {
    if (mainWindow) {
      mainWindow.minimize()
    }
  })

  ipcMain.handle('close-window', () => {
    if (mainWindow) {
      app.quit()
    }
  })

  mainWindow.on('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Handle media permissions for camera and microphone
  mainWindow.webContents.session.setPermissionRequestHandler((_, permission, callback, details) => {
    console.log('权限请求:', permission, details)
    // 允许所有媒体相关权限
    if (
      permission === 'media' ||
      permission === 'camera' ||
      permission === 'microphone' ||
      permission === 'display-capture'
    ) {
      console.log('✅ 允许权限:', permission)
      callback(true)
    } else {
      console.log('❌ 拒绝权限:', permission)
      callback(false)
    }
  })

  // Handle permission check requests
  mainWindow.webContents.session.setPermissionCheckHandler(
    (_, permission, requestingOrigin, details) => {
      console.log('权限检查:', permission, requestingOrigin, details)
      if (
        permission === 'media' ||
        permission === 'videoCapture' ||
        permission === 'audioCapture'
      ) {
        console.log('✅ 权限检查通过:', permission)
        return true
      }
      console.log('❌ 权限检查失败:', permission)
      return false
    }
  )

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // 设置应用权限，确保媒体设备访问
  app.commandLine.appendSwitch('enable-media-stream')
  app.commandLine.appendSwitch('enable-usermedia-screen-capturing')
  app.commandLine.appendSwitch('auto-select-desktop-capture-source', 'Electron')

  // 忽略证书错误（对于本地开发）
  app.commandLine.appendSwitch('ignore-certificate-errors')
  app.commandLine.appendSwitch('disable-web-security')
  // Register custom protocol
  protocol.registerFileProtocol('myapp', (request, callback) => {
    const url = request.url.slice('myapp://'.length)
    const decodedPath = decodeURIComponent(url)
    try {
      return callback(path.normalize(decodedPath))
    } catch (error) {
      console.error('Failed to register protocol', error)
    }
  })
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Add IPC handler for getting app version
  ipcMain.handle('get-app-version', () => {
    return app.getVersion()
  })

  // 注册所有IPC处理程序
  registerAllHandlers()

  createWindow()
  checkUpdate(mainWindow)

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
