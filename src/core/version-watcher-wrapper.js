import VersionWorker from 'web-worker:./version-watcher.worker.js'
import { EventListener } from '../utils/event-listener'
import { isSameOrigin } from '../utils/common'
import TabManager from '../utils/tab-manager'
import versionBroadcast from '../utils/version-broadcast'

// 防抖函数
const debounce = (fn, wait) => {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, wait)
  }
}

/**
 * 监听版本更新
 * @param {Object} options 配置对象
 * @param {String} options.endpoint 请求版本信息根目录路径，默认为'/dist/version.json'
 * @param {Number} options.interval 检查更新间隔时间，默认为5分钟，单位为毫秒
 * @param {Boolean} options.disabled 是否禁用提示更新，默认为false
 * @param {Boolean} options.isListenJSError 是否监听JS报错，默认为false
 * @param {String} options.content 弹窗内容
 * @param {Boolean} options.dangerouslyUseHTMLString 是否允许使用HTML字符串，默认为false
 * @param {Boolean} options.refreshSameOrigin 是否刷新同源页面，默认为true
 * @param {Number} options.pageVisibleDebounceTime 页面可见性检查防抖时间，默认为10秒，单位为毫秒
 * @param {Boolean} options.polling 是否启用轮询检查，默认为true。如果设为false，则只在页面可见性变化和JS错误时检查
 * @returns {Void} 无返回值
 */
export default class VersionWatcherWrapper {
  constructor(options = {}) {
    // 验证参数
    this._validateOptions(options)

    // 默认配置及自定义配置合并
    this.options = {
      endpoint: '/dist/version.json',
      interval: 5 * 60 * 1000,
      content: '为了更好的版本体验请更新到最新版本',
      disabled: false,
      isListenJSError: false,
      pageVisibleDebounceTime: 10000,
      refreshSameOrigin: true,
      polling: true,
      ...options
    }

    // 用于存储版本更新回调
    this.callbacks = new Set()
    
    // 防抖后的页面可见性检查函数
    this._debouncedVisibilityCheck = debounce(() => {
      if (!document.hidden) {
        this.checkNow()
      }
    }, this.options.pageVisibleDebounceTime)

    // 判断浏览器是否支持 Worker
    if (typeof Worker !== 'undefined') {
      this.mode = 'worker'
      try {
        this.worker = new VersionWorker()
        this._initWorker()
      } catch (error) {
        this._handleError(error, 'Worker initialization')
        this._fallbackToMainThread()
      }
    } else {
      this._fallbackToMainThread()
    }

    if (this.worker || this.fallbackWatcher) {
      this._bindEvents()
    }

    // 监听版本同步
    this._listenVersionSync()

    // 初始化页签管理器
    this.tabManager = new TabManager()
  }

  // 获取同源页签数量
  getTabCount() {
    return this.tabManager.getTabCount()
  }

  // 获取所有同源页签ID
  getTabIds() {
    return this.tabManager.getTabIds()
  }

  // 验证配置参数
  _validateOptions(options) {
    if (options.interval && (typeof options.interval !== 'number' || options.interval < 1000)) {
      throw new Error('interval 必须是大于等于1000的数字')
    }
    if (options.pageVisibleDebounceTime && (typeof options.pageVisibleDebounceTime !== 'number' || options.pageVisibleDebounceTime < 1000)) {
      throw new Error('pageVisibleDebounceTime 必须是大于等于1000的数字')
    }
    if (options.endpoint && typeof options.endpoint !== 'string') {
      throw new Error('endpoint 必须是字符串类型')
    }
    if (options.polling !== undefined && typeof options.polling !== 'boolean') {
      throw new Error('polling 必须是布尔类型')
    }
  }

  // 统一的错误处理方法
  _handleError(error, source = '') {
    const errorMessage = {
      message: error.message,
      stack: error.stack,
      source,
      timestamp: new Date().toISOString()
    }
    console.error('[VersionWatcher Error]', errorMessage)
  }

  // 切换到主线程模式
  _fallbackToMainThread() {
    // 先销毁 worker
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }

    this.mode = 'fallback'
    this.fallbackWatcher = null
    console.warn('当前浏览器不支持 Worker 或 Worker 初始化失败，使用主线程版本监控')
    this._initFallback()
  }

  // 绑定事件
  _bindEvents() {
    this._visibilityChangeHandler = this.listenPageVisible.bind(this)
    this._jsErrorHandler = this.listenJSError.bind(this)
    
    EventListener.addEventListenerWrapper(
      document,
      'visibilitychange',
      this._visibilityChangeHandler
    )
    
    if (this.options.isListenJSError) {
      EventListener.addEventListenerWrapper(
        window,
        'error',
        this._jsErrorHandler
      )
    }
  }

  // 解绑事件
  _unbindEvents() {
    if (this._visibilityChangeHandler) {
      EventListener.removeEventListenerWrapper(
        document,
        'visibilitychange',
        this._visibilityChangeHandler
      )
      this._visibilityChangeHandler = null
    }
    
    if (this._jsErrorHandler) {
      EventListener.removeEventListenerWrapper(
        window,
        'error',
        this._jsErrorHandler
      )
      this._jsErrorHandler = null
    }
  }

  // Worker 模式下建立消息通信
  _initWorker() {
    if (!this.worker) return

    this.worker.onerror = (error) => {
      this._handleError(error, 'Worker error')
      this._fallbackToMainThread()
    }

    this.worker.onmessage = (event) => {
      const { type, data, message, error } = event.data
      switch (type) {
        case 'init':
          console.log('[VersionWatcher] Worker initialized:', message)
          break
        case 'version-changed':
          this._handleVersionChanged(data)
          break
        case 'status':
          break
        case 'error':
          this._handleError(error, 'Worker message error')
          break
        default:
          break
      }
    }
  }

  // fallback 模式，动态加载主线程版本监听组件
  _initFallback() {
    import('./version-watcher.js')
      .then((module) => {
        const VersionWatcher = module.default
        this.fallbackWatcher = new VersionWatcher(this.options)
        this.fallbackWatcher.initialize()
        this.fallbackWatcher.onUpdate((event, isTip) => {
          this.callbacks.forEach((cb) => cb(event, isTip))
        })
      })
      .catch((error) => {
        this._handleError(error, 'Fallback initialization')
      })
  }

  // 将 Worker 返回的数据转换为统一事件格式，并回调外部注册回调
  _handleVersionChanged(data) {
    const eventObj = {
      newVersion: data.newVersion,
      ...this.options
    }
    // 如果有多个同源标签页，添加版本同步回调
    if (this.getTabCount() > 1) {
      eventObj.onVersionSync = () => {
        console.log('[VersionWatcherWrapper] Syncing version:', data.newVersion)
        this.syncVersion(data.newVersion)
      }
    }
    this._handleVersionChange(eventObj, data.isTip)
  }

  _handleVersionChange(event, isTip) {
    // 通知所有回调
    for (const callback of this.callbacks) {
      try {
        callback(event, isTip)
      } catch (error) {
        console.error('[VersionWatcherWrapper] Callback execution failed:', error)
      }
    }
  }

  // 启动版本检测
  initialize() {
    if (this.mode === 'worker' && this.worker) {
      this.worker.postMessage({ type: 'start', data: this.options })
    }
  }

  // 立即检测版本
  checkNow() {
    if (this.mode === 'worker' && this.worker) {
      this.worker.postMessage({ type: 'checkNow' })
    } else if (this.mode === 'fallback' && this.fallbackWatcher) {
      this.fallbackWatcher.checkNow()
    }
  }

  // 监听页面可见性，主动触发检查
  listenPageVisible() {
    if (document.hidden) {
      this.stop()
    } else {
      this._debouncedVisibilityCheck()
    }
  }

  // 监听JS错误
  listenJSError(event) {
    if (event.target && event.target.nodeName === 'SCRIPT' && !this.options.disabled) {
      const scriptUrl = event.target.src || ''
      if (!scriptUrl) return
      if (isSameOrigin(scriptUrl) && event.message && event.message.includes('unexpected token')) {
        console.warn('可能由于构建版本差异导致的错误')
        this.checkNow()
      }
    }
  }

  // 监听版本同步
  _listenVersionSync() {
    versionBroadcast.onVersionSync(version => {
      console.log('[VersionWatcherWrapper] Received version sync:', version)
      // 更新 worker 版本
      if (this.worker) {
        this.worker.postMessage({ type: 'syncVersion', data: version })
      }
      // 更新 fallback 版本
      if (this.fallbackWatcher) {
        this.fallbackWatcher.currentVersion = version
        // 如果需要继续轮询，重新开始
        if (this.fallbackWatcher.options.polling) {
          this.fallbackWatcher.start()
        }
      }
    })
  }

  // 同步版本到其他页签
  syncVersion(version) {
    console.log('[VersionWatcherWrapper] Broadcasting version:', version)
    versionBroadcast.broadcast(version)
  }

  // 注册更新回调
  onUpdate(callback) {
    if (typeof callback === 'function') {
      this.callbacks.add(callback)
    }
  }

  // 停止检测
  stop() {
    if (this.mode === 'worker' && this.worker) {
      this.worker.postMessage({ type: 'stop' })
    } else if (this.mode === 'fallback' && this.fallbackWatcher) {
      this.fallbackWatcher.stop()
    }
  }

  // 销毁实例
  destroy() {
    this.stop()
    this._unbindEvents()
    
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    
    if (this.fallbackWatcher) {
      this.fallbackWatcher.destroy && this.fallbackWatcher.destroy()
      this.fallbackWatcher = null
    }
    
    versionBroadcast.destroy()

    this.callbacks.clear()
    this.tabManager.destroy()
  }
}