/*
 * @Author: Libra
 * @Date: 2024-11-04 17:53:46
 * @LastEditors: Libra
 * @Description:
 */
import { promises as fs } from 'fs'
import * as fsSync from 'fs'
import * as path from 'path'
import { getNameRuleConfig } from '@shared/imageOrganizeRules'
import { PathConfig } from './path'
import { readImageOrganizeRecords } from './excel'

// 图片扩展名， 包括大小写
const imgExts: string[] = ['jpg', 'jpeg', 'png', 'JPG', 'JPEG', 'PNG']

// 分类结果类型
type CategoryResult = '符合格式的文件' | '非身份证号_姓名' | '普通文件名' | '其他格式'

// 分类统计结果接口
interface OrganizeResult {
  total: number
  categorized: Record<CategoryResult, number>
}

// 重命名结果接口
interface RenameResult {
  total: number
  success: number
  failed: number
  errors: Array<{
    file: string
    error: string
  }>
}

/**
 * 对文件名进行分类
 * @param filename 文件名
 * @param paths 路径配置对象
 * @returns 文件类型
 */
function categorizeFileName(filename: string, paths: PathConfig): CategoryResult {
  const ext = path.extname(filename).slice(1)
  const nameWithoutExt = path.basename(filename, path.extname(filename))
  const hasExt = Boolean(ext)

  // 如果文件名中没有下划线
  if (paths.originalFileNameRule !== '编号' && (!nameWithoutExt.includes('_') || !hasExt)) {
    return '普通文件名'
  }

  if (paths.originalFileNameRule === '编号') {
    return hasExt && imgExts.includes(ext) && nameWithoutExt ? '符合格式的文件' : '其他格式'
  }

  const nameParts = nameWithoutExt.split('_')
  if (nameParts.length !== 2) {
    return '其他格式'
  }

  const [part1, part2] = nameParts

  // 检查是否为身份证号（简单验证：18位数字或17位数字+X）
  const isIdCard = (str: string): boolean => /^\d{17}[\dX]$/.test(str)

  if (paths.originalFileNameRule === '身份证号_姓名') {
    if (isIdCard(part1)) {
      if (imgExts.includes(ext)) {
        return '符合格式的文件'
      } else {
        return '其他格式'
      }
    } else {
      return '非身份证号_姓名'
    }
  } else if (paths.originalFileNameRule === '姓名_身份证号') {
    if (isIdCard(part2)) {
      if (imgExts.includes(ext)) {
        return '符合格式的文件'
      } else {
        return '其他格式'
      }
    } else {
      return '其他格式'
    }
  } else {
    return '其他格式'
  }
}

function extractFileKey(file: string, paths: PathConfig): string {
  const nameWithoutExt = path.basename(file, path.extname(file))
  const ruleConfig = getNameRuleConfig(paths.originalFileNameRule)

  if (ruleConfig.fileKeySource === 'filename') {
    return nameWithoutExt
  }

  const nameParts = nameWithoutExt.split('_')
  return ruleConfig.fileKeyPart === 'second' ? nameParts[1] : nameParts[0]
}

function sanitizeFileName(value: string): string {
  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim()
}

/**
 * 创建目录（如果不存在）
 * @param dirPath 目录路径
 */
async function ensureDir(dirPath: string): Promise<void> {
  if (!fsSync.existsSync(dirPath)) {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

/**
 * 对照片目录下的文件进行分类整理
 * @param sourceDir 源目录（照片目录）
 * @param targetDir 目标目录（分类后的根目录）
 * @param paths 路径配置对象
 * @returns 分类结果统计
 */
export async function organizePhotos(
  sourceDir: string,
  targetDir: string,
  paths: PathConfig
): Promise<OrganizeResult> {
  // 确保源目录存在
  if (!fsSync.existsSync(sourceDir)) {
    throw new Error(`源目录 "${sourceDir}" 不存在`)
  }

  // 创建目标根目录
  await ensureDir(targetDir)

  // 读取源目录下的所有文件
  const files = await fs.readdir(sourceDir)
  const result: OrganizeResult = {
    total: files.length,
    categorized: {} as Record<CategoryResult, number>
  }

  // 并行处理所有文件
  await Promise.all(
    files.map(async (file) => {
      const category = categorizeFileName(file, paths)
      const sourcePath = path.join(sourceDir, file)
      const targetPath = path.join(targetDir, category, file)

      // 复制文件到对应分类目录
      await ensureDir(path.dirname(targetPath))
      await fs.copyFile(sourcePath, targetPath)

      // 统计结果
      result.categorized[category] = (result.categorized[category] || 0) + 1
    })
  )

  return result
}

/**
 * 按规则重命名待处理图片
 * @param paths 路径配置对象
 * @returns 处理结果统计
 */
export async function renameIdCardFiles(paths: PathConfig): Promise<RenameResult> {
  const ruleConfig = getNameRuleConfig(paths.originalFileNameRule)
  const sourceDir = ruleConfig.fileKeySource === 'filename' ? paths.flatDir : paths.validDir

  // 确保源目录存在
  if (!fsSync.existsSync(sourceDir)) {
    throw new Error(`源目录 "${sourceDir}" 不存在`)
  }

  // 创建目标目录
  await ensureDir(paths.renameDir)

  // 读取源目录下的所有文件
  const files = await fs.readdir(sourceDir)
  const result: RenameResult = {
    total: files.length,
    success: 0,
    failed: 0,
    errors: []
  }
  const records = await readImageOrganizeRecords(paths)
  const outputNameByFileKey = new Map(records.map((record) => [record.fileKey, record.outputName]))

  // 并行处理所有文件
  await Promise.all(
    files.map(async (file) => {
      try {
        // 分离文件名和扩展名
        const ext = path.extname(file)
        const fileKey = extractFileKey(file, paths)
        const mappedOutputName = outputNameByFileKey.get(fileKey)

        if (ruleConfig.fileKeySource === 'filename' && !mappedOutputName) {
          throw new Error(`Excel中未找到图片编号 "${fileKey}" 对应的输出命名字段`)
        }

        // 新文件名：规则配置指定的输出字段.原扩展名
        const outputName = sanitizeFileName(mappedOutputName || fileKey)
        const newFileName = `${outputName}${ext}`

        // 源文件和目标文件的完整路径
        const sourcePath = path.join(sourceDir, file)
        const targetPath = path.join(paths.renameDir, newFileName)

        // 复制并重命名文件
        await fs.copyFile(sourcePath, targetPath)
        result.success++
      } catch (error) {
        result.failed++
        result.errors.push({
          file,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    })
  )

  return result
}

/**
 * 统计指定目录下的文件数量
 * @param dirPath 要统计的目录路径
 * @returns 文件数量
 */
export async function countFiles(dirPath: string): Promise<number> {
  // 确保目录存在
  if (!fsSync.existsSync(dirPath)) {
    throw new Error(`目录 "${dirPath}" 不存在`)
  }

  // 读取目录下的所有文件
  const files = await fs.readdir(dirPath)

  // 过滤掉目录，只计算文件数量
  const stats = await Promise.all(files.map((file) => fs.stat(path.join(dirPath, file))))

  const fileCount = stats.filter((stat) => stat.isFile()).length

  return fileCount
}
