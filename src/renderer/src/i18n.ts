/*
 * @Author: Libra
 * @Date: 2024-10-07 02:01:49
 * @LastEditors: Libra
 * @Description:
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enTranslations from './locales/en.json'
import zhTranslations from './locales/zh.json'

// 在资源对象中添加新的翻译键
const resources = {
  en: { translation: enTranslations },
  zh: { translation: zhTranslations }
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'en', // Default language
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
})

export default i18n
