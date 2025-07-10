import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import ImageCompressionTool from './index'
import { IMAGE_FORMATS } from './types' // Import necessary types

// --- Mocks ---

// Mock child components
jest.mock('./CompressionSettings', () => ({
  CompressionSettings: jest.fn((props) => (
    <div data-testid="mock-compression-settings">
      <button onClick={() => props.onEnableBatchResizeChange(!props.enableBatchResize)}>
        Toggle Batch Resize
      </button>
      <input
        type="number"
        aria-label="width-input"
        value={props.outputWidth || ''}
        onChange={(e) => props.onWidthChange(e.target.value ? Number(e.target.value) : '')}
      />
      <input
        type="number"
        aria-label="height-input"
        value={props.outputHeight || ''}
        onChange={(e) => props.onHeightChange(e.target.value ? Number(e.target.value) : '')}
      />
      <button onClick={() => props.onShowAdvancedChange(!props.showAdvanced)}>
        Toggle Advanced
      </button>
    </div>
  ))
}))
jest.mock('./FileUploader', () => ({
  FileUploader: jest.fn(({ onFileSelect, batchMode }) => (
    <button
      data-testid="mock-file-uploader"
      onClick={() =>
        onFileSelect([
          new File(['dummy'], batchMode ? 'dummy-batch.png' : 'dummy-single.png', {
            type: 'image/png',
            // @ts-ignore
            path: batchMode ? 'path/to/dummy-batch.png' : 'path/to/dummy-single.png'
          })
        ])
      }
    >
      Upload
    </button>
  ))
}))
jest.mock('./ImagePreview', () => ({
  ImagePreview: jest.fn(() => <div data-testid="mock-image-preview" />)
}))
jest.mock('./CompressedPreview', () => ({
  CompressedPreview: jest.fn(({ onReset }) => (
    <div data-testid="mock-compressed-preview">
      <button onClick={onReset}>Reset from CompressedPreview</button>
    </div>
  ))
}))
jest.mock('./FileList', () => ({
  FileList: jest.fn(() => <div data-testid="mock-file-list" />)
}))
jest.mock('./BatchCompressionResult', () => ({
  BatchCompressionResult: jest.fn(({ onReset }) => (
    <div data-testid="mock-batch-result">
      <button onClick={onReset}>Reset from BatchResult</button>
    </div>
  ))
}))

// Mock Electron APIs
const mockCompressImage = jest.fn(() =>
  Promise.resolve({
    outputPath: 'path/to/compressed.jpg',
    compressedSize: 1024,
    newWidth: 800,
    newHeight: 600
  })
)
const mockSaveFile = jest.fn(() => Promise.resolve('path/to/output.jpg'))
const mockSelectDirectory = jest.fn(() => Promise.resolve('path/to/output_dir'))

global.window.compression = {
  compressImage: mockCompressImage
}
global.window.system = {
  saveFile: mockSaveFile,
  selectDirectory: mockSelectDirectory,
  // Add other system functions if needed by the component, e.g. openFile
  openFile: jest.fn()
}

// Mock useTranslation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key // Simple pass-through mock
  })
}))

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/dummy-url')
global.URL.revokeObjectURL = jest.fn()

// --- Helper Functions ---
const getMockCompressionSettingsProps = () => {
  const { CompressionSettings } = require('./CompressionSettings')
  // @ts-ignore
  return CompressionSettings.mock.calls[CompressionSettings.mock.calls.length - 1][0]
}

// --- Tests ---
describe('ImageCompressionTool Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Ensure CompressionSettings mock is reset for prop checking
    const { CompressionSettings } = require('./CompressionSettings')
    // @ts-ignore
    CompressionSettings.mockClear()
  })

  const switchToBatchMode = () => {
    fireEvent.click(screen.getByText('batchMode'))
  }

  const switchToSingleMode = () => {
    fireEvent.click(screen.getByText('singleFileMode'))
  }

  const triggerFileUpload = () => {
    fireEvent.click(screen.getByTestId('mock-file-uploader'))
  }

  const triggerCompression = async () => {
    await act(async () => {
      fireEvent.click(screen.getByText('compress')) // Assumes button text is 'compress' for single
    })
  }

  const triggerBatchCompression = async () => {
    await act(async () => {
      fireEvent.click(screen.getByText('compressAll')) // Assumes button text is 'compressAll' for batch
    })
  }

  test('1. Initial state: enableBatchResize is initially false for CompressionSettings in batch mode', () => {
    render(<ImageCompressionTool />)
    switchToBatchMode()
    const props = getMockCompressionSettingsProps()
    expect(props.enableBatchResize).toBe(false)
  })

  describe('2. Passing state to CompressionSettings', () => {
    test('receives enableBatchResize and its updater, and state updates correctly', () => {
      render(<ImageCompressionTool />)
      switchToBatchMode()

      let props = getMockCompressionSettingsProps()
      expect(props.enableBatchResize).toBe(false)
      expect(typeof props.onEnableBatchResizeChange).toBe('function')

      // Simulate CompressionSettings calling onEnableBatchResizeChange
      act(() => {
        props.onEnableBatchResizeChange(true)
      })

      props = getMockCompressionSettingsProps()
      expect(props.enableBatchResize).toBe(true)

      act(() => {
        props.onEnableBatchResizeChange(false)
      })

      props = getMockCompressionSettingsProps()
      expect(props.enableBatchResize).toBe(false)
    })
  })

  describe('3. Compression options in Batch Mode', () => {
    beforeEach(async () => {
      render(<ImageCompressionTool />)
      switchToBatchMode()
      // Upload a file to enable compression button
      await act(async () => {
        triggerFileUpload()
      })
      // Open advanced settings to allow width/height changes
      const settingsProps = getMockCompressionSettingsProps()
      if (!settingsProps.showAdvanced) {
        act(() => {
          settingsProps.onShowAdvancedChange(true)
        })
      }
    })

    test('Scenario 1: Batch resize enabled - includes width/height in options', async () => {
      const settingsProps = getMockCompressionSettingsProps()
      act(() => {
        settingsProps.onEnableBatchResizeChange(true)
        settingsProps.onWidthChange(800)
        settingsProps.onHeightChange(600)
        // Assuming onMaintainAspectRatioChange is also a prop if it affects options directly
        // settingsProps.onMaintainAspectRatioChange(true);
      })

      await triggerBatchCompression()

      expect(mockSelectDirectory).toHaveBeenCalled() // Pre-requisite for batch
      expect(mockCompressImage).toHaveBeenCalledWith(
        expect.any(String), // filePath
        expect.stringContaining('compressed_dummy-batch.png'), // outputPath
        expect.objectContaining({
          width: 800,
          height: 600
          // maintainAspectRatio is not explicitly passed if width AND height are given
        })
      )
    })

    test('Scenario 2: Batch resize disabled - does not include width/height in options', async () => {
      const settingsProps = getMockCompressionSettingsProps()
      act(() => {
        settingsProps.onEnableBatchResizeChange(false)
        // Set some dimensions to ensure they are NOT passed
        settingsProps.onWidthChange(1024)
        settingsProps.onHeightChange(768)
      })

      await triggerBatchCompression()

      expect(mockSelectDirectory).toHaveBeenCalled()
      expect(mockCompressImage).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('compressed_dummy-batch.png'),
        expect.not.objectContaining({ width: expect.any(Number), height: expect.any(Number) })
      )
      // Also check that they are undefined or not present
      const options = mockCompressImage.mock.calls[0][2]
      expect(options.width).toBeUndefined()
      expect(options.height).toBeUndefined()
    })
  })

  describe('4. Compression options in Single Image Mode', () => {
    beforeEach(async () => {
      render(<ImageCompressionTool />)
      switchToSingleMode()
      // Upload a file
      await act(async () => {
        triggerFileUpload()
      })
      // Open advanced settings
      const settingsProps = getMockCompressionSettingsProps()
      if (!settingsProps.showAdvanced) {
        act(() => {
          settingsProps.onShowAdvancedChange(true)
        })
      }
    })

    test('includes width/height in options when set', async () => {
      const settingsProps = getMockCompressionSettingsProps()
      act(() => {
        settingsProps.onWidthChange(1024)
        settingsProps.onHeightChange(768)
      })

      await triggerCompression()

      expect(mockSaveFile).toHaveBeenCalled() // Pre-requisite for single
      expect(mockCompressImage).toHaveBeenCalledWith(
        expect.any(String), // filePath
        'path/to/output.jpg', // outputPath from mockSaveFile
        expect.objectContaining({
          width: 1024,
          height: 768
        })
      )
    })

    test('does not include width/height in options when not set', async () => {
      const settingsProps = getMockCompressionSettingsProps()
      act(() => {
        settingsProps.onWidthChange('') // Clear dimensions
        settingsProps.onHeightChange('')
      })

      await triggerCompression()

      expect(mockSaveFile).toHaveBeenCalled()
      expect(mockCompressImage).toHaveBeenCalledWith(
        expect.any(String),
        'path/to/output.jpg',
        expect.not.objectContaining({ width: expect.any(Number), height: expect.any(Number) })
      )
      const options = mockCompressImage.mock.calls[0][2]
      expect(options.width).toBeUndefined()
      expect(options.height).toBeUndefined()
    })
  })

  describe('5. Resetting state', () => {
    test('enableBatchResize is reset to false when mode is toggled (which calls resetState)', () => {
      render(<ImageCompressionTool />)
      switchToBatchMode()

      let props = getMockCompressionSettingsProps()
      act(() => {
        props.onEnableBatchResizeChange(true)
      })

      props = getMockCompressionSettingsProps()
      expect(props.enableBatchResize).toBe(true) // Confirm it's true

      // Switch to single and back to batch to trigger reset
      switchToSingleMode()
      switchToBatchMode()

      props = getMockCompressionSettingsProps()
      expect(props.enableBatchResize).toBe(false)
    })

    test('enableBatchResize is reset to false when a reset button in a child is clicked', async () => {
      render(<ImageCompressionTool />)
      switchToBatchMode()
      await act(async () => triggerFileUpload()) // Upload files to show FileList then batch compress

      let props = getMockCompressionSettingsProps()
      act(() => {
        props.onEnableBatchResizeChange(true)
      })
      props = getMockCompressionSettingsProps()
      expect(props.enableBatchResize).toBe(true) // Confirm it's true

      // Simulate batch compression to show BatchCompressionResult which has a reset
      await triggerBatchCompression()

      // At this point, BatchCompressionResult should be visible
      // Its mock contains a button that calls onReset
      const resetButton = screen.getByText('Reset from BatchResult')
      act(() => {
        fireEvent.click(resetButton)
      })

      // After reset, it should be back to the FileUploader state in batch mode
      // We need to check the props of CompressionSettings again.
      // Since resetState clears selectedFiles, FileUploader is shown.
      // To see CompressionSettings, we need to upload files again.
      await act(async () => triggerFileUpload())

      props = getMockCompressionSettingsProps()
      expect(props.enableBatchResize).toBe(false)
    })
  })
})
