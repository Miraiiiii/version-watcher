/*
 * @Description: 网络状态监控
 * @Author: 舌红
 * @Date: 2025-02-06 11:24:30
 * @LastEditors: 舌红
 * @LastEditTime: 2025-02-06 16:36:09
 */

export class NetworkService {
  static async fetchVersion(endpoint) {
    if (!this.checkOnlineStatus()) throw new Error('Network is offline')
    try {
      const response = await fetch(`${endpoint}?t=${Date.now()}`)
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
