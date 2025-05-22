import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CompressionSettings } from './CompressionSettings'
import { IMAGE_QUALITY_PRESETS, IMAGE_FORMATS, WEBP_PRESETS } from './types'

// Mock useTranslation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      // Simple mock for translation keys
      if (key === 'dimensions') return 'Dimensions'
      if (key === 'width') return 'Width'
      if (key === 'height') return 'Height'
      if (key === 'maintainAspectRatio') return 'Maintain aspect ratio'
      if (key === 'advancedOptions') return 'Advanced Options' // Used for the button that shows/hides dimensions
      return key
    }
  })
}))

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
  })

  const batchResizeCheckboxLabel = '是否都选择压缩成同一尺寸' // This is the Chinese label from the component

  describe('Batch Resize Checkbox Visibility', () => {
    it('should be visible when isBatchMode is true', () => {
      render(<CompressionSettings {...defaultProps} isBatchMode={true} />)
      expect(screen.getByLabelText(batchResizeCheckboxLabel)).toBeInTheDocument()
    })

    it('should not be visible when isBatchMode is false', () => {
      render(<CompressionSettings {...defaultProps} isBatchMode={false} />)
      expect(screen.queryByLabelText(batchResizeCheckboxLabel)).not.toBeInTheDocument()
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
    it('should call onEnableBatchResizeChange with true when checked', () => {
      render(<CompressionSettings {...defaultProps} isBatchMode={true} />)
      const checkbox = screen.getByLabelText(batchResizeCheckboxLabel)
      fireEvent.click(checkbox)
      expect(mockOnEnableBatchResizeChange).toHaveBeenCalledTimes(1)
      expect(mockOnEnableBatchResizeChange).toHaveBeenCalledWith(true)
    })

    it('should call onEnableBatchResizeChange with false when unchecked after being checked', () => {
      // Render with checkbox initially checked
      render(
        <CompressionSettings
          {...defaultProps}
          isBatchMode={true}
          enableBatchResize={true} 
        />
      )
      const checkbox = screen.getByLabelText(batchResizeCheckboxLabel)
      fireEvent.click(checkbox) // This will uncheck it
      expect(mockOnEnableBatchResizeChange).toHaveBeenCalledTimes(1)
      expect(mockOnEnableBatchResizeChange).toHaveBeenCalledWith(false)
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
