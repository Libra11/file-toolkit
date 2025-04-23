/*
 * @Author: Libra
 * @Date: 2025-04-22 17:34:45
 * @LastEditors: Libra
 * @Description:
 */
import { ExamConfig } from './types'
import Store from 'electron-store'

const store = new Store<ExamConfig>({
  defaults: {
    apiBaseUrl: 'https://supernova-api.iguokao.com/exam/api/v1',
    token:
      'eyJhbGciOiJIUzI1NiJ9.eyJhdXRob3JpdGllcyI6WyJST0xFX0ZJTkFOQ0UiLCJST0xFX1BBUEVSIiwiUk9MRV9TSVRFX0FETUlOIiwiUk9MRV9TWVNfQURNSU4iXSwic3ViIjoiNjRkZjQ0MGFhOWJmMTUzYWFjNTg2NTYxIiwiaWF0IjoxNzQ1MzE3Mjg2LCJleHAiOjE3NDU0MDM2ODZ9.QntvXQGzaPmHUZEbOZ2RZc0Yp09d2l7x0mXMaeRAHTY',
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
