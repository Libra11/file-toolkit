/**
 * Author: Libra
 * Date: 2025-08-26
 * LastEditors: Libra
 * Description: WebRTC 音视频工具组件
 */
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Loader2, LogOut, Mic, RefreshCw, Settings2, Users, VideoIcon } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Field, Panel, PanelBody, PanelHeader } from './ui/panel'
import { Notice, StatusDot } from './ui/states'
import { cn } from '../lib/utils'
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react'
import { generateRoomName, generateUserId, getRoomConfig, requestToken } from '../utils/livekit'
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
  const { t } = useTranslation()
  const [roomConfig, setRoomConfig] = useState<RoomConfig | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [userName, setUserName] = useState(() => {
    const userId = generateUserId()
    return t('webrtcDefaultUser', { id: userId.slice(-4) })
  })
  const [roomName, setRoomName] = useState('default-room')
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
      alert(t('webrtcNameAndRoomRequired'))
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
        throw new Error(t('webrtcTokenFailed'))
      }

      const config: RoomConfig = {
        ...baseConfig,
        token
      }

      setRoomConfig(config)
      setIsConnected(true)
    } catch (error) {
      console.error('加入房间失败:', error)
      alert(t('webrtcJoinFailed'))
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
    setTestResult(`${t('webrtcCameraTestStart')}\n`)

    try {
      // 清理之前的视频元素
      const existingVideo = document.getElementById('camera-test-video')
      if (existingVideo) {
        existingVideo.remove()
      }

      console.log('🔍 开始最小摄像头验证...')
      setTestResult((prev) => prev + `${t('webrtcRequestingCameraPermission')}\n`)

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      console.log('✅ 摄像头流获取成功!')
      setTestResult((prev) => prev + `${t('webrtcCameraStreamAcquired')}\n`)

      const v = document.createElement('video')
      v.id = 'camera-test-video'
      v.autoplay = true
      v.muted = true // 一些平台不允许未静音的自动播放
      v.playsInline = true // iOS/部分WebView策略
      v.style.cssText =
        'display: block; width: 100%; max-width: 480px; aspect-ratio: 4 / 3; height: auto; border: 1px solid hsl(var(--border)); border-radius: 6px; margin: 0 0 12px; background-color: #151a17;'

      // 将视频元素插入到测试结果区域
      const testContainer = document.getElementById('camera-test-container')
      if (testContainer) {
        testContainer.appendChild(v)
      } else {
        document.body.appendChild(v)
      }

      // 设置视频流
      v.srcObject = stream
      setTestResult((prev) => prev + `${t('webrtcVideoStreamAttached')}\n`)

      // 先尝试播放，然后等待元数据
      try {
        await v.play()
        console.log('✅ 视频播放成功!')
        setTestResult((prev) => prev + `${t('webrtcVideoPlaybackSucceeded')}\n`)
      } catch (playError) {
        console.log('⚠️ 自动播放失败，但继续检查元数据:', playError)
        setTestResult((prev) => prev + `${t('webrtcAutoplayFailed')}\n`)
      }

      // 等待视频元数据加载，使用更短的超时时间
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          // 即使超时也检查一下当前状态
          if (v.videoWidth > 0 && v.videoHeight > 0) {
            console.log('✅ 超时但发现有效尺寸:', v.videoWidth, 'x', v.videoHeight)
            setTestResult(
              (prev) =>
                prev +
                `${t('webrtcValidVideoDimensions', { width: v.videoWidth, height: v.videoHeight })}\n`
            )
            resolve()
          } else {
            reject(new Error(t('webrtcVideoMetadataTimeout')))
          }
        }, 3000) // 缩短到3秒超时

        const onLoadedMetadata = (): void => {
          clearTimeout(timeout)
          console.log('✅ 视频元数据已加载:', v.videoWidth, 'x', v.videoHeight)
          setTestResult(
            (prev) =>
              prev +
              `${t('webrtcVideoMetadataLoaded', { width: v.videoWidth, height: v.videoHeight })}\n`
          )
          resolve()
        }

        const onError = (e: any): void => {
          clearTimeout(timeout)
          console.error('❌ 视频加载错误:', e)
          reject(new Error(t('webrtcVideoLoadError', { type: e.type })))
        }

        const onCanPlay = (): void => {
          clearTimeout(timeout)
          console.log('✅ 视频可以播放，尺寸:', v.videoWidth, 'x', v.videoHeight)
          setTestResult(
            (prev) =>
              prev +
              `${t('webrtcVideoPlayableDimensions', { width: v.videoWidth, height: v.videoHeight })}\n`
          )
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
      setTestResult(
        (prev) => prev + `${t('webrtcMediaTrackInfo')}: ${JSON.stringify(tracks, null, 2)}\n`
      )
      setTestResult((prev) => prev + `${t('webrtcCameraTestSucceeded')}\n`)

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
      setTestResult((prev) => prev + `${t('webrtcCameraTestFailed')}\n`)
      setTestResult((prev) => prev + `${t('webrtcErrorType')}: ${e?.name || t('unknownError')}\n`)
      setTestResult(
        (prev) => prev + `${t('webrtcErrorMessage')}: ${e?.message || t('unknownError')}\n`
      )
      setTestResult((prev) => prev + `${t('webrtcFullError')}: ${JSON.stringify(e, null, 2)}\n`)
    } finally {
      setIsTestingCamera(false)
    }
  }

  return (
    <div className={cn('min-w-0', className)}>
      <Panel>
        <PanelHeader
          eyebrow="LIVEKIT / WEBRTC"
          title={t('webrtcTool')}
          description={t('webrtcToolDescription')}
          action={
            <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <StatusDot tone={isConnected ? 'success' : 'neutral'} />
              {isConnected ? t('webrtcRoomConnected') : t('webrtcNotConnected')}
            </span>
          }
        />
        <PanelBody className="p-0">
          {!isConnected ? (
            <>
              <div className="grid xl:grid-cols-[minmax(0,1fr)_300px]">
                <section className="p-5">
                  <div className="mb-5">
                    <h3 className="text-sm font-semibold text-foreground">
                      {t('webrtcJoinMeeting')}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {t('webrtcJoinDescription')}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label={t('username')}>
                      <Input
                        id="username"
                        aria-label={t('username')}
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder={t('enterUsername')}
                      />
                    </Field>
                    <Field label={t('roomName')}>
                      <div className="flex gap-2">
                        <Input
                          id="roomname"
                          aria-label={t('roomName')}
                          value={roomName}
                          onChange={(e) => setRoomName(e.target.value)}
                          placeholder={t('enterRoomName')}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCreateRandomRoom}
                          className="h-9 shrink-0"
                        >
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.7} />
                          {t('randomRoom')}
                        </Button>
                      </div>
                    </Field>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                    <Button
                      type="button"
                      onClick={handleJoinRoom}
                      disabled={isConnecting || !userName.trim() || !roomName.trim()}
                    >
                      {isConnecting ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Users className="mr-2 h-3.5 w-3.5" strokeWidth={1.7} />
                      )}
                      {isConnecting ? t('connecting') : t('joinRoom')}
                    </Button>
                    <Button
                      type="button"
                      onClick={testCameraAccess}
                      disabled={isTestingCamera}
                      variant="outline"
                    >
                      {isTestingCamera ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Camera className="mr-2 h-3.5 w-3.5" strokeWidth={1.7} />
                      )}
                      {isTestingCamera ? t('webrtcTesting') : t('webrtcTestCamera')}
                    </Button>
                  </div>
                </section>

                <aside className="border-t border-border bg-muted/20 p-5 xl:border-l xl:border-t-0">
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.7} />
                    <h3 className="text-xs font-semibold text-foreground">
                      {t('webrtcDevicesAndConnection')}
                    </h3>
                  </div>

                  <div className="mt-3 divide-y divide-border border-y border-border">
                    <div className="flex items-center justify-between gap-3 py-2.5 text-xs">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Camera className="h-3.5 w-3.5" strokeWidth={1.7} />
                        {t('camera')}
                      </span>
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        <StatusDot
                          tone={
                            mediaStatus.camera === 'allowed'
                              ? 'success'
                              : mediaStatus.camera === 'denied'
                                ? 'error'
                                : 'neutral'
                          }
                        />
                        {t(`webrtcPermission.${mediaStatus.camera}`)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-2.5 text-xs">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Mic className="h-3.5 w-3.5" strokeWidth={1.7} />
                        {t('microphone')}
                      </span>
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        <StatusDot
                          tone={
                            mediaStatus.microphone === 'allowed'
                              ? 'success'
                              : mediaStatus.microphone === 'denied'
                                ? 'error'
                                : 'neutral'
                          }
                        />
                        {t(`webrtcPermission.${mediaStatus.microphone}`)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {t('server')}
                    </p>
                    <p className="mt-1 break-all font-mono text-[11px] text-foreground">
                      livekit.penlibra.xin
                    </p>
                  </div>

                  <ul className="mt-4 space-y-2 text-[11px] leading-relaxed text-muted-foreground">
                    <li>{t('webrtcSameRoomHint')}</li>
                    <li>{t('webrtcConferenceControlsHint')}</li>
                    <li>{t('webrtcMediaPrivacyHint')}</li>
                  </ul>

                  {(mediaStatus.camera === 'denied' || mediaStatus.microphone === 'denied') && (
                    <Notice
                      tone="error"
                      title={t('webrtcPermissionRestricted')}
                      description={t('webrtcPermissionRestrictedDescription')}
                      className="mt-4 px-3 py-2.5"
                    />
                  )}
                </aside>
              </div>

              {(testResult || isTestingCamera) && (
                <section className="border-t border-border p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <VideoIcon className="h-4 w-4 text-muted-foreground" strokeWidth={1.7} />
                    <h3 className="text-xs font-semibold text-foreground">
                      {t('webrtcCameraDiagnostics')}
                    </h3>
                  </div>
                  <div id="camera-test-container" className="empty:hidden" />
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/45 p-3 font-mono text-[11px] leading-5 text-foreground">
                    {testResult || t('webrtcTestResultEmpty')}
                  </pre>
                </section>
              )}
            </>
          ) : (
            <div className="space-y-4 p-4 sm:p-5">
              <Notice
                tone="success"
                title={t('webrtcJoinedRoom', { room: roomConfig?.roomName ?? '' })}
                description={t('webrtcJoinedRoomDescription', { user: userName })}
                action={
                  <Button type="button" variant="outline" size="sm" onClick={handleLeaveRoom}>
                    <LogOut className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.7} />
                    {t('leaveRoom')}
                  </Button>
                }
              />

              <div className="h-[560px] min-h-[500px] overflow-hidden rounded-md border border-border bg-[#151a17]">
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
        </PanelBody>
      </Panel>
    </div>
  )
}
