/*
 * @Author: Libra
 * @Date: 2025-04-22 16:23:44
 * @LastEditors: Libra
 * @Description:
 */
/*
 * @Author: Libra
 * @Date: 2024-12-04 16:14:39
 * @LastEditors: Libra
 * @Description:
 */
import * as xlsx from 'xlsx'
import fs from 'fs/promises'
import path from 'path'
import FormData from 'form-data'
import axios, { AxiosError } from 'axios'
import { get, post } from './request.js'
import store from './config'
import {
  ProjectData,
  PeriodData,
  SubjectData,
  PartData,
  QuestionItem,
  ProjectInfo,
  ApiResponse,
  ApiErrorResponse,
  CandidateData
} from './types'

// 保存已分配的考生数据，用于确保科目间不重复
let allocatedCandidates = new Set<string>()

/**
 * 重置考生分配状态
 * 在开始新的考试创建时调用
 */
export function resetCandidateAllocation(): void {
  allocatedCandidates = new Set<string>()
}

/**
 * 创建考试项目
 * @param {ProjectData} projectData 项目数据
 * @returns {Promise<string>} 项目ID
 */
export async function createProject(projectData: ProjectData): Promise<string> {
  try {
    console.log(projectData)
    const result = (await post('/project/add', projectData)) as ApiResponse<string>
    return result.data
  } catch (error: unknown) {
    const err = error as AxiosError<ApiErrorResponse>
    if (err.response?.data?.message) {
      throw new Error(err.response.data.message)
    }
    throw new Error(`创建项目失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

/**
 * 获取项目信息
 * @param {string} projectId 项目ID
 * @returns {Promise<ProjectInfo>} 项目信息
 */
export async function getProjectInfo(projectId: string): Promise<ProjectInfo> {
  try {
    const result = (await get(`/project/info/${projectId}`)) as ApiResponse<ProjectInfo>
    return result.data
  } catch (error: unknown) {
    const err = error as AxiosError<ApiErrorResponse>
    if (err.response?.data?.message) {
      throw new Error(err.response.data.message)
    }
    throw new Error(`获取项目信息失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

/**
 * 创建考试时段
 * @param {PeriodData} periodData 时段数据
 * @param {number} currentPeriodCount 当前已创建的时段数
 * @returns {Promise<string>} 时段ID
 */
export async function createPeriod(
  periodData: PeriodData,
  currentPeriodCount: number
): Promise<string> {
  try {
    await post('/period/add', periodData)
    // 获取项目信息来获取最新创建的时段ID
    const projectInfo = await getProjectInfo(periodData.projectId)
    // 根据当前时段数获取对应的时段ID
    const periodId = projectInfo.periodIdList[currentPeriodCount]
    if (!periodId) {
      throw new Error('未能获取到时段ID')
    }
    return periodId
  } catch (error: unknown) {
    const err = error as AxiosError<ApiErrorResponse>
    if (err.response?.data?.message) {
      throw new Error(err.response.data.message)
    }
    throw new Error(`创建时段失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

/**
 * 创建考试科目
 * @param {SubjectData} subjectData 科目数据
 * @returns {Promise<string>} 科目ID
 */
export async function createSubject(subjectData: SubjectData): Promise<string> {
  try {
    const result = (await post('/subject/add', subjectData)) as ApiResponse<string>
    return result.data
  } catch (error: unknown) {
    const err = error as AxiosError<ApiErrorResponse>
    if (err.response?.data?.message) {
      throw new Error(err.response.data.message)
    }
    throw new Error(`创建科目失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

/**
 * 创建考试子卷
 * @param {PartData} partData 子卷数据
 * @returns {Promise<string>} 子卷ID
 */
export async function createPart(partData: PartData): Promise<string> {
  try {
    const result = (await post('/part/add', partData)) as ApiResponse<string>
    return result.data
  } catch (error: unknown) {
    const err = error as AxiosError<ApiErrorResponse>
    if (err.response?.data?.message) {
      throw new Error(err.response.data.message)
    }
    throw new Error(`创建子卷失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

// 默认的试题列表
const defaultQuestionList: QuestionItem[] = [
  // 40分题（2道）
  { questionId: '674ebd6157f77c628a082bbc', score: 20, groupScore: [] },
  { questionId: '674ebd6157f77c628a082bbb', score: 20, groupScore: [] },
  // 20分题（4道）
  { questionId: '674ebd6157f77c628a082bba', score: 5, groupScore: [] },
  { questionId: '674ebd6157f77c628a082bb9', score: 5, groupScore: [] },
  { questionId: '674ebd6157f77c628a082bb7', score: 5, groupScore: [1, 1, 1, 1, 1] },
  { questionId: '674ebd6157f77c628a082bb6', score: 5, groupScore: [1, 1, 1, 1, 1] },
  // 20分题（4道）
  { questionId: '674ebd6157f77c628a082bb5', score: 5, groupScore: [1, 1, 1, 1, 1] },
  { questionId: '674ebd6157f77c628a082bb4', score: 5, groupScore: [1, 1, 1, 1, 1] },
  { questionId: '674ebd6157f77c628a082bb2', score: 2, groupScore: [] },
  { questionId: '674ebd6157f77c628a082bb1', score: 2, groupScore: [] },
  // 20分题（10道）
  { questionId: '674ebd6157f77c628a082bb0', score: 2, groupScore: [] },
  { questionId: '674ebd6157f77c628a082baf', score: 2, groupScore: [] },
  { questionId: '674ebd6157f77c628a082bae', score: 2, groupScore: [] },
  { questionId: '674ebd6157f77c628a082bad', score: 2, groupScore: [] },
  { questionId: '674ebd6157f77c628a082bac', score: 2, groupScore: [] },
  { questionId: '674ebd6157f77c628a082bab', score: 2, groupScore: [] },
  { questionId: '674ebd6157f77c628a082baa', score: 2, groupScore: [] },
  { questionId: '674ebd6157f77c628a082ba9', score: 2, groupScore: [] },
  { questionId: '674ebd6157f77c628a082ba7', score: 1, groupScore: [] },
  { questionId: '674ebd6157f77c628a082ba6', score: 1, groupScore: [] }
]

/**
 * 填充子卷试题
 * @param {string} partId 子卷ID
 * @param {number} partIndex 子卷索引
 * @param {number} totalParts 科目下的总子卷数
 * @returns {Promise<boolean>} 是否成功
 */
export async function fillPartQuestions(
  partId: string,
  partIndex: number,
  totalParts: number
): Promise<boolean> {
  try {
    // 计算每个子卷应该分配的题目数量
    const questionsPerPart = Math.floor(defaultQuestionList.length / totalParts)
    // 计算剩余的题目数量
    const remainingQuestions = defaultQuestionList.length % totalParts

    // 计算当前子卷的起始索引
    const startIndex = partIndex * questionsPerPart + Math.min(partIndex, remainingQuestions)
    // 计算当前子卷应该分配的题目数量（如果有剩余题目，前面的子卷多分配一道题）
    const currentPartQuestions = questionsPerPart + (partIndex < remainingQuestions ? 1 : 0)

    // 获取分配给当前子卷的试题
    const questionList = defaultQuestionList.slice(startIndex, startIndex + currentPartQuestions)

    await post('/part/fill', {
      partId,
      questionList
    })
    return true
  } catch (error: unknown) {
    const err = error as AxiosError<ApiErrorResponse>
    if (err.response?.data?.message) {
      throw new Error(err.response.data.message)
    }
    throw new Error(`填充试题失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

/**
 * 拆分Excel文件，确保不同科目的考生不重复
 * @param {string} sourceFile 源Excel文件路径
 * @param {number} totalSubjects 总科目数
 * @param {number} currentSubjectIndex 当前科目索引
 * @returns {Promise<Buffer>} Excel文件数据
 */
async function splitExcelFile(
  sourceFile: string,
  totalSubjects: number,
  currentSubjectIndex: number
): Promise<Buffer> {
  console.log('开始拆分Excel文件:', sourceFile)

  let sourceData: CandidateData[] = []
  // 读取源Excel文件
  try {
    // 先用 fs 读取文件
    const fileBuffer = await fs.readFile(sourceFile)
    console.log('文件读取成功，大小:', fileBuffer.length, '字节')

    // 然后让 xlsx 解析内容
    const workbook = xlsx.read(fileBuffer)
    const sheetName = workbook.SheetNames[0]
    sourceData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]) as CandidateData[]
  } catch (error) {
    console.error('读取Excel文件失败:', error)
    throw error
  }

  console.log(`Excel文件读取成功，共有 ${sourceData.length} 条记录`)

  // 过滤掉已分配的考生
  const availableCandidates = sourceData.filter((candidate) => {
    // 使用考生的唯一标识（假设是身份证号）作为键
    const key = candidate.idNumber || candidate.id || JSON.stringify(candidate)
    return !allocatedCandidates.has(String(key))
  })

  // 计算当前科目应该分配的考生数量
  const totalAvailable = availableCandidates.length
  const remainingSubjects = totalSubjects - currentSubjectIndex
  const candidatesForThisSubject = Math.floor(totalAvailable / remainingSubjects)

  console.log(
    `可用考生: ${totalAvailable}, 剩余科目: ${remainingSubjects}, 本科目分配: ${candidatesForThisSubject}`
  )

  if (candidatesForThisSubject === 0) {
    throw new Error(`没有足够的考生分配到科目 ${currentSubjectIndex + 1}`)
  }

  // 随机选择考生
  const selectedCandidates = availableCandidates
    .sort(() => Math.random() - 0.5)
    .slice(0, candidatesForThisSubject)

  // 将选中的考生标记为已分配
  selectedCandidates.forEach((candidate) => {
    const key = candidate.idNumber || candidate.id || JSON.stringify(candidate)
    allocatedCandidates.add(String(key))
  })

  // 创建Excel文件在内存中
  const newWorkbook = xlsx.utils.book_new()
  const newSheet = xlsx.utils.json_to_sheet(selectedCandidates)
  xlsx.utils.book_append_sheet(newWorkbook, newSheet, 'Sheet1')

  // 写入到内存Buffer而非文件
  const excelBuffer = xlsx.write(newWorkbook, { type: 'buffer', bookType: 'xlsx' })
  console.log(`生成Excel数据成功，大小: ${excelBuffer.length} 字节`)
  console.log(`科目 ${currentSubjectIndex + 1} 分配到 ${selectedCandidates.length} 名考生`)

  return excelBuffer
}

/**
 * 导入考生
 * @param {string} periodId 时段ID
 * @param {string} subjectId 科目ID
 * @param {Buffer} excelData Excel文件数据
 * @returns {Promise<void>}
 */
async function importCandidates(
  periodId: string,
  subjectId: string,
  excelData: Buffer
): Promise<void> {
  const formData = new FormData()
  try {
    formData.append('file', excelData, {
      filename: `candidates_subject.xlsx`,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    const url = `${store.get('apiBaseUrl')}/candidate/import/${periodId}/${subjectId}`

    await axios.post(url, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${store.get('token')}`
      }
    })
  } catch (error: unknown) {
    const err = error as AxiosError<ApiErrorResponse>
    if (err.response?.data?.message) {
      throw new Error(err.response.data.message)
    }
    throw new Error(`导入考生失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

/**
 * 为科目导入考生
 * @param {string} periodId 时段ID
 * @param {string} subjectId 科目ID
 * @param {string} sourceFile 源Excel文件路径
 * @param {number} totalSubjects 总科目数
 * @param {number} currentSubjectIndex 当前科目索引
 */
export async function importSubjectCandidates(
  periodId: string,
  subjectId: string,
  sourceFile: string,
  totalSubjects: number,
  currentSubjectIndex: number
): Promise<void> {
  // 验证文件是否为Excel
  const fileExt = path.extname(sourceFile).toLowerCase()
  if (fileExt !== '.xlsx' && fileExt !== '.xls') {
    throw new Error('只支持Excel文件(.xlsx或.xls)导入')
  }

  try {
    // 拆分Excel文件
    const excelData = await splitExcelFile(sourceFile, totalSubjects, currentSubjectIndex)

    // 导入考生
    await importCandidates(periodId, subjectId, excelData)
  } catch (error) {
    console.error('导入考生处理失败:', error)
    throw error
  }
}

/**
 * 为时段分配考点
 * @param {string} projectId 项目ID
 * @param {string} periodId 时段ID
 * @param {number} candidateCount 考生数量
 * @returns {Promise<void>}
 */
export async function assignSiteToPeriod(
  projectId: string,
  periodId: string,
  candidateCount: number
): Promise<void> {
  try {
    const siteId = '6603b408dad61327e28bcbbe' // 固定的考点ID
    await post('/confirm/add', {
      projectId,
      periodId,
      siteId,
      candidateCount
    })
  } catch (error: unknown) {
    const err = error as AxiosError<ApiErrorResponse>
    if (err.response?.data?.message) {
      throw new Error(err.response.data.message)
    }
    throw new Error(`分配考点失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

// 定义确认信息接口
interface ConfirmInfo {
  confirmId: string
}

/**
 * 获取时段的确认信息
 * @param {string} periodId 时段ID
 * @returns {Promise<string>} confirmId
 */
async function getConfirmId(periodId: string): Promise<string> {
  try {
    const result = (await get(`/confirm/site/selected/${periodId}`)) as ApiResponse<ConfirmInfo[]>
    if (!result.data || result.data.length === 0 || !result.data[0].confirmId) {
      throw new Error('未找到确认信息')
    }
    return result.data[0].confirmId
  } catch (error: unknown) {
    const err = error as AxiosError<ApiErrorResponse>
    if (err.response?.data?.message) {
      throw new Error(err.response.data.message)
    }
    throw new Error(`获取确认信息失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

/**
 * 提交考点确认
 * @param {string} confirmId 确ID
 * @param {boolean} useMultipleRooms 是否使用多个考场
 * @returns {Promise<void>}
 */
export async function submitConfirm(
  confirmId: string,
  useMultipleRooms: boolean = false
): Promise<void> {
  try {
    // 固定的考场ID列表
    const allRooms = ['6603b4b2dad61327e28bcbc0', '6669504cadc9730a1e620065']
    const roomIdList = useMultipleRooms ? allRooms : [allRooms[0]]

    await post('/confirm/operator/submit', {
      confirmId,
      roomIdList
    })
  } catch (error: unknown) {
    const err = error as AxiosError<ApiErrorResponse>
    if (err.response?.data?.message) {
      throw new Error(err.response.data.message)
    }
    throw new Error(`提交确认失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

/**
 * 完成时段确认流程
 * @param {string} periodId 时段ID
 * @param {boolean} useMultipleRooms 是否使用多个考场
 */
export async function confirmPeriod(periodId: string, useMultipleRooms: boolean): Promise<void> {
  // 1. 获取confirmId
  const confirmId = await getConfirmId(periodId)
  // 2. 提交确认
  await submitConfirm(confirmId, useMultipleRooms)
}

/**
 * 自动编排时段
 * @param {string} periodId 时段ID
 * @param {boolean} random 是否科目交叉编排，默认false（科目平行编排）
 * @returns {Promise<void>}
 */
export async function autoArrangePeriod(periodId: string, random: boolean = false): Promise<void> {
  try {
    await post('/period/arrange/auto', {
      periodId,
      random
    })
  } catch (error: unknown) {
    const err = error as AxiosError<ApiErrorResponse>
    if (err.response?.data?.message) {
      throw new Error(err.response.data.message)
    }
    throw new Error(`自动编排失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

/**
 * 生成科目试卷
 * @param {string} projectId 项目ID
 * @param {string} periodId 时段ID
 * @param {string} subjectId 科目ID
 * @returns {Promise<void>}
 */
export async function generateSubjectPaper(
  projectId: string,
  periodId: string,
  subjectId: string
): Promise<void> {
  try {
    await post('/subject/generate/paper', {
      projectId,
      periodId,
      subjectId
    })
  } catch (error: unknown) {
    const err = error as AxiosError<ApiErrorResponse>
    if (err.response?.data?.message) {
      throw new Error(err.response.data.message)
    }
    throw new Error(`生成试卷失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

/**
 * 上线考试项目
 * @param {string} projectId 项目ID
 * @returns {Promise<void>}
 */
export async function onlineProject(projectId: string): Promise<void> {
  try {
    await get(`/project/online/${projectId}`)
  } catch (error: unknown) {
    const err = error as AxiosError<ApiErrorResponse>
    if (err.response?.data?.message) {
      throw new Error(err.response.data.message)
    }
    throw new Error(`上线考试失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

/**
 * 生成准考证
 * @param {string} projectId 项目ID
 * @returns {Promise<void>}
 */
export async function generateAdmissionCard(projectId: string): Promise<void> {
  try {
    await get(`/admission/preheat/${projectId}`)
  } catch (error: unknown) {
    const err = error as AxiosError<ApiErrorResponse>
    if (err.response?.data?.message) {
      throw new Error(err.response.data.message)
    }
    throw new Error(`生成准考证失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

/**
 * 时段就绪
 * @param {string} periodId 时段ID
 * @returns {Promise<void>}
 */
export async function setPeriodReady(periodId: string): Promise<void> {
  try {
    await get(`/period/ready/${periodId}`)
  } catch (error: unknown) {
    const err = error as AxiosError<ApiErrorResponse>
    if (err.response?.data?.message) {
      throw new Error(err.response.data.message)
    }
    throw new Error(`时段就绪失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}
