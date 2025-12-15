import { ipcRenderer } from 'electron'

export const excelMatch = {
  selectFolder: (): Promise<string | null> => ipcRenderer.invoke('excel-match:select-folder'),
  scanFolder: (path: string): Promise<string[]> => ipcRenderer.invoke('excel-match:scan-folder', path),
  readExcel: (): Promise<{ path: string; headers: string[]; data: any[] } | null> =>
    ipcRenderer.invoke('excel-match:read-excel'),
  execute: (args: {
    tasks: { originalPath: string; newFilename: string }[]
    targetDir?: string
    overwrite?: boolean
  }): Promise<{ success: number; fail: number; errors: string[] }> =>
    ipcRenderer.invoke('excel-match:execute', args)
}
