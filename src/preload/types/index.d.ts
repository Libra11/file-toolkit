// 添加图片整理工具的类型定义
interface ImageOrganizeAPI {
  on(channel: string, callback: (...args: any[]) => void): void
  removeAllListeners(channel: string): void
  invoke(channel: string, ...args: any[]): Promise<any>
}

// 添加到全局接口中
interface Window {
  // ... 其他API定义
  imageOrganize: ImageOrganizeAPI
}
