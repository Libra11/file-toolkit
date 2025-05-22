import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SettingsMenu } from './SettingsMenu' // Adjust path as necessary

// --- Mocks ---

// Mock window.system.getAppVersion
const mockGetAppVersion = jest.fn()
global.window.system = {
  // Spread other system functions if SettingsMenu uses them, or mock them individually.
  // For now, only getAppVersion is critical for this test suite.
  // Ensure all functions expected by the component are mocked if not part of this test.
  ...global.window.system, // Preserve other system functions if they exist
  getAppVersion: mockGetAppVersion
}

// Mock useSettings hook
const mockUpdateSettings = jest.fn()
const mockUseSettings = jest.fn(() => ({
  settings: {
    isDarkMode: false,
    language: 'en'
    // Add other settings properties if SettingsMenu depends on them
  },
  updateSettings: mockUpdateSettings
}))
jest.mock('@renderer/hooks/useSettings', () => ({
  useSettings: () => mockUseSettings()
}))

// Enhanced Mock for useTranslation (similar to CompressionSettings.test.tsx)
const mockTranslations = {
  en: {
    settings: 'Settings',
    language: 'Language',
    selectLanguage: 'Select a language',
    darkMode: 'Dark Mode',
    openSettings: 'Open Settings',
    versionLabel: 'Version: {{version}}'
  },
  'zh-CN': {
    settings: '设置',
    language: '语言',
    selectLanguage: '选择语言',
    darkMode: '暗黑模式',
    openSettings: '打开设置',
    versionLabel: '版本号: {{version}}'
  }
}

let currentLanguage = 'en' // Default language

const mockI18nInstance = {
  changeLanguage: jest.fn((lang: string) => {
    currentLanguage = lang
    return Promise.resolve()
  }),
  get language() {
    return currentLanguage
  }
}

const mockActualUseTranslation = jest.fn(() => ({
  t: (key: string, options?: { version?: string }) => {
    let translation = currentLanguage === 'en' ? mockTranslations.en[key] : mockTranslations['zh-CN'][key]
    if (!translation) return key
    if (options?.version && translation.includes('{{version}}')) {
      translation = translation.replace('{{version}}', options.version)
    }
    return translation
  },
  i18n: mockI18nInstance
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => mockActualUseTranslation()
}))

// Helper to set language for tests
const setTestLanguage = async (lang: 'en' | 'zh-CN') => {
  await mockI18nInstance.changeLanguage(lang)
  // This mock update ensures that subsequent calls to useTranslation() get the updated i18n instance
  mockActualUseTranslation.mockImplementation(() => ({
    t: (key: string, options?: { version?: string }) => {
      let translation = currentLanguage === 'en' ? mockTranslations.en[key] : mockTranslations['zh-CN'][key]
      if (!translation) return key
      if (options?.version && translation.includes('{{version}}')) {
        translation = translation.replace('{{version}}', options.version)
      }
      return translation
    },
    i18n: mockI18nInstance
  }))
}


// --- Tests ---
describe('SettingsMenu Component', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    // Reset to English before each test
    await setTestLanguage('en') 
    // Reset useSettings mock to default values for each test
    mockUseSettings.mockImplementation(() => ({
      settings: {
        isDarkMode: false,
        language: currentLanguage, // Ensure this reflects the test language
      },
      updateSettings: mockUpdateSettings,
    }));
  })

  const openSettingsDialog = () => {
    // The DialogTrigger is a Button with a specific sr-only text or icon
    // Using the icon title or accessible name if possible is more robust.
    // For now, let's assume there's a button that opens settings.
    // The component uses "Open Settings" as sr-only text for the button.
    fireEvent.click(screen.getByText('Open Settings', { selector: 'span.sr-only' }).closest('button')!)
  }

  describe('Fetching and Displaying Version', () => {
    test('Successful fetch: displays the correct version string', async () => {
      const testVersion = '1.2.3'
      mockGetAppVersion.mockResolvedValue(testVersion)
      
      render(<SettingsMenu />)
      openSettingsDialog()

      // Wait for the version text to appear
      const versionText = mockTranslations.en.versionLabel.replace('{{version}}', testVersion)
      expect(await screen.findByText(versionText)).toBeInTheDocument()
      expect(mockGetAppVersion).toHaveBeenCalledTimes(1)
    })

    test('Failed fetch: displays "N/A" as the version', async () => {
      mockGetAppVersion.mockRejectedValue(new Error('API Error'))
      
      render(<SettingsMenu />)
      openSettingsDialog()

      // The component currently hardcodes "N/A" on error.
      // If we were to translate "N/A", this test would change.
      const fallbackVersionText = mockTranslations.en.versionLabel.replace('{{version}}', 'N/A')
      expect(await screen.findByText(fallbackVersionText)).toBeInTheDocument()
      expect(mockGetAppVersion).toHaveBeenCalledTimes(1)
    })
  })

  describe('Internationalization of "Version" label', () => {
    const testVersion = '1.2.3'
    beforeEach(() => {
      mockGetAppVersion.mockResolvedValue(testVersion)
    })

    test('Displays version in English', async () => {
      await setTestLanguage('en')
      render(<SettingsMenu />)
      openSettingsDialog()
      
      const versionText = mockTranslations.en.versionLabel.replace('{{version}}', testVersion)
      expect(await screen.findByText(versionText)).toBeInTheDocument()
    })

    test('Displays version in Chinese', async () => {
      await setTestLanguage('zh-CN')
      render(<SettingsMenu />)
      openSettingsDialog()

      const versionText = mockTranslations['zh-CN'].versionLabel.replace('{{version}}', testVersion)
      expect(await screen.findByText(versionText)).toBeInTheDocument()
    })
  })
})
