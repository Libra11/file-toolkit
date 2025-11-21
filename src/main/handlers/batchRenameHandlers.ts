/*
 * @Author: Libra
 * @Date: 2025-01-09
 * @LastEditors: Libra
 * @Description: 批量重命名处理器
 */
import { ipcMain } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

export interface RenameRule {
  type: 'sequence' | 'replace' | 'prefix' | 'suffix' | 'regex' | 'timestamp' | 'extension'
  value: string
  options?: {
    startNumber?: number
    padding?: number
    replaceWith?: string
    format?: string
    preserveExtension?: boolean
    caseSensitive?: boolean
  }
}

export interface RenameTask {
  originalPath: string
  newName: string
  status: 'pending' | 'success' | 'error'
  error?: string
}

export interface RenamePreviewResult {
  tasks: RenameTask[]
  conflicts: string[]
}

/**
 * 应用重命名规则到文件名
 */
function applyRenameRule(fileName: string, rule: RenameRule, index: number): string {
  const ext = path.extname(fileName)
  const nameWithoutExt = path.basename(fileName, ext)

  switch (rule.type) {
    case 'sequence': {
      const startNum = rule.options?.startNumber || 1
      const padding = rule.options?.padding || 0
      const seqNum = (startNum + index).toString().padStart(padding, '0')
      return rule.options?.preserveExtension
        ? `${rule.value}${seqNum}${ext}`
        : `${rule.value}${seqNum}`
    }
    case 'replace': {
      const flags = rule.options?.caseSensitive ? 'g' : 'gi'
      const replaced = nameWithoutExt.replace(
        new RegExp(rule.value, flags),
        rule.options?.replaceWith || ''
      )
      return rule.options?.preserveExtension ? `${replaced}${ext}` : replaced
    }
    case 'prefix':
      return rule.options?.preserveExtension
        ? `${rule.value}${nameWithoutExt}${ext}`
        : `${rule.value}${nameWithoutExt}`

    case 'suffix':
      return rule.options?.preserveExtension
        ? `${nameWithoutExt}${rule.value}${ext}`
        : `${nameWithoutExt}${rule.value}`

    case 'regex': {
      try {
        const regex = new RegExp(rule.value, rule.options?.caseSensitive ? 'g' : 'gi')
        const regexReplaced = nameWithoutExt.replace(regex, rule.options?.replaceWith || '')
        return rule.options?.preserveExtension ? `${regexReplaced}${ext}` : regexReplaced
      } catch (error) {
        throw new Error(`Invalid regex: ${rule.value}`)
      }
    }
    case 'timestamp': {
      const now = new Date()
      const format = rule.options?.format || 'YYYY-MM-DD_HH-mm-ss'
      const timestamp = formatTimestamp(now, format)
      return rule.options?.preserveExtension ? `${timestamp}${ext}` : timestamp
    }
    case 'extension':
      return `${nameWithoutExt}.${rule.value}`

    default:
      return fileName
  }
}

/**
 * 格式化时间戳
 */
function formatTimestamp(date: Date, format: string): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', year.toString())
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 生成重命名预览
 */
async function generateRenamePreview(
  filePaths: string[],
  rules: RenameRule[]
): Promise<RenamePreviewResult> {
  const tasks: RenameTask[] = []
  const conflicts: string[] = []
  const usedNames = new Set<string>()

  for (let i = 0; i < filePaths.length; i++) {
    const filePath = filePaths[i]
    const fileName = path.basename(filePath)
    const dirPath = path.dirname(filePath)

    try {
      let newName = fileName

      // 依次应用所有规则
      for (const rule of rules) {
        newName = applyRenameRule(newName, rule, i)
      }

      // 检查新文件名是否为空或无效
      if (!newName || newName.trim() === '') {
        tasks.push({
          originalPath: filePath,
          newName: fileName,
          status: 'error',
          error: 'Generated name is empty'
        })
        continue
      }

      // 检查是否有重复的新文件名
      const newPath = path.join(dirPath, newName)
      if (usedNames.has(newPath.toLowerCase())) {
        conflicts.push(newName)
      } else {
        usedNames.add(newPath.toLowerCase())
      }

      // 检查目标文件是否已存在
      const targetExists = fs.existsSync(newPath) && newPath !== filePath
      if (targetExists) {
        conflicts.push(newName)
      }

      tasks.push({
        originalPath: filePath,
        newName,
        status: 'pending'
      })
    } catch (error) {
      tasks.push({
        originalPath: filePath,
        newName: fileName,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return { tasks, conflicts }
}

/**
 * 执行批量重命名
 */
async function executeBatchRename(tasks: RenameTask[]): Promise<RenameTask[]> {
  const results: RenameTask[] = []

  for (const task of tasks) {
    if (task.status === 'error') {
      results.push(task)
      continue
    }

    try {
      const dirPath = path.dirname(task.originalPath)
      const newPath = path.join(dirPath, task.newName)

      // 如果新路径和原路径相同，跳过
      if (newPath === task.originalPath) {
        results.push({
          ...task,
          status: 'success'
        })
        continue
      }

      // 检查目标文件是否存在
      if (fs.existsSync(newPath)) {
        results.push({
          ...task,
          status: 'error',
          error: 'Target file already exists'
        })
        continue
      }

      // 执行重命名
      fs.renameSync(task.originalPath, newPath)

      results.push({
        ...task,
        status: 'success'
      })
    } catch (error) {
      results.push({
        ...task,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return results
}

/**
 * 注册批量重命名处理器
 */
export function registerBatchRenameHandlers(): void {
  // 生成重命名预览
  ipcMain.handle('batch-rename:preview', async (_, filePaths: string[], rules: RenameRule[]) => {
    try {
      return await generateRenamePreview(filePaths, rules)
    } catch (error) {
      throw new Error(
        `Failed to generate rename preview: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  })

  // 执行批量重命名
  ipcMain.handle('batch-rename:execute', async (_, tasks: RenameTask[]) => {
    try {
      return await executeBatchRename(tasks)
    } catch (error) {
      throw new Error(
        `Failed to execute batch rename: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  })
}
