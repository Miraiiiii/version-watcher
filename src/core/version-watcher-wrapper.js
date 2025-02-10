import VersionWorker from 'web-worker:./version-watcher.worker.js'
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
 * @param {Boolean} options.refreshSameOrigin 是否刷新同源页面，默认为true
 * @returns {Void} 无返回值
 */

export default class VersionWatcherWrapper {
  constructor(options = {}) {

    // 默认配置及自定义配置合并
    this.options = {
      endpoint: '/dist/version.json',
      interval: 5 * 60 * 1000,
      content: '为了更好的版本体验请更新到最新版本',
      disabled: false,
      isListenJSError: false,
      ...options
    }

    // 用于存储版本更新回调
    this.callbacks = new Set()

    // 判断浏览器是否支持 Worker
    if (typeof Worker !== 'undefined') {
      this.mode = 'worker'

      this.worker = new VersionWorker()
      this._initWorker()
    } else {
      this.fallbackWatcher = null
      console.warn('当前浏览器不支持 Worker，使用主线程版本监控')
      this.mode = 'fallback'
      this._initFallback()
    }
    if (this.worker || this.fallbackWatcher) {
      EventListener.addEventListenerWrapper(document, 'visibilitychange', this.listenPageVisible.bind(this))
      this.options.isListenJSError && EventListener.addEventListenerWrapper(window, 'error', this.listenJSError.bind(this))
    }
  }

  // Worker 模式下建立消息通信
  _initWorker() {
    if (!this.worker) return
    this.worker.onerror = (error) => {
      console.error('[VersionWatcher] Worker error:', error)
      this.mode = 'fallback'
      this._initFallback()
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
          console.error('[VersionWatcherWrapper Worker Error]', error)
          break
        default:
          break
      }
    }
  }

  // 将 Worker 返回的数据转换为统一事件格式，并回调外部注册回调
  _handleVersionChanged(data) {
    const eventObj = {
      newVersion: data.version,
      ...this.options
    }
    this.callbacks.forEach((cb) => cb(eventObj, data.isTip))
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
        console.error('加载主线程版本监控组件失败:', error)
      })
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
      this.checkNow()
    }
  }

  listenJSError(event) {
    if (event.target && event.target.nodeName === 'SCRIPT' && !this.options.disabled) {
      const scriptUrl = event.target.src || ''
      if (!scriptUrl) return
      if (isSameOrigin(scriptUrl) && event.message && event.message.includes('unexpected token')) {
        console.warn('可能由于构建版本差异导致的错误')
        this._handleVersionChanged({
          newVersion: Date.now(),
          isTip: !this.options.disabled
        })
      }
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

  // 注册版本更新回调
  onUpdate(callback) {
    this.callbacks.add(callback)
    return () => {
      this.callbacks.delete(callback)
    }
  }

  // 销毁版本检测器，清理资源
  destroy() {
    if (this.mode === 'worker' && this.worker) {
      this.worker.terminate()
      this.worker = null
    } else if (this.mode === 'fallback' && this.fallbackWatcher) {
      this.fallbackWatcher.stop()
      this.fallbackWatcher = null
    }
    this.callbacks.clear()
  }
} 