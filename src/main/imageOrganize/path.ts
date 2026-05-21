/*
 * @Author: Libra
 * @Date: 2024-11-05 16:13:03
 * @LastEditors: Libra
 * @Description:
 */
import { app } from 'electron'
import * as path from 'path'
import type { NameRule } from '@shared/imageOrganizeRules'

// 原始文件命名规则
const originalFileNameRule = '身份证号_姓名'

export type { NameRule } from '@shared/imageOrganizeRules'

export interface PathConfig {
  originalFileNameRule: NameRule
  rootDir: string
  sourceDir: string
  excelPath: string
  flatDir: string
  categoryDir: string
  validDir: string
  renameDir: string
  resizeDir: string
  finalOutputDir: string
  successExcel: string
  failExcel: string
}

/**
 * 创建路径配置
 * @param config 用户指定的基础配置
 * @returns 完整的路径配置
 */
export function createPaths(config: {
  rootDir: string
  sourceDir: string
  excelPath: string
  nameRule?: NameRule
}): PathConfig {
  const { rootDir, sourceDir, excelPath, nameRule = originalFileNameRule as NameRule } = config

  return {
    originalFileNameRule: nameRule,
    rootDir,
    sourceDir,
    excelPath,
    // 平铺后的文件夹
    flatDir: path.join(rootDir, '1原始文件平铺'),
    // 分类后的文件夹
    categoryDir: path.join(rootDir, '2平铺文件分类'),
    // 分类后会剔除不符合格式的文件，符合格式的文件在 ./平铺文件分类/符合格式的文件
    validDir: path.join(rootDir, '2平铺文件分类/符合格式的文件'),
    // 将符合格式的文件重命名为身份证号
    renameDir: path.join(rootDir, '3重命名文件夹'),
    // 图片文件压缩
    resizeDir: path.join(rootDir, '4压缩后'),
    // 最终输出，有分类列时按分类创建子目录
    finalOutputDir: path.join(rootDir, '5最终输出'),
    // 成功的excel
    successExcel: path.join(rootDir, '6成功.xlsx'),
    // 失败的excel
    failExcel: path.join(rootDir, '7失败.xlsx')
  }
}

// 默认配置
export const defaultPaths = createPaths({
  rootDir: path.join(app.getPath('documents'), 'ImageOrganize/Results'),
  sourceDir: path.join(app.getPath('documents'), 'ImageOrganize/Source'),
  excelPath: path.join(app.getPath('documents'), 'ImageOrganize/students.xlsx')
})

export default defaultPaths
