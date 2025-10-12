/**
 * Author: Libra
 * Date: 2025-08-26
 * LastEditors: Libra
 * Description: LiveKit 主进程处理器
 */
import { ipcMain } from 'electron'
import * as crypto from 'crypto'

// LiveKit 服务器配置
const LIVEKIT_CONFIG = {
  API_KEY: 'key1',
  API_SECRET: 'secret1secret1secret1secret1secret1'
}

interface ParticipantOptions {
  identity: string
  name?: string
  roomName: string
  canPublish?: boolean
  canSubscribe?: boolean
  canPublishData?: boolean
}

/**
 * 创建 JWT header
 */
function createHeader(): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }
  return Buffer.from(JSON.stringify(header)).toString('base64url')
}

/**
 * 创建 JWT payload
 */
function createPayload(options: ParticipantOptions): string {
  const {
    identity,
    name = identity,
    roomName,
    canPublish = true,
    canSubscribe = true,
    canPublishData = true
  } = options

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: LIVEKIT_CONFIG.API_KEY,
    sub: identity,
    iat: now,
    exp: now + 3600, // 1 小时后过期
    video: {
      room: roomName,
      roomJoin: true,
      canPublish,
      canSubscribe,
      canPublishData
    },
    name
  }

  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

/**
 * 创建 JWT 签名
 */
function createSignature(header: string, payload: string): string {
  const data = `${header}.${payload}`
  const signature = crypto
    .createHmac('sha256', LIVEKIT_CONFIG.API_SECRET)
    .update(data)
    .digest('base64url')
  return signature
}

/**
 * 生成 LiveKit access token (手动实现 JWT)
 */
function generateLiveKitToken(options: ParticipantOptions): string {
  try {
    const header = createHeader()
    const payload = createPayload(options)
    const signature = createSignature(header, payload)

    return `${header}.${payload}.${signature}`
  } catch (error) {
    console.error('生成 JWT token 失败:', error)
    throw error
  }
}

/**
 * 注册 LiveKit 相关的 IPC 处理程序
 */
export function registerLiveKitHandlers(): void {
  // 生成 access token
  ipcMain.handle('livekit:generate-token', async (_, options: ParticipantOptions) => {
    try {
      return generateLiveKitToken(options)
    } catch (error) {
      console.error('生成 LiveKit token 失败:', error)
      throw error
    }
  })
}
