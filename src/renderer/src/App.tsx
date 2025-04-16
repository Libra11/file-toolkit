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

function App(): JSX.Element {
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

    console.log('version 1.0.1')

    return (): void => {
      window.removeEventListener('minimize-window', handleMinimize)
      window.removeEventListener('close-window', handleClose)
    }
  }, [])

  return (
    <AppLayout>
      <HomePage />
      <UpdateNotification />
    </AppLayout>
  )
}

export default App
