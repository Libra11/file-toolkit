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

// 定义接口
export interface QuestionItem {
  questionId: string
  score: number
  groupScore: number[]
}

export interface ProjectData {
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
}

export interface PeriodData {
  name: string
  projectId: string
  startAt: string
  duration: number
}

export interface SubjectData {
  name: string
  periodId: string
  companyId: string
  duration: number
  calculatorEnabled: boolean
  showScore: boolean
  note: string
}

export interface PartData {
  name: string
  subjectId: string
  projectId: string
  periodId: string
  note: string
  optionRandomized: boolean
  questionRandomized: boolean
}

export interface CandidateData {
  [key: string]: unknown
  idNumber?: string
  id?: string
}

// 定义API错误接口
export interface ApiErrorResponse {
  message: string
}

// 定义API响应接口
export interface ApiResponse<T> {
  data: T
}

// 定义项目信息接口
export interface ProjectInfo {
  periodIdList: string[]
}
