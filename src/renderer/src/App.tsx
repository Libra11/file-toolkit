/**
 * Author: Libra
 * Date: 2024-10-07 00:28:07
 * LastEditors: Libra
 * Description:
 */
import { useEffect } from 'react'
import './assets/index.css'
import AppLayout from './components/ui/layout/AppLayout'
import HomePage from './components/HomePage'
import UpdateNotification from './components/UpdateNotification'
import ChangelogPopup, { useChangelogPopup } from './components/ChangelogPopup'
import RegionSelectionOverlay from './components/ScreenRecorderTool/RegionSelectionOverlay'

function App(): JSX.Element {
  const { isOpen, currentVersion, hideChangelog, checkForNewChangelog, showChangelog } =
    useChangelogPopup()

  // 注册窗口最小化和关闭事件处理器
  useEffect(() => {
    const handleMinimize = (): void => {
      window.electron.ipcRenderer.invoke('minimize-window')
    }

    const handleClose = (): void => {
      window.electron.ipcRenderer.invoke('close-window')
    }

    window.addEventListener('minimize-window', handleMinimize)
    window.addEventListener('close-window', handleClose)

    return (): void => {
      window.removeEventListener('minimize-window', handleMinimize)
      window.removeEventListener('close-window', handleClose)
    }
  }, [])

  // 检查是否有新的更新日志需要显示
  useEffect(() => {
    checkForNewChangelog()
  }, [checkForNewChangelog])

  // 处理版本号点击事件
  const handleVersionClick = async (): Promise<void> => {
    try {
      const version = await window.system.getAppVersion()
      showChangelog(version)
    } catch (error) {
      console.error('Failed to get version for changelog:', error)
    }
  }

  // Check if we are in region selection mode
  const isRegionSelectionMode = new URLSearchParams(window.location.search).get('mode') === 'region-selection'

  if (isRegionSelectionMode) {
    return <RegionSelectionOverlay />
  }

  return (
    <AppLayout onVersionClick={handleVersionClick}>
      <HomePage />
      <UpdateNotification />
      <ChangelogPopup isOpen={isOpen} onClose={hideChangelog} version={currentVersion} />
    </AppLayout>
  )
}

export default App
