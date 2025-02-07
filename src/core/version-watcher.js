/*
 * @Description: 
 * @Author: 舌红
 * @Date: 2025-02-06 14:21:05
 * @LastEditors: 舌红
 * @LastEditTime: 2025-02-07 17:21:27
 */
import { NetworkService } from './network-monitor'
import { EventListener } from '../utils/event-listener'
import { isSameOrigin } from '../utils/common'

/**
 * 监听版本更新
 * @param {Object} options 配置对象
 * @param {String} options.endpoint 请求版本信息根目录路径，默认为'/dist/version.json'
 * @param {Number} options.interval 检查更新间隔时间，默认为5分钟，单位为毫秒
 * @param {Boolean} options.disabled 是否禁用提示更新，默认为false
 * @param {Boolean} options.isListenJSError 是否监听JS报错，默认为false
 * @param {String} options.content 弹窗内容
 * @param {Boolean} options.dangerouslyUseHTMLString 是否允许使用HTML字符串，默认为false
 * @param {Boolean} options.showTest 弹窗常显测试
 * @param {Boolean} options.refreshSameOrigin 是否刷新同源页面，默认为true
 * @returns {Void} 无返回值
 */

export default class VersionWatcher {
  constructor(options = {}) {
    this.options = {
      endpoint: '/dist/version.json',
      interval: 5 * 60 * 1000,
      content: '为了更好的版本体验请更新到最新版本',
      ...options,
    }

    this.currentVersion = null
    this.timer = null
    this.listeners = new Set()
  }

  async initialize() {
    // 改为每次初始化时获取最新版本
    await this.checkVersion()
    this.start()
    EventListener.addEventListenerWrapper(document, 'visibilitychange', this.listenPageVisible.bind(this))
    if (this.options.isListenJSError) {
      EventListener.addEventListenerWrapper(window, 'error', this.listenJSError.bind(this))
    }
  }

  // 监听页面可见性
  async listenPageVisible() {
    if (document.hidden) {
      this.stop()
    } else {
      await this.checkVersion()
      this.start()
    }
  }

  listenJSError(event) {
    if (event.target && event.target.nodeName === 'SCRIPT' && !this.options.disabled) {
      const scriptUrl = event.target.src || ''
      if (!scriptUrl) return
      if (isSameOrigin(scriptUrl) && event.message && event.message.includes('unexpected token')) {
        console.warn('可能由于构建版本差异导致的错误')
        this.notifyListeners(Date.now(), true)
      }
    }
  }

  async checkVersion() {
    try {
      const response = await NetworkService.fetchVersion(this.options.endpoint)
      const { version, isTip } = response

      // 首次获取时设置当前版本
      if (!this.currentVersion) {
        this.currentVersion = version
        return
      }

      if (version !== this.currentVersion) {
        this.notifyListeners(version, isTip)
      }
    } catch (error) {
      console.error('[VersionWatcher] Check failed:', error)
    }
  }

  notifyListeners(newVersion, isTip) {
    isTip && this.stop()
    
    const event = {
      newVersion,
      ...this.options
    }

    this.listeners.forEach(callback => callback(event, isTip))
    this.currentVersion = newVersion
  }

  start() {
    this.stop()
    this.timer = setInterval(() => this.checkVersion(), this.options.interval)
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
  
  onUpdate(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }
}
