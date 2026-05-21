/*
 * @Author: Libra
 * @Date: 2024-11-01 09:48:56
 * @LastEditors: Libra
 * @Description:
 */

import * as fs from 'fs-extra'
import * as path from 'path'
import { PathConfig } from './path'
import * as xlsx from 'xlsx'
import { ImageOrganizeRecord, readImageOrganizeRecords } from './excel'

/**
 * 处理结果接口
 */
interface ProcessResult {
  successRecords: ImageOrganizeRecord[]
  failRecords: ImageOrganizeRecord[]
}

function sanitizePathPart(value: string): string {
  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim()
}

/**
 * 复制对应的图片到最终输出目录
 * @param records Excel映射记录
 * @param sourceDir 源图片文件夹路径
 * @param targetDir 目标文件夹路径
 */
async function copyMappedImages(
  records: ImageOrganizeRecord[],
  sourceDir: string,
  targetDir: string
): Promise<ProcessResult> {
  const files = await fs.readdir(sourceDir)
  let found = 0
  let notFound = 0
  const successRecords: ImageOrganizeRecord[] = []
  const failRecords: ImageOrganizeRecord[] = []

  await fs.ensureDir(targetDir)

  for (const record of records) {
    // 查找匹配的文件（格式：输出命名字段.后缀）
    const matchedFile = files.find((file) => {
      const fileOutputName = path.parse(file).name // 获取不带后缀的文件名
      return fileOutputName === sanitizePathPart(record.outputName)
    })

    if (matchedFile) {
      const outputDir = record.category
        ? path.join(targetDir, sanitizePathPart(record.category))
        : targetDir
      const sourcePath = path.join(sourceDir, matchedFile)
      const targetPath = path.join(outputDir, matchedFile)

      try {
        await fs.ensureDir(outputDir)
        await fs.copy(sourcePath, targetPath)
        found++
        console.log(`已复制到 ${outputDir}: ${matchedFile}`)
        successRecords.push(record)
      } catch (error) {
        console.error(`复制失败 ${matchedFile}:`, error)
        failRecords.push(record)
      }
    } else {
      console.log(`未找到图片: ${record.outputName}`)
      notFound++
      failRecords.push(record)
    }
  }

  console.log('\n处理完成:')
  console.log(`成功复制: ${found} 个文件`)
  console.log(`未找到: ${notFound} 个文件`)

  return { successRecords, failRecords }
}

/**
 * 写入处理结果到Excel
 * @param records 记录数组
 * @param outputPath 输出路径
 */
async function writeResultToExcel(
  records: ImageOrganizeRecord[],
  outputPath: string
): Promise<void> {
  try {
    // 确保输出目录存在
    await fs.ensureDir(path.dirname(outputPath))

    // 创建工作簿和工作表
    const workbook = xlsx.utils.book_new()
    const headers = ['图片匹配字段', '输出文件名', '分类']
    const data = [
      headers,
      ...records.map((record) => [record.fileKey, record.outputName, record.category || ''])
    ]
    const worksheet = xlsx.utils.aoa_to_sheet(data)
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

    // 生成buffer
    const wbout = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // 使用fs写入文件
    await fs.writeFile(outputPath, wbout)
    console.log(`记录已写入: ${outputPath}`)
  } catch (err: any) {
    console.error(`写入Excel文件失败: ${outputPath}`, err)
    throw new Error(`写入Excel文件失败: ${err.message}`)
  }
}

/**
 * 执行导出操作
 * @param paths 路径配置对象
 */
export async function runExport(paths: PathConfig): Promise<void> {
  const config = {
    sourceImageDir: paths.resizeDir,
    targetImageDir: paths.finalOutputDir,
    outputExcel: paths.successExcel,
    failExcel: paths.failExcel
  }

  try {
    const records = await readImageOrganizeRecords(paths)
    console.log(`从Excel中读取到 ${records.length} 条记录`)

    const { successRecords, failRecords } = await copyMappedImages(
      records,
      config.sourceImageDir,
      config.targetImageDir
    )

    if (successRecords.length > 0) {
      await writeResultToExcel(successRecords, config.outputExcel)
    }

    if (failRecords.length > 0) {
      await writeResultToExcel(failRecords, config.failExcel)
    }
  } catch (error) {
    console.error('程序执行出错:', error)
    throw error
  }
}
