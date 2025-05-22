import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CompressionSettings } from './CompressionSettings'
import { IMAGE_QUALITY_PRESETS, IMAGE_FORMATS, WEBP_PRESETS } from './types'

// Enhanced Mock for useTranslation
const mockTranslations = {
  en: {
    dimensions: 'Dimensions',
    width: 'Width',
    height: 'Height',
    maintainAspectRatio: 'Maintain aspect ratio',
    advancedOptions: 'Advanced Options',
    'imageCompression.batchResizeToSameDimensionsLabel': 'Resize all to same dimensions?'
  },
  'zh-CN': {
    dimensions: '尺寸', // Example, actual value might differ
    width: '宽度', // Example
    height: '高度', // Example
    maintainAspectRatio: '保持宽高比', // Example
    advancedOptions: '高级选项', // Example
    'imageCompression.batchResizeToSameDimensionsLabel': '是否都选择压缩成同一尺寸'
  }
}

let currentLanguage = 'en' // Default language for tests

const mockUseTranslation = jest.fn(() => ({
  t: (key: string) => {
    // @ts-ignore
    return mockTranslations[currentLanguage]?.[key] || key
  },
  i18n: {
    changeLanguage: (lang: string) => {
      currentLanguage = lang
      // Potentially trigger a re-render if components are subscribed to i18n language changes.
      // For these tests, re-rendering the component after changing language should suffice.
      return Promise.resolve()
    },
    language: currentLanguage
  }
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => mockUseTranslation()
}))

// Helper to set language for tests
const setTestLanguage = (lang: 'en' | 'zh-CN') => {
  currentLanguage = lang
  // Update the mock implementation to reflect the new language in subsequent calls
  mockUseTranslation.mockImplementation(() => ({
    t: (key: string) => {
      // @ts-ignore
      return mockTranslations[currentLanguage]?.[key] || key;
    },
    i18n: {
      changeLanguage: (newLang: string) => {
        currentLanguage = newLang;
        return Promise.resolve();
      },
      language: currentLanguage,
    },
  }));
}


const mockOnQualityPresetChange = jest.fn()
const mockOnFormatChange = jest.fn()
const mockOnQualityChange = jest.fn()
const mockOnCompressionLevelChange = jest.fn()
const mockOnWidthChange = jest.fn()
const mockOnHeightChange = jest.fn()
const mockOnMaintainAspectRatioChange = jest.fn()
const mockOnWebpPresetChange = jest.fn()
const mockOnWebpLosslessChange = jest.fn()
const mockOnShowAdvancedChange = jest.fn()
const mockOnEnableBatchResizeChange = jest.fn()

const defaultProps = {
  qualityPreset: IMAGE_QUALITY_PRESETS.MEDIUM,
  outputFormat: IMAGE_FORMATS.JPG,
  qualityValue: 75,
  compressionLevel: 6,
  outputWidth: '',
  outputHeight: '',
  maintainAspectRatio: true,
  webpPreset: WEBP_PRESETS.DEFAULT,
  webpLossless: false,
  showAdvanced: true, // Set to true to ensure dimension controls are potentially visible
  imageInfo: { width: 1000, height: 800 },
  isBatchMode: false,
  enableBatchResize: false,
  onQualityPresetChange: mockOnQualityPresetChange,
  onFormatChange: mockOnFormatChange,
  onQualityChange: mockOnQualityChange,
  onCompressionLevelChange: mockOnCompressionLevelChange,
  onWidthChange: mockOnWidthChange,
  onHeightChange: mockOnHeightChange,
  onMaintainAspectRatioChange: mockOnMaintainAspectRatioChange,
  onWebpPresetChange: mockOnWebpPresetChange,
  onWebpLosslessChange: mockOnWebpLosslessChange,
  onShowAdvancedChange: mockOnShowAdvancedChange,
  onEnableBatchResizeChange: mockOnEnableBatchResizeChange
}

// Helper function to get dimension controls
// We check for the "Dimensions" label as the container, then specific inputs.
const getDimensionControls = () => {
  // The dimension controls (width, height, maintain aspect ratio) are grouped.
  // We look for the label "Dimensions" which is associated with this group.
  // The input fields for width and height, and the checkbox for aspect ratio.
  const widthInput = screen.queryByRole('spinbutton', { name: /width/i })
  const heightInput = screen.queryByRole('spinbutton', { name: /height/i })
  // The "Maintain aspect ratio" checkbox is identified by its label text.
  const maintainAspectCheckbox = screen.queryByRole('checkbox', { name: /maintain aspect ratio/i })
  return { widthInput, heightInput, maintainAspectCheckbox }
}


describe('CompressionSettings Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
    // Default to English for most tests, can be overridden
    setTestLanguage('en') 
  })

  // Note: The original batchResizeCheckboxLabel might need adjustment if tests depend on a specific language.
  // For new i18n tests, we will set the language explicitly.
  // const batchResizeCheckboxLabel = '是否都选择压缩成同一尺寸'; 

  describe('Batch Resize Checkbox Visibility', () => {
    it('should be visible when isBatchMode is true (checking with default English label)', () => {
      setTestLanguage('en') // Explicitly set for this test or rely on beforeEach
      render(<CompressionSettings {...defaultProps} isBatchMode={true} />)
      // Since the label text now comes from t(), we find it by the English text when lang is 'en'
      expect(screen.getByLabelText(mockTranslations.en['imageCompression.batchResizeToSameDimensionsLabel'])).toBeInTheDocument()
    })
    
    it('should be visible when isBatchMode is true (checking with Chinese label)', () => {
      setTestLanguage('zh-CN')
      render(<CompressionSettings {...defaultProps} isBatchMode={true} />)
      expect(screen.getByLabelText(mockTranslations['zh-CN']['imageCompression.batchResizeToSameDimensionsLabel'])).toBeInTheDocument()
    })

    it('should not be visible when isBatchMode is false', () => {
      render(<CompressionSettings {...defaultProps} isBatchMode={false} />)
      // Check against both possible labels or a more generic query if the element shouldn't exist
      expect(screen.queryByLabelText(mockTranslations.en['imageCompression.batchResizeToSameDimensionsLabel'])).not.toBeInTheDocument()
      expect(screen.queryByLabelText(mockTranslations['zh-CN']['imageCompression.batchResizeToSameDimensionsLabel'])).not.toBeInTheDocument()
    })
  })

  describe('Dimension Controls Visibility', () => {
    describe('When isBatchMode is true', () => {
      it('should not be visible if batch resize checkbox is unchecked', () => {
        render(
          <CompressionSettings
            {...defaultProps}
            isBatchMode={true}
            enableBatchResize={false}
          />
        )
        const { widthInput, heightInput, maintainAspectCheckbox } = getDimensionControls()
        expect(widthInput).not.toBeInTheDocument()
        expect(heightInput).not.toBeInTheDocument()
        expect(maintainAspectCheckbox).not.toBeInTheDocument()
      })

      it('should be visible if batch resize checkbox is checked', () => {
        render(
          <CompressionSettings
            {...defaultProps}
            isBatchMode={true}
            enableBatchResize={true}
          />
        )
        const { widthInput, heightInput, maintainAspectCheckbox } = getDimensionControls()
        expect(widthInput).toBeInTheDocument()
        expect(heightInput).toBeInTheDocument()
        expect(maintainAspectCheckbox).toBeInTheDocument()
      })
    })

    describe('When isBatchMode is false', () => {
      it('should be visible', () => {
        render(<CompressionSettings {...defaultProps} isBatchMode={false} />)
        const { widthInput, heightInput, maintainAspectCheckbox } = getDimensionControls()
        expect(widthInput).toBeInTheDocument()
        expect(heightInput).toBeInTheDocument()
        expect(maintainAspectCheckbox).toBeInTheDocument()
      })
    })
  })

  describe('State Changes for Batch Resize Checkbox', () => {
    it('should call onEnableBatchResizeChange with true when checked (using Chinese label for test)', () => {
      setTestLanguage('zh-CN') // Set language to Chinese for this specific test
      render(<CompressionSettings {...defaultProps} isBatchMode={true} />)
      const checkbox = screen.getByLabelText(mockTranslations['zh-CN']['imageCompression.batchResizeToSameDimensionsLabel'])
      fireEvent.click(checkbox)
      expect(mockOnEnableBatchResizeChange).toHaveBeenCalledTimes(1)
      expect(mockOnEnableBatchResizeChange).toHaveBeenCalledWith(true)
    })

    it('should call onEnableBatchResizeChange with false when unchecked after being checked (using English label for test)', () => {
      setTestLanguage('en') // Set language to English
      // Render with checkbox initially checked
      render(
        <CompressionSettings
          {...defaultProps}
          isBatchMode={true}
          enableBatchResize={true} 
        />
      )
      const checkbox = screen.getByLabelText(mockTranslations.en['imageCompression.batchResizeToSameDimensionsLabel'])
      fireEvent.click(checkbox) // This will uncheck it
      expect(mockOnEnableBatchResizeChange).toHaveBeenCalledTimes(1)
      expect(mockOnEnableBatchResizeChange).toHaveBeenCalledWith(false)
    })
  })

  describe('Internationalization for Batch Resize Label', () => {
    it('displays the English translation when language is set to en', () => {
      setTestLanguage('en')
      render(<CompressionSettings {...defaultProps} isBatchMode={true} />)
      expect(screen.getByLabelText(mockTranslations.en['imageCompression.batchResizeToSameDimensionsLabel'])).toBeInTheDocument()
      // Also check it's not the Chinese one, just to be sure
      expect(screen.queryByLabelText(mockTranslations['zh-CN']['imageCompression.batchResizeToSameDimensionsLabel'])).not.toBeInTheDocument()
    })

    it('displays the Chinese translation when language is set to zh-CN', () => {
      setTestLanguage('zh-CN')
      render(<CompressionSettings {...defaultProps} isBatchMode={true} />)
      expect(screen.getByLabelText(mockTranslations['zh-CN']['imageCompression.batchResizeToSameDimensionsLabel'])).toBeInTheDocument()
      // Also check it's not the English one
      expect(screen.queryByLabelText(mockTranslations.en['imageCompression.batchResizeToSameDimensionsLabel'])).not.toBeInTheDocument()
    })
  })
})

// A note on queryByRole for width/height inputs:
// The inputs are of type="number". In some testing setups, these might be implicitly
// role="spinbutton". If these tests fail to find inputs by this role,
// consider using screen.getByPlaceholderText with their respective placeholder values
// (e.g., imageInfo.width.toString()) or adding explicit test-ids.
// The "name" for queryByRole comes from the associated <Label htmlFor="id">,
// so the label text is used.
// For the "Maintain aspect ratio" checkbox, its label is used for identification.
// The "Dimensions" label is a general group label and less specific for individual controls.
// The `showAdvanced` prop is true by default in `defaultProps` to ensure the advanced section
// which contains dimension controls is open.
