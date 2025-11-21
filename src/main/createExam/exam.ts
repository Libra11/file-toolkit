/*
 * @Author: Libra
 * @Date: 2025-04-22 16:49:53
 * @LastEditors: Libra
 * @Description:
 */
import {
  createProject,
  createPeriod,
  createSubject,
  createPart,
  fillPartQuestions,
  importSubjectCandidates,
  resetCandidateAllocation,
  assignSiteToPeriod,
  confirmPeriod,
  autoArrangePeriod,
  generateSubjectPaper,
  onlineProject,
  generateAdmissionCard,
  setPeriodReady
} from './api'
import fs from 'fs/promises'
import * as xlsx from 'xlsx'
import store from './config'
import path from 'path'
import { app, BrowserWindow } from 'electron'

const candidateXlsxPath = app.isPackaged
  ? path.join(process.resourcesPath, 'resources', 'candidates.xlsx')
  : path.join(process.cwd(), 'resources', 'candidates.xlsx')

// 发送日志到渲染进程
const sendLog = (type: 'info' | 'success' | 'warn' | 'error', message: string): void => {
  const mainWindow = BrowserWindow.getFocusedWindow()
  if (mainWindow) {
    mainWindow.webContents.send('exam:log', { type, message, timestamp: new Date().toISOString() })
  }

  // 同时输出到控制台
  switch (type) {
    case 'info':
      console.log(message)
      break
    case 'success':
      console.log(message)
      break
    case 'warn':
      console.warn(message)
      break
    case 'error':
      console.error(message)
      break
  }
}

export const createExam = async (): Promise<void> => {
  try {
    // 重置考生分配状态
    resetCandidateAllocation()
    sendLog('info', '重置考生分配状态')

    // 计算总科目数
    const totalSubjects = store.all.periods.reduce(
      (total, period) => total + period.subjects.length,
      0
    )
    let currentSubjectIndex = 0
    sendLog('info', `总共 ${totalSubjects} 个科目需要创建`)

    // 存储所有时段ID，用于最后设置就绪状态
    const periodIds: string[] = []

    sendLog('info', '正在创建项目...')
    const projectId = await createProject(store.all.project)
    sendLog('success', `项目创建成功！项目ID：${projectId}`)

    // 2. 创建时段和科目
    for (const [periodIndex, periodData] of store.all.periods.entries()) {
      // 创建时段
      sendLog('info', `正在创建第 ${periodIndex + 1} 个时段 (${periodData.name})...`)
      const periodId = await createPeriod(
        {
          ...periodData,
          projectId
        },
        periodIndex
      )
      // 保存时段ID
      periodIds.push(periodId)
      sendLog('success', `时段 "${periodData.name}" 创建成功！时段ID：${periodId}`)

      // 记录这个时段的总考生数
      let periodCandidateCount = 0

      // 创建该时段下的所有科目
      if (periodData.subjects && periodData.subjects.length > 0) {
        for (const [subjectIndex, subjectData] of periodData.subjects.entries()) {
          sendLog(
            'info',
            `正在创建时段 "${periodData.name}" 的第 ${subjectIndex + 1} 个科目 (${subjectData.name})...`
          )
          const subjectId = await createSubject({
            ...subjectData,
            periodId
          })
          sendLog('success', `科目 "${subjectData.name}" 创建成功！科目ID：${subjectId}`)

          // 创建该科目下的所有子卷
          if (subjectData.parts && subjectData.parts.length > 0) {
            const totalParts = subjectData.parts.length
            for (const [partIndex, partData] of subjectData.parts.entries()) {
              sendLog(
                'info',
                `正在创建科目 "${subjectData.name}" 的第 ${partIndex + 1} 个子卷 (${partData.name})...`
              )
              const partId = await createPart({
                ...partData,
                projectId,
                periodId,
                subjectId
              })
              sendLog('success', `子卷 "${partData.name}" 创建成功！子卷ID：${partId}`)

              // 填充试题
              sendLog('info', `正在为子卷 "${partData.name}" 填充试题...`)
              await fillPartQuestions(partId, partIndex, totalParts)
              sendLog('success', `子卷 "${partData.name}" 试题填充成功！`)
            }

            // 生成试卷
            sendLog('info', `正在为科目 "${subjectData.name}" 生成试卷...`)
            try {
              await generateSubjectPaper(projectId, periodId, subjectId)
              sendLog('success', `科目 "${subjectData.name}" 试卷生成成功！`)
            } catch (error: any) {
              sendLog('error', `科目 "${subjectData.name}" 试卷生成失败: ${error.message}`)
            }

            // 导入考生（如果文件存在）
            try {
              sendLog('info', `尝试访问考生文件: ${candidateXlsxPath}`)
              await fs.access(candidateXlsxPath)
              sendLog('info', '考生文件存在，开始导入')
              try {
                sendLog('info', `正在为科目 "${subjectData.name}" 导入考生...`)
                await importSubjectCandidates(
                  periodId,
                  subjectId,
                  candidateXlsxPath,
                  totalSubjects,
                  currentSubjectIndex
                )
                // 更新时段的考生总数
                try {
                  const fileBuffer = await fs.readFile(candidateXlsxPath)
                  const workbook = xlsx.read(fileBuffer)
                  const sheetName = workbook.SheetNames[0]
                  const sourceData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName])
                  const candidatesPerSubject = Math.floor(sourceData.length / totalSubjects)
                  periodCandidateCount += candidatesPerSubject
                  sendLog(
                    'success',
                    `科目 "${subjectData.name}" 考生导入成功！当前时段考生总数: ${periodCandidateCount}`
                  )
                } catch (error) {
                  sendLog('error', `计算考生总数时出错: ${error}`)
                }
              } catch (error: any) {
                sendLog('error', `导入考生失败: ${error.message}`)
              }
            } catch (error) {
              // 文件不存在，跳过导入
              sendLog('warn', `未找到考生文件 ${candidateXlsxPath}，将跳过考生导入 ${error}`)
            }
          }

          // 更新科目计数
          currentSubjectIndex++
        }
      }

      // 为时段分配考点
      if (periodCandidateCount > 0) {
        sendLog('info', `正在为时段 "${periodData.name}" 分配考点...`)
        try {
          await assignSiteToPeriod(projectId, periodId, periodCandidateCount + 10)
          sendLog('success', `时段 "${periodData.name}" 考点分配成功！`)
        } catch (error: any) {
          sendLog('error', `时段 "${periodData.name}" 考点分配失败: ${error.message}`)
        }

        // 确认考点
        sendLog('info', `正在确认时段 "${periodData.name}" 的考点信息...`)
        try {
          await confirmPeriod(periodId, store.all.useMultipleRooms)
          sendLog('success', `时段 "${periodData.name}" 考点确认成功！`)
        } catch (error: any) {
          sendLog('error', `时段 "${periodData.name}" 考点确认失败: ${error.message}`)
        }

        // 自动编排
        sendLog('info', `正在为时段 "${periodData.name}" 进行自动编排...`)
        try {
          await autoArrangePeriod(periodId)
          sendLog('success', `时段 "${periodData.name}" 自动编排成功！`)
        } catch (error: any) {
          sendLog('error', `时段 "${periodData.name}" 自动编排失败: ${error.message}`)
        }
      }
    }

    // 上线考试
    sendLog('info', '正在上线考试...')
    try {
      await onlineProject(projectId)
      sendLog('success', '考试上线成功！')
    } catch (error: any) {
      sendLog('error', `上线考试失败: ${error.message}`)
    }

    // 生成准考证
    sendLog('info', '正在生成准考证...')
    try {
      await generateAdmissionCard(projectId)
      sendLog('success', '准考证生成成功！')
    } catch (error: any) {
      sendLog('error', `生成准考证失败: ${error.message}`)
    }

    // 等待10秒
    sendLog('info', '等待准考证生成完成...')
    await new Promise((resolve) => setTimeout(resolve, 10000))
    sendLog('success', '准考证生成完成！')

    // 设置每个时段为就绪状态
    for (const [index, periodId] of periodIds.entries()) {
      sendLog('info', `正在设置第 ${index + 1} 个时段为就绪状态...`)
      try {
        try {
          await setPeriodReady(periodId)
          sendLog('success', `第 ${index + 1} 个时段设置就绪成功！`)
        } catch (error: any) {
          sendLog('error', `第 ${index + 1} 个时段设置就绪失败: ${error.message}`)
        }
      } catch (error: any) {
        sendLog('error', `第 ${index + 1} 个时段设置就绪失败: ${error.message}`)
      }
    }

    sendLog('success', '所有考试内容创建完成！')
  } catch (error: any) {
    sendLog('error', `创建考试失败: ${error.message}`)
  }
}
