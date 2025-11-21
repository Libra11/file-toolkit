/*
 * @Author: Libra
 * @Date: 2025-04-22 16:24:02
 * @LastEditors: Libra
 * @Description:
 */
/*
 * @Author: Libra 97220040@qq.com
 * @Date: 2024-12-04 16:29:16
 * @LastEditors: Libra 97220040@qq.com
 * @LastEditTime: 2025-05-30 14:49:12
 * @Description: 请求工具
 */
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import store from './config'
let instance: AxiosInstance | null = null

const createInstance = async (): Promise<AxiosInstance> => {
  if (instance) return instance

  console.log(store.get('apiBaseUrl'))
  console.log(store.get('token'))
  // 创建axios实例
  instance = axios.create({
    baseURL: store.get('apiBaseUrl'),
    headers: {
      'Content-Type': 'application/json',
      ...(store.get('token') && { Authorization: `Bearer ${store.get('token')}` })
    },
    timeout: 30000
  })

  // 请求拦截器
  instance.interceptors.request.use(
    (config) => {
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      const { data } = response
      // 如果返回的是错误消息，则抛出错误
      if (data.code !== 0) {
        return Promise.reject(new Error(data.message || '请求失败'))
      }
      // 直接返回数据
      return data
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  return instance
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// 封装请求方法
export const get = async <T>(url: string, params = {}): Promise<ApiResponse<T>> => {
  const inst = await createInstance()
  return inst.get(url, { params })
}

export const post = async <T>(url: string, data = {}): Promise<ApiResponse<T>> => {
  const inst = await createInstance()
  return inst.post(url, data)
}

export const put = async <T>(url: string, data = {}): Promise<ApiResponse<T>> => {
  const inst = await createInstance()
  return inst.put(url, data)
}

export const del = async <T>(url: string): Promise<ApiResponse<T>> => {
  const inst = await createInstance()
  return inst.delete(url)
}

// 导出获取实例的方法，以便需要时可以直接使用或配置
export default createInstance
