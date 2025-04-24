/*
 * @Author: Libra
 * @Date: 2024-11-05 16:22:13
 * @LastEditors: Libra
 * @Description:
 */
import { createPaths, PathConfig, NameRule } from './path'
import { flattenDirectory } from './flat'
import { organizePhotos, renameIdCardFiles } from './category'
import { runExport } from './export'
import { exec, spawn } from 'child_process'
import * as path from 'path'
import { app, BrowserWindow } from 'electron'

// 进度更新函数类型
type ProgressCallback = (status: string, percentage?: number) => void

/**
 * 处理图片的主流程
 */
export async function processImages({
  rootDir,
  sourceDir,
  excelPath,
  nameRule = '身份证号_姓名',
  updateProgress = (): void => {}
}: {
  rootDir: string
  sourceDir: string
  excelPath: string
  nameRule?: NameRule
  updateProgress?: ProgressCallback
}): Promise<void> {
  // 创建路径配置
  const paths = createPaths({ rootDir, sourceDir, excelPath, nameRule })

  // 每次执行前，先删除 rootDir 目录下的所有文件
  updateProgress('正在清理目录...', 5)
  try {
    await new Promise<void>((resolve, reject) => {
      exec(`rm -rf ${paths.rootDir}/*`, (error) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  } catch (error) {
    console.error('清理目录时发生错误:', error)
    throw new Error(`清理目录失败: ${error instanceof Error ? error.message : String(error)}`)
  }

  // 1. 平铺文件夹
  updateProgress('正在平铺文件...', 10)
  try {
    await flattenDirectory(paths.sourceDir, paths)
  } catch (error) {
    console.error('平铺文件夹失败:', error)
    throw new Error(`平铺文件夹失败: ${error instanceof Error ? error.message : String(error)}`)
  }

  // 2. 对文件名进行分类
  updateProgress('正在分类文件...', 30)
  try {
    await organizePhotos(paths.flatDir, paths.categoryDir, paths)
  } catch (error) {
    console.error('文件分类失败:', error)
    throw new Error(`文件分类失败: ${error instanceof Error ? error.message : String(error)}`)
  }

  // 3. 重命名符合格式的文件
  updateProgress('正在重命名文件...', 50)
  try {
    await renameIdCardFiles(paths)
  } catch (error) {
    console.error('文件重命名失败:', error)
    throw new Error(`文件重命名失败: ${error instanceof Error ? error.message : String(error)}`)
  }

  // 4. 压缩重命名后的图片
  updateProgress('正在压缩图片...', 60)
  try {
    await compressImages(paths)
  } catch (error) {
    console.error('图片压缩失败:', error)
    throw new Error(`图片压缩失败: ${error instanceof Error ? error.message : String(error)}`)
  }

  // 5. 根据excel进行分类
  updateProgress('正在根据Excel分类...', 80)
  try {
    await runExport(paths)
  } catch (error) {
    console.error('Excel分类失败:', error)
    throw new Error(`Excel分类失败: ${error instanceof Error ? error.message : String(error)}`)
  }

  updateProgress('处理完成', 100)
}

/**
 * 压缩图片
 */
async function compressImages(paths: PathConfig): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    // 使用相对于应用的路径
    const fullPath = app.isPackaged
      ? path.join(process.resourcesPath, 'resources', 'compress.sh')
      : path.join(process.cwd(), 'resources', 'compress.sh')
    const fullRenameDir = path.resolve(paths.renameDir)
    const fullResizeDir = path.resolve(paths.resizeDir)

    const compress = spawn('bash', [fullPath, `${fullRenameDir}/`, `${fullResizeDir}/`])

    let error = ''

    // 处理标准输出，获取进度信息
    compress.stdout.on('data', (data: Buffer) => {
      const output = data.toString()
      // 匹配进度信息，格式如：处理进度: [60%] (120/200) 当前文件: example.jpg
      const progressMatch = output.match(/处理进度: \[(\d+)%\] \((\d+)\/(\d+)\) 当前文件: (.+)/)

      if (progressMatch) {
        const percentage = parseInt(progressMatch[1], 10)
        const current = parseInt(progressMatch[2], 10)
        const total = parseInt(progressMatch[3], 10)
        const filename = progressMatch[4]

        console.log(`正在压缩图片(${current}/${total}): ${filename}`)

        // 获取主窗口发送进度更新事件
        const mainWindow = BrowserWindow.getAllWindows()[0]
        if (mainWindow) {
          mainWindow.webContents.send('image-organize:progress-update', {
            status: `正在压缩图片(${current}/${total}): ${filename}`,
            percentage: 60 + percentage * 0.2 // 在60%-80%之间，因为整个流程的压缩部分是60%-80%
          })
        }
      }
    })

    // 处理错误输出
    compress.stderr.on('data', (data: Buffer) => {
      const errorMessage = data.toString()
      console.error('压缩脚本错误:', errorMessage)
      error += errorMessage
    })

    // 处理结束
    compress.on('close', (code: number) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`压缩脚本异常退出，退出码: ${code}${error ? '\n' + error : ''}`))
      }
    })
  })
}
