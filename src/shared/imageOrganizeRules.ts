/*
 * @Author: Libra
 * @Date: 2026-05-09 00:00:00
 * @LastEditors: Libra
 * @Description: 图片整理命名规则配置
 */

export type NameRule = '身份证号_姓名' | '姓名_身份证号' | '编号'

export type FileKeySource = 'filename-part' | 'filename'

export interface ExcelColumnConfig {
  label: string
  keywords: string[]
  required: boolean
  defaultValue?: string
}

export interface NameRuleConfig {
  label: string
  fileKeySource: FileKeySource
  fileKeyPart?: 'first' | 'second'
  excelColumns: {
    fileKey: ExcelColumnConfig
    outputName: ExcelColumnConfig
    category: ExcelColumnConfig
  }
}

const idCardKeywords = ['证件号码', '证件号', '身份证号', '身份证']
const categoryKeywords = ['分类', '试卷类型', '试卷', '考试类型']

export const nameRuleConfigs: Record<NameRule, NameRuleConfig> = {
  身份证号_姓名: {
    label: '身份证号_姓名',
    fileKeySource: 'filename-part',
    fileKeyPart: 'first',
    excelColumns: {
      fileKey: {
        label: '证件号码',
        keywords: idCardKeywords,
        required: true
      },
      outputName: {
        label: '证件号码',
        keywords: idCardKeywords,
        required: true
      },
      category: {
        label: '分类',
        keywords: categoryKeywords,
        required: false
      }
    }
  },
  姓名_身份证号: {
    label: '姓名_身份证号',
    fileKeySource: 'filename-part',
    fileKeyPart: 'second',
    excelColumns: {
      fileKey: {
        label: '证件号码',
        keywords: idCardKeywords,
        required: true
      },
      outputName: {
        label: '证件号码',
        keywords: idCardKeywords,
        required: true
      },
      category: {
        label: '分类',
        keywords: categoryKeywords,
        required: false
      }
    }
  },
  编号: {
    label: '编号 -> 身份证号',
    fileKeySource: 'filename',
    excelColumns: {
      fileKey: {
        label: '编号',
        keywords: ['编号', '唯一编号', '序号', '考生号', '准考证号', '报名号'],
        required: true
      },
      outputName: {
        label: '证件号码',
        keywords: idCardKeywords,
        required: true
      },
      category: {
        label: '分类',
        keywords: categoryKeywords,
        required: false
      }
    }
  }
}

export function getNameRuleConfig(nameRule: NameRule): NameRuleConfig {
  return nameRuleConfigs[nameRule]
}

export function getRequiredExcelColumnLabels(nameRule: NameRule): string[] {
  const { excelColumns } = getNameRuleConfig(nameRule)

  return Array.from(
    new Set(
      Object.values(excelColumns)
        .filter((column) => column.required)
        .map((column) => column.label)
    )
  )
}

export function getOptionalExcelColumnLabels(nameRule: NameRule): string[] {
  const { excelColumns } = getNameRuleConfig(nameRule)

  return Object.values(excelColumns)
    .filter((column) => !column.required)
    .map((column) =>
      column.defaultValue
        ? `${column.label}（缺失默认：${column.defaultValue}）`
        : `${column.label}（缺失时不分类）`
    )
}
