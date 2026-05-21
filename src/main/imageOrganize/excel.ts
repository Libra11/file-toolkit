/*
 * @Author: Libra
 * @Date: 2026-05-09 00:00:00
 * @LastEditors: Libra
 * @Description: 图片整理 Excel 映射读取
 */
import * as xlsx from 'xlsx'
import * as fs from 'fs-extra'
import type { ExcelColumnConfig } from '@shared/imageOrganizeRules'
import { getNameRuleConfig } from '@shared/imageOrganizeRules'
import { PathConfig } from './path'

export interface ImageOrganizeRecord {
  fileKey: string
  outputName: string
  category?: string
}

function normalizeCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}

function findColumnIndex(headers: string[], columnConfig: ExcelColumnConfig): number {
  const index = headers.findIndex((header) =>
    columnConfig.keywords.some((keyword) => normalizeCellValue(header).includes(keyword))
  )

  if (index === -1 && columnConfig.required) {
    throw new Error(
      `Excel文件必须包含${columnConfig.label}列（支持列名：${columnConfig.keywords.join('、')}）`
    )
  }

  return index
}

export async function readImageOrganizeRecords(paths: PathConfig): Promise<ImageOrganizeRecord[]> {
  const fileBuffer = await fs.readFile(paths.excelPath)
  const workbook = xlsx.read(fileBuffer)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][]

  const [headers = [], ...rows] = data
  const normalizedHeaders = headers.map(normalizeCellValue)
  const { excelColumns } = getNameRuleConfig(paths.originalFileNameRule)

  const fileKeyIndex = findColumnIndex(normalizedHeaders, excelColumns.fileKey)
  const outputNameIndex = findColumnIndex(normalizedHeaders, excelColumns.outputName)
  const categoryIndex = findColumnIndex(normalizedHeaders, excelColumns.category)

  return rows
    .map((row) => ({
      fileKey: normalizeCellValue(row[fileKeyIndex]),
      outputName: normalizeCellValue(row[outputNameIndex]),
      category:
        categoryIndex === -1 ? undefined : normalizeCellValue(row[categoryIndex]) || undefined
    }))
    .filter((record) => record.fileKey && record.outputName)
}
