/*
 * @Author: Libra
 * @Date: 2024-10-07 02:01:49
 * @LastEditors: Libra
 * @Description:
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enTranslations from './locales/en.json'
import zhTranslations from './locales/zh-CN.json'

// 从localStorage获取用户上次选择的语言
const savedLanguage = localStorage.getItem('language')
// 获取浏览器语言，如果以zh开头则使用中文，否则使用英文
const browserLanguage = navigator.language.startsWith('zh') ? 'zh' : 'en'
// 默认语言顺序：1.存储的语言 2.浏览器语言 3.英文
const defaultLanguage = savedLanguage || browserLanguage || 'en'

// 在资源对象中添加新的翻译键
const resources = {
  en: { translation: enTranslations },
  zh: { translation: zhTranslations }
}

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
})

export default i18n
