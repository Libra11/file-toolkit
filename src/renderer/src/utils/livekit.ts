/**
 * Author: Libra
 * Date: 2025-08-26
 * LastEditors: Libra
 * Description: LiveKit 配置工具
 */

// LiveKit 服务器配置
export const LIVEKIT_CONFIG = {
  WS_URL: 'wss://livekit.penlibra.xin',
  API_KEY: 'key1',
  API_SECRET: 'secret1secret1secret1secret1secret1'
}

export interface ParticipantOptions {
  identity: string
  name?: string
  roomName: string
  canPublish?: boolean
  canSubscribe?: boolean
  canPublishData?: boolean
}

/**
 * 生成随机用户 ID
 */
export function generateUserId(): string {
  return `user_${Math.random().toString(36).substring(2, 11)}`
}

/**
 * 生成随机房间名
 */
export function generateRoomName(): string {
  return `room_${Math.random().toString(36).substring(2, 11)}`
}

/**
 * 请求生成 token (通过主进程)
 */
export async function requestToken(options: ParticipantOptions): Promise<string> {
  // 这里应该调用主进程的 IPC 来生成 token
  // 临时返回一个占位符，实际使用时需要实现 IPC 调用
  return window.electron?.ipcRenderer?.invoke('livekit:generate-token', options) || ''
}

/**
 * 获取房间配置
 */
export function getRoomConfig(
  identity: string,
  roomName: string
): {
  identity: string
  roomName: string
  serverUrl: string
} {
  return {
    identity,
    roomName,
    serverUrl: LIVEKIT_CONFIG.WS_URL
  }
}
