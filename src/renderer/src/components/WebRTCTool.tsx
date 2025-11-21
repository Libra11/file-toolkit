/**
 * Author: Libra
 * Date: 2025-08-26
 * LastEditors: Libra
 * Description: WebRTC 音视频工具组件
 */
import { useState, useEffect } from 'react'
import { VideoIcon, Users, Settings } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  ConnectionQualityIndicator
} from '@livekit/components-react'
import {
  generateRoomName,
  generateUserId,
  getRoomConfig,
  requestToken,
  type ParticipantOptions
} from '../utils/livekit'
import '@livekit/components-styles'

interface WebRTCToolProps {
  className?: string
}

interface RoomConfig {
  identity: string
  roomName: string
  serverUrl: string
  token: string
}

export function WebRTCTool({ className }: WebRTCToolProps): JSX.Element {
  const [roomConfig, setRoomConfig] = useState<RoomConfig | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [userName, setUserName] = useState('')
  const [roomName, setRoomName] = useState('')
  const [mediaStatus, setMediaStatus] = useState<{
    camera: 'unknown' | 'allowed' | 'denied'
    microphone: 'unknown' | 'allowed' | 'denied'
  }>({
    camera: 'unknown',
    microphone: 'unknown'
  })
  const [testResult, setTestResult] = useState<string>('')
  const [isTestingCamera, setIsTestingCamera] = useState(false)

  useEffect(() => {
    // 初始化默认配置
    const userId = generateUserId()
    setUserName(`用户_${userId.slice(-4)}`)
    setRoomName('default-room')

    // 检查媒体设备权限
    checkMediaPermissions()
  }, [])

  const checkMediaPermissions = async (): Promise<void> => {
    try {
      // 检查摄像头权限
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
        setMediaStatus((prev) => ({ ...prev, camera: 'allowed' }))
        // 立即停止流以释放摄像头
        videoStream.getTracks().forEach((track) => track.stop())
      } catch (error) {
        console.error('Camera permission denied:', error)
        setMediaStatus((prev) => ({ ...prev, camera: 'denied' }))
      }

      // 检查麦克风权限
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        setMediaStatus((prev) => ({ ...prev, microphone: 'allowed' }))
        // 立即停止流以释放麦克风
        audioStream.getTracks().forEach((track) => track.stop())
      } catch (error) {
        console.error('Microphone permission denied:', error)
        setMediaStatus((prev) => ({ ...prev, microphone: 'denied' }))
      }
    } catch (error) {
      console.error('Media devices not available:', error)
      setMediaStatus({
        camera: 'denied',
        microphone: 'denied'
      })
    }
  }

  const handleJoinRoom = async (): Promise<void> => {
    if (!userName.trim() || !roomName.trim()) {
      alert('请输入用户名和房间名')
      return
    }

    setIsConnecting(true)
    try {
      const userId = generateUserId()
      const baseConfig = getRoomConfig(userId, roomName.trim())

      // 请求生成 token
      const token = await requestToken({
        identity: userId,
        name: userName.trim(),
        roomName: roomName.trim(),
        canPublish: true,
        canSubscribe: true,
        canPublishData: true
      })

      if (!token) {
        throw new Error('Token 生成失败')
      }

      const config: RoomConfig = {
        ...baseConfig,
        token
      }

      setRoomConfig(config)
      setIsConnected(true)
    } catch (error) {
      console.error('加入房间失败:', error)
      alert('加入房间失败，请检查配置')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleLeaveRoom = (): void => {
    setRoomConfig(null)
    setIsConnected(false)
  }

  const handleCreateRandomRoom = (): void => {
    const randomRoom = generateRoomName()
    setRoomName(randomRoom)
  }

  const testCameraAccess = async (): Promise<void> => {
    setIsTestingCamera(true)
    setTestResult('开始测试摄像头访问...\n')

    try {
      // 清理之前的视频元素
      const existingVideo = document.getElementById('camera-test-video')
      if (existingVideo) {
        existingVideo.remove()
      }

      console.log('🔍 开始最小摄像头验证...')
      setTestResult((prev) => prev + '正在请求摄像头权限...\n')

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      console.log('✅ 摄像头流获取成功!')
      setTestResult((prev) => prev + '✅ 摄像头流获取成功!\n')

      const v = document.createElement('video')
      v.id = 'camera-test-video'
      v.autoplay = true
      v.muted = true // 一些平台不允许未静音的自动播放
      v.playsInline = true // iOS/部分WebView策略
      v.style.cssText =
        'width: 300px; height: 225px; border: 2px solid #10b981; border-radius: 8px; margin: 10px 0; background-color: #000;'

      // 将视频元素插入到测试结果区域
      const testContainer = document.getElementById('camera-test-container')
      if (testContainer) {
        testContainer.appendChild(v)
      } else {
        document.body.appendChild(v)
      }

      // 设置视频流
      v.srcObject = stream
      setTestResult((prev) => prev + '📺 视频流已设置，等待元数据加载...\n')

      // 先尝试播放，然后等待元数据
      try {
        await v.play()
        console.log('✅ 视频播放成功!')
        setTestResult((prev) => prev + '✅ 视频播放成功!\n')
      } catch (playError) {
        console.log('⚠️ 自动播放失败，但继续检查元数据:', playError)
        setTestResult((prev) => prev + '⚠️ 自动播放失败，但继续检查元数据\n')
      }

      // 等待视频元数据加载，使用更短的超时时间
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          // 即使超时也检查一下当前状态
          if (v.videoWidth > 0 && v.videoHeight > 0) {
            console.log('✅ 超时但发现有效尺寸:', v.videoWidth, 'x', v.videoHeight)
            setTestResult(
              (prev) => prev + `📐 发现有效视频尺寸: ${v.videoWidth}x${v.videoHeight}\n`
            )
            resolve()
          } else {
            reject(new Error('视频元数据加载超时'))
          }
        }, 3000) // 缩短到3秒超时

        const onLoadedMetadata = () => {
          clearTimeout(timeout)
          console.log('✅ 视频元数据已加载:', v.videoWidth, 'x', v.videoHeight)
          setTestResult(
            (prev) => prev + `📐 视频元数据加载完成: ${v.videoWidth}x${v.videoHeight}\n`
          )
          resolve()
        }

        const onError = (e: any) => {
          clearTimeout(timeout)
          console.error('❌ 视频加载错误:', e)
          reject(new Error(`视频加载错误: ${e.type}`))
        }

        const onCanPlay = () => {
          clearTimeout(timeout)
          console.log('✅ 视频可以播放，尺寸:', v.videoWidth, 'x', v.videoHeight)
          setTestResult((prev) => prev + `📐 视频可播放，尺寸: ${v.videoWidth}x${v.videoHeight}\n`)
          resolve()
        }

        if (v.readyState >= 1) {
          // 元数据已经加载
          onLoadedMetadata()
        } else {
          // 等待元数据加载
          v.addEventListener('loadedmetadata', onLoadedMetadata, { once: true })
          v.addEventListener('canplay', onCanPlay, { once: true })
          v.addEventListener('error', onError, { once: true })
        }
      })

      const tracks = stream.getTracks().map((t) => ({ kind: t.kind, readyState: t.readyState }))
      console.log('📹 媒体轨道信息:', tracks)
      setTestResult((prev) => prev + `📹 媒体轨道信息: ${JSON.stringify(tracks, null, 2)}\n`)
      setTestResult((prev) => prev + '✅ 测试完成！摄像头工作正常。\n')

      // 5秒后停止流
      setTimeout(() => {
        stream.getTracks().forEach((track) => track.stop())
        if (v.parentNode) {
          v.remove()
        }
        console.log('🛑 摄像头流已停止')
      }, 5000)
    } catch (e: any) {
      console.error('❌ getUserMedia failed:', e?.name, e?.message, e)
      setTestResult((prev) => prev + `❌ 测试失败:\n`)
      setTestResult((prev) => prev + `错误类型: ${e?.name || 'Unknown'}\n`)
      setTestResult((prev) => prev + `错误信息: ${e?.message || 'Unknown error'}\n`)
      setTestResult((prev) => prev + `完整错误: ${JSON.stringify(e, null, 2)}\n`)
    } finally {
      setIsTestingCamera(false)
    }
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <VideoIcon className="h-5 w-5" />
            WebRTC 音视频工具
          </CardTitle>
          <CardDescription>
            基于 LiveKit 的实时音视频通信工具，支持多人会议、屏幕共享等功能
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isConnected ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">用户名</Label>
                  <Input
                    id="username"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="请输入您的用户名"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomname">房间名</Label>
                  <div className="flex gap-2">
                    <Input
                      id="roomname"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="请输入房间名"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateRandomRoom}
                      className="whitespace-nowrap"
                    >
                      随机房间
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleJoinRoom}
                  disabled={isConnecting || !userName.trim() || !roomName.trim()}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  {isConnecting ? '连接中...' : '加入房间'}
                </Button>
                <Button
                  onClick={testCameraAccess}
                  disabled={isTestingCamera}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <VideoIcon className="h-4 w-4" />
                  {isTestingCamera ? '测试中...' : '测试摄像头'}
                </Button>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">使用说明</h3>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• 输入用户名和房间名即可加入视频会议</li>
                      <li>• 支持多人同时加入同一房间进行音视频通话</li>
                      <li>• 具备屏幕共享、静音、关闭摄像头等功能</li>
                      <li>• 服务器地址：livekit.penlibra.xin</li>
                    </ul>

                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                      <div className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                        设备权限状态:
                      </div>
                      <div className="flex gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              mediaStatus.camera === 'allowed'
                                ? 'bg-green-500'
                                : mediaStatus.camera === 'denied'
                                  ? 'bg-red-500'
                                  : 'bg-gray-400'
                            }`}
                          ></div>
                          <span>
                            摄像头:{' '}
                            {mediaStatus.camera === 'allowed'
                              ? '已授权'
                              : mediaStatus.camera === 'denied'
                                ? '被拒绝'
                                : '检查中'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              mediaStatus.microphone === 'allowed'
                                ? 'bg-green-500'
                                : mediaStatus.microphone === 'denied'
                                  ? 'bg-red-500'
                                  : 'bg-gray-400'
                            }`}
                          ></div>
                          <span>
                            麦克风:{' '}
                            {mediaStatus.microphone === 'allowed'
                              ? '已授权'
                              : mediaStatus.microphone === 'denied'
                                ? '被拒绝'
                                : '检查中'}
                          </span>
                        </div>
                      </div>
                      {(mediaStatus.camera === 'denied' || mediaStatus.microphone === 'denied') && (
                        <div className="mt-2 text-xs text-orange-700 dark:text-orange-300">
                          💡 如果权限被拒绝，请检查系统设置或重启应用
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 摄像头测试区域 */}
              {(testResult || isTestingCamera) && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <VideoIcon className="h-5 w-5 text-orange-500" />
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">摄像头测试结果</h3>
                  </div>

                  {/* 视频预览容器 */}
                  <div id="camera-test-container" className="mb-3"></div>

                  {/* 测试日志 */}
                  <div className="bg-black text-green-400 p-3 rounded font-mono text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {testResult || '等待测试结果...'}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    已连接到房间: {roomConfig?.roomName}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLeaveRoom}
                  className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                >
                  离开房间
                </Button>
              </div>

              <div className="relative min-h-[500px] bg-black rounded-lg overflow-hidden">
                {roomConfig && (
                  <LiveKitRoom
                    token={roomConfig.token}
                    serverUrl={roomConfig.serverUrl}
                    connect={true}
                    style={{ height: '100%' }}
                  >
                    <VideoConference />
                    <RoomAudioRenderer />
                  </LiveKitRoom>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
