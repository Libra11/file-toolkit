/**
 * Author: Libra
 * Date: 2024-10-07 00:28:07
 * LastEditors: Libra
 * Description:
 */
import FileConversionTool from '@renderer/components/FileConversionTool'
import { SettingsMenu } from '@renderer/components/SettingsMenu'
import CustomTitleBar from '@renderer/components/CustomTitleBar'

function App(): JSX.Element {
  return (
    <div className="w-screen h-screen bg-background flex flex-col">
      <CustomTitleBar />
      <div className="flex-1">
        <FileConversionTool />
        <SettingsMenu />
      </div>
    </div>
  )
}

export default App
