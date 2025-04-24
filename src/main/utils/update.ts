/*
 * @Author: Libra
 * @Date: 2025-04-16 15:06:22
 * @LastEditors: Libra
 * @Description:
 */
import type { BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'

export default function checkUpdate(win: BrowserWindow | null): void {
  // 判断 windows 和 mac 平台
  if (process.platform === 'win32') {
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: 'https://libra321.oss-cn-huhehaote.aliyuncs.com/filetoolkit/win'
    })
  } else if (process.platform === 'darwin') {
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: 'https://libra321.oss-cn-huhehaote.aliyuncs.com/filetoolkit/mac'
    })
  }
  // if auto update or not, if true, when update-available, auto download
  autoUpdater.autoDownload = true
  // Whether to automatically install a downloaded update on app quit (if quitAndInstall was not called before).
  // autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.checkForUpdatesAndNotify()

  autoUpdater.on('error', function (error) {
    printUpdaterMessage('error', error?.message)
  })
  // check for update
  autoUpdater.on('checking-for-update', function () {
    printUpdaterMessage('checking')
  })
  // update available
  autoUpdater.on('update-available', function (info) {
    printUpdaterMessage('updateAvailable', undefined, info)
  })
  autoUpdater.on('update-not-available', function () {
    printUpdaterMessage('updateNotAvailable')
  })
  // download progress
  autoUpdater.on('download-progress', function (progressObj) {
    printUpdaterMessage('downloadProgress', undefined, progressObj)
  })
  autoUpdater.on('update-downloaded', function () {
    printUpdaterMessage('updateDownloaded')
    setTimeout(() => {
      autoUpdater.quitAndInstall(true, true)
    }, 3000)
  })

  type IArg =
    | 'error'
    | 'checking'
    | 'updateAvailable'
    | 'downloadProgress'
    | 'updateNotAvailable'
    | 'updateDownloaded'

  function printUpdaterMessage(arg: IArg, errorMessage?: string, data?: unknown): void {
    const message = {
      error: '更新出错',
      checking: '正在检查更新',
      updateAvailable: '检测到新版本',
      downloadProgress: '新版本下载中',
      updateNotAvailable: '无新版本',
      updateDownloaded: '更新下载完成，即将重启应用'
    }
    if (!win) return

    // 发送更新消息到渲染进程
    win.webContents.send('update-message', {
      type: arg,
      message: message[arg],
      error: errorMessage,
      data
    })
  }
}
