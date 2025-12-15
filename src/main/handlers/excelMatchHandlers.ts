import { ipcMain, dialog } from 'electron'
import fs from 'fs'
import path from 'path'
import * as XLSX from 'xlsx'

export const registerExcelMatchHandlers = (): void => {
  // 选择文件夹
  ipcMain.handle('excel-match:select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  })

  // 扫描文件夹文件
  ipcMain.handle('excel-match:scan-folder', async (_, folderPath: string) => {
    try {
      if (!fs.existsSync(folderPath)) return []
      const files = fs.readdirSync(folderPath)
      // 只返回文件，不返回目录，且过滤隐藏文件
      return files.filter((file) => {
        const fullPath = path.join(folderPath, file)
        // 忽略临时文件
        if (file.startsWith('.') || file.startsWith('~$')) return false
        try {
          return fs.statSync(fullPath).isFile()
        } catch {
          return false
        }
      })
    } catch (error) {
      console.error('Scan folder error:', error)
      return []
    }
  })

  // 读取 Excel表头和数据
  ipcMain.handle('excel-match:read-excel', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls', 'csv'] }]
    })

    if (result.canceled || result.filePaths.length === 0) return null

    const filePath = result.filePaths[0]
    try {
      const fileBuffer = fs.readFileSync(filePath)
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      
      // header: 1 返回二维数组，第一行就是表头
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

      if (!rawData || rawData.length === 0) return { path: filePath, headers: [], data: [] }

      // 假设第一行是表头
      const headers = rawData[0].map(h => String(h))
      
      // 剩下的转为对象数组
      // range: 1 表示跳过第一行(header)
      const data = XLSX.utils.sheet_to_json(worksheet, { header: headers, range: 1 })

      return {
        path: filePath,
        headers,
        data
      }
    } catch (e) {
      console.error('Read excel error:', e)
      throw e
    }
  })

  // 执行重命名/复制任务
  interface MatchTask {
    originalPath: string
    newFilename: string
  }

  ipcMain.handle(
    'excel-match:execute',
    async (_, { tasks, targetDir, overwrite = false }: { tasks: MatchTask[]; targetDir?: string; overwrite: boolean }) => {
      const results = { success: 0, fail: 0, errors: [] as string[] }

      // 如果有 targetDir，确保它存在
      if (targetDir && !fs.existsSync(targetDir)) {
        try {
          await fs.promises.mkdir(targetDir, { recursive: true })
        } catch (e) {
          return { success: 0, fail: tasks.length, errors: [`无法创建目标目录: ${e}`] }
        }
      }

      for (const task of tasks) {
        try {
          const src = task.originalPath
          const baseName = task.newFilename
          
          let destDir = path.dirname(src)
          if (targetDir) {
            destDir = targetDir
          }
          
          const dest = path.join(destDir, baseName)

          // 无论是否是原目录，只要路径不一样才需要移动/复制
          if (src === dest) {
            results.fail++
            results.errors.push(`源文件和目标文件路径相同: ${path.basename(src)}`)
            continue
          }

          // Check if dest exists
          let destExists = false
          try {
            await fs.promises.access(dest)
            destExists = true
          } catch {
            destExists = false
          }

          if (destExists && !overwrite) {
            results.fail++
            results.errors.push(`目标文件已存在: ${baseName}`)
            continue
          }

          // 异步复制
          await fs.promises.copyFile(src, dest)
          
          results.success++
        } catch (e) {
          results.fail++
          results.errors.push(`文件 ${path.basename(task.originalPath)} 处理失败: ${e}`)
        }
      }
      return results
    }
  )
}
