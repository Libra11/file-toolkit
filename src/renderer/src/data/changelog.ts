/*
 * @Author: Libra
 * @Date: 2025-07-01 17:12:42
 * @LastEditors: Libra
 * @Description:
 */
export interface ChangelogEntry {
  version: string
  date: string
  changes: {
    features?: string[]
    improvements?: string[]
    fixes?: string[]
    breaking?: string[]
  }
}

export const changelog: ChangelogEntry[] = [
  {
    version: '1.1.0',
    date: '2025-01-09',
    changes: {
      features: [
        '新增批量重命名工具，支持序号命名、文本替换、正则表达式等多种重命名规则',
        'Added batch rename tool with support for sequence naming, text replacement, regex, and more'
      ],
      improvements: [
        '优化首页布局为小屏幕友好的垂直分组单列布局',
        'Optimized homepage layout to mobile-friendly vertical grouped single-column layout',
        '使用紧凑型工具卡片设计，节省空间的同时保持美观',
        'Implemented compact tool card design to save space while maintaining aesthetics',
        '分类标题图标统一使用 Lucide 图标库，提升视觉一致性',
        'Unified category title icons using Lucide icon library for better visual consistency'
      ]
    }
  },
  {
    version: '1.0.9',
    date: '2025-07-01',
    changes: {
      features: [
        '添加更新日志功能，每次更新后自动显示更新内容',
        'Add changelog feature with automatic display after updates'
      ],
      improvements: ['优化应用界面和用户体验', 'Improved application UI and user experience']
    }
  },
  {
    version: '1.0.7',
    date: '2025-06-30',
    changes: {
      features: ['支持GIF格式转换设置', 'Support for GIF conversion settings'],
      fixes: ['修复已知问题', 'Fixed known issues']
    }
  },
  {
    version: '1.0.6',
    date: '2025-06-29',
    changes: {
      features: ['创建考试添加三级模式', 'Added three-level mode for exam creation'],
      improvements: ['更新应用版本显示', 'Updated application version display']
    }
  }
]

export const getChangelogForVersion = (version: string): ChangelogEntry | undefined => {
  return changelog.find((entry) => entry.version === version)
}

export const getLatestChangelog = (): ChangelogEntry | undefined => {
  return changelog[0]
}

export const hasNewChangelog = (lastSeenVersion: string, currentVersion: string): boolean => {
  const lastSeenIndex = changelog.findIndex((entry) => entry.version === lastSeenVersion)
  const currentIndex = changelog.findIndex((entry) => entry.version === currentVersion)

  if (currentIndex === -1) return false
  if (lastSeenIndex === -1) return true

  return currentIndex < lastSeenIndex
}
