/*
 * @Author: Libra
 * @Date: 2025-04-22 17:34:45
 * @LastEditors: Libra
 * @Description:
 */
import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { ExamConfig } from './types'

class ConfigStore<T> {
  private data: T
  private filePath: string

  constructor(options: { defaults: T; name?: string }) {
    const { defaults, name = 'config' } = options

    // 使用应用的用户数据目录作为存储位置
    const userDataPath = app.getPath('userData')
    this.filePath = path.join(userDataPath, `${name}.json`)

    // 设置默认值
    this.data = defaults

    // 如果配置文件存在，则加载它
    this.load()
  }

  // 加载配置
  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileData = fs.readFileSync(this.filePath, 'utf8')
        const parsedData = JSON.parse(fileData)
        this.data = { ...this.data, ...parsedData }
      }
    } catch (error) {
      console.error('加载配置文件失败:', error)
    }
  }

  // 保存配置
  private save(): void {
    try {
      const dirPath = path.dirname(this.filePath)
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8')
    } catch (error) {
      console.error('保存配置文件失败:', error)
    }
  }

  // 获取所有配置
  get all(): T {
    return this.data
  }

  // 获取特定配置项
  get<K extends keyof T>(key: K): T[K] {
    return this.data[key]
  }

  // 设置配置项
  set<K extends keyof T>(key: K, value: T[K]): void {
    this.data[key] = value
    this.save()
  }

  // 设置多个配置项
  setAll(data: Partial<T>): void {
    this.data = { ...this.data, ...data }
    this.save()
  }

  // 删除配置项
  delete<K extends keyof T>(key: K): void {
    delete this.data[key]
    this.save()
  }

  // 清空所有配置
  clear(): void {
    this.data = {} as T
    this.save()
  }
}

const store = new ConfigStore<ExamConfig>({
  defaults: {
    apiBaseUrl: 'https://supernova-api.iguokao.com/exam/api/v1',
    token: '',
    useMultipleRooms: true,
    project: {
      name: '',
      shortName: '',
      startAt: '',
      endAt: '',
      companyId: '64fe70d9678850220a5669cc',
      offlineMode: true,
      faceDiff: 4,
      fixedPosition: true,
      lateSecond: 600,
      submitSecond: 600,
      requirement: '',
      admissionCardRequirement: '',
      note: ''
    },
    periods: [
      {
        name: '时段1',
        duration: 6000,
        startAt: '',
        subjects: [
          {
            name: '科目1',
            duration: 6000,
            calculatorEnabled: true,
            showScore: true,
            note: '科目1备注',
            companyId: '64fe70d9678850220a5669cc',
            parts: [
              {
                name: '子卷1',
                note: '子卷1备注',
                optionRandomized: true,
                questionRandomized: true
              },
              {
                name: '子卷2',
                note: '子卷2备注',
                optionRandomized: false,
                questionRandomized: true
              }
            ]
          }
        ]
      }
    ]
  }
})

export default store
