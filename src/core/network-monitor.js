export class NetworkService {
  static async fetchVersion(fetchUrl) {
    if (!this.checkOnlineStatus()) throw new Error('Network is offline')
    try {
      const response = await fetch(`${fetchUrl.toString()}?t=${Date.now()}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      return response.json()
    } catch (error) {
      console.error('[NetworkService] 请求失败:', error)
      throw error // 保持错误冒泡
    }
  }

  static checkOnlineStatus() {
    return navigator.onLine
  }
}
