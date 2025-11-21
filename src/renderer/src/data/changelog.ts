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
    version: '1.1.8',
    date: '2025-11-21',
    changes: {
      features: [
        '添加屏幕录制工具，修复区域录制无法开始的问题，增强交互体验',
        'Added Screen Recorder, fixed region recording startup issues, and improved overall interaction'
      ],
      improvements: [
        '完善中英文国际化翻译，修复按钮图标可见性问题',
        'Completed Chinese/English localization and fixed button icon visibility issues'
      ]
    }
  },
  {
    version: '1.1.7',
    date: '2025-11-02',
    changes: {
      improvements: [
        '统一自定义标题栏、工具界面和更新日志弹窗的视觉与交互，提升整体体验',
        'Refreshed the custom title bar, tool headers, and changelog dialog so the UI feels cohesive'
      ]
    }
  },
  {
    version: '1.1.6',
    date: '2025-10-18',
    changes: {
      improvements: [
        '首页常用、实用、专业工具分组支持折叠，默认展开常用工具，减少滚动距离',
        'Home page frequent, practical, and professional tool groups are now collapsible with frequent tools expanded by default to reduce scrolling',
        '调整常用工具操作按钮与卡片的布局和圆角比例，整体层次更紧凑一致',
        'Refined customize button layout and section corner radius for a tighter, more consistent hierarchy'
      ]
    }
  },
  {
    version: '1.1.5',
    date: '2025-10-15',
    changes: {
      improvements: [
        '文件转换工具支持一键切换分类，无需回到上一级页面',
        'File conversion tool now offers quick category tabs, removing redundant navigation',
        '转换类型和设置会根据选中分类自动刷新，减少重复操作',
        'Selected conversion category now syncs across the UI to reduce repetitive steps'
      ]
    }
  },
  {
    version: '1.1.4',
    date: '2025-10-12',
    changes: {
      features: [
        '新增 JSON 格式化工具，支持快速格式化、压缩以及结构化预览折叠',
        'Introduced JSON formatter tool with quick format/minify actions and a collapsible structured preview'
      ],
      improvements: [
        'JSON 校验结果会持续展示，便于排查输入错误',
        'Validation feedback for JSON input now persists to simplify troubleshooting'
      ]
    }
  },
  {
    version: '1.1.3',
    date: '2025-10-08',
    changes: {
      features: [
        '文件压缩功能改为标签切换，一次点击即可访问图片、音频和视频压缩',
        'File compression view now uses tabs so image, audio, and video compression are one click away',
        '首页常用工具支持自定义收藏，最多可固定 6 个常用工具',
        'Home page frequent tools are now customizable with up to six pinned utilities'
      ],
      improvements: [
        '优化常用工具的空状态与提示信息，帮助快速完成配置',
        'Improved frequent tool empty states and helper text to streamline setup'
      ],
      fixes: [
        '修复更新日志在中文环境下不显示中文内容的问题',
        'Fixed changelog entries not showing Chinese text in zh locales'
      ]
    }
  },
  {
    version: '1.1.2',
    date: '2025-09-15',
    changes: {
      features: [
        '新增文件校验工具，支持快速计算 MD5、SHA-1、SHA-256、SHA-512 等哈希值',
        'Added File Hash tool with quick checksum calculation for MD5, SHA-1, SHA-256, and SHA-512',
        '支持多文件批量生成哈希值并复制结果，方便校验与比对',
        'Supports batch hash generation with one-click copy for easy verification and comparison'
      ],
      improvements: [
        '首页常用工具区新增文件校验入口，快速打开新功能',
        'Home page frequent tools section now includes a shortcut to the File Hash tool for faster access'
      ]
    }
  },
  {
    version: '1.1.1',
    date: '2025-08-06',
    changes: {
      features: [
        '新增 HTML 卡片 GIF 导出工具，支持将 HTML 字符串中的卡片元素导出为动画 GIF 或静态 PNG',
        'Added HTML card GIF export tool with support for exporting card elements from HTML strings as animated GIF or static PNG files',
        '支持批量导出多个卡片，可自定义输出质量和动画设置',
        'Support batch export of multiple cards with customizable output quality and animation settings'
      ],
      improvements: [
        '完善了 GIF 导出功能的用户界面和交互体验',
        'Enhanced user interface and interaction experience for GIF export functionality',
        '添加了导出进度显示和状态反馈',
        'Added export progress display and status feedback'
      ]
    }
  },
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
