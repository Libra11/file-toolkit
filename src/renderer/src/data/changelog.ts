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
