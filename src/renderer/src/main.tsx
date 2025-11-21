import './assets/index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './i18n' // Import the i18n configuration

// 初始化暗黑模式
const isDarkMode =
  localStorage.getItem('darkMode') === 'true' ||
  window.matchMedia('(prefers-color-scheme: dark)').matches

if (isDarkMode) {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
