/*
 * @Author: Libra
 * @Date: 2025-04-22 17:58:18
 * @LastEditors: Libra
 * @Description:
 */
/*
 * @Author: Libra
 * @Date: 2025-04-22 17:00:41
 * @LastEditors: Libra
 * @Description:
 */
export interface ExamConfig {
  apiBaseUrl: string
  token: string
  useMultipleRooms: boolean
  project: ProjectConfig
  periods: PeriodConfig[]
}

export interface ProjectConfig {
  name: string
  shortName: string
  startAt: string
  endAt: string
  companyId: string
  offlineMode: boolean
  faceDiff: number
  fixedPosition: boolean
  lateSecond: number
  requirement: string
  admissionCardRequirement: string
  note: string
  type: number // 1: regular exam, 2: three-tier architecture exam
}

export interface PeriodConfig {
  name: string
  startAt: string
  duration: number
  subjects: SubjectConfig[]
}

export interface SubjectConfig {
  name: string
  companyId: string
  duration: number
  submitSecond: number
  calculatorEnabled: boolean
  showScore: boolean
  note: string
  parts: PartConfig[]
}

export interface PartConfig {
  name: string
  note: string
  optionRandomized: boolean
  questionRandomized: boolean
}
