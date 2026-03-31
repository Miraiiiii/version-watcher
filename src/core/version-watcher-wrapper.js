import SharedVersionWorker from 'shared-worker:./version-watcher.shared-worker.js'
import VersionWorker from 'web-worker:./version-watcher.worker.js'
import VersionWatcher from './version-watcher'
import { EventListener } from '../utils/event-listener'
import { isSameOrigin } from '../utils/common'
import TabManager from '../utils/tab-manager'
import { createVersionBroadcast } from '../utils/version-broadcast'
import { getSharedWorkerClientManager } from './shared-worker-client'
import { MESSAGE_TYPES, RUNTIME_MODES, normalizeRuntimeMessage } from './runtime-protocol'

const throttle = (fn, wait) => {
  let timer = null
  let previous = 0

  return function throttled(...args) {
    const now = Date.now()
    const remaining = wait - (now - previous)

    timer && clearTimeout(timer)

    if (remaining <= 0) {
      previous = now
      fn.apply(this, args)
    } else {
      timer = setTimeout(() => {
        previous = Date.now()
        fn.apply(this, args)
      }, remaining)
    }
  }
}

function createClientId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `vw-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export default class VersionWatcherWrapper {
  constructor(options = {}) {
    this._validateOptions(options)

    this.options = {
      endpoint: '/dist/version.json',
      interval: 5 * 60 * 1000,
      content: '为了更好的版本体验请更新到最新版本',
      disabled: false,
      isListenJSError: false,
      checkNowThrottleTime: 10000,
      refreshSameOrigin: true,
      polling: true,
      ...options,
    }

    this.clientId = createClientId()
    this.callbacks = new Set()
    this.mode = null
    this.initialized = false
    this.isVisible = typeof document === 'undefined' ? true : !document.hidden
    this.versionBroadcast = createVersionBroadcast()
    this._throttleCheckNow = throttle(() => {
      this.checkNow()
    }, this.options.checkNowThrottleTime)

    this._initRuntime()
    this._bindEvents()
    this._listenVersionSync()

    if (!this.options.disabled) {
      this.tabManager = new TabManager('version-watcher-tabs', {
        heartbeatInterval: this.options.tabHeartbeatInterval || 5000,
        inactiveTTL: this.options.tabInactiveTTL,
      })
    }
  }

  _validateOptions(options) {
    if (options.interval && (typeof options.interval !== 'number' || options.interval < 1000)) {
      throw new Error('interval 必须是大于等于 1000 的数字')
    }
    if (options.checkNowThrottleTime && (typeof options.checkNowThrottleTime !== 'number' || options.checkNowThrottleTime < 1000)) {
      throw new Error('checkNowThrottleTime 必须是大于等于 1000 的数字')
    }
    if (options.endpoint && typeof options.endpoint !== 'string') {
      throw new Error('endpoint 必须是字符串类型')
    }
    if (options.polling !== undefined && typeof options.polling !== 'boolean') {
      throw new Error('polling 必须是布尔类型')
    }
  }

  _initRuntime() {
    if (typeof SharedWorker !== 'undefined') {
      try {
        this.sharedWorkerManager = getSharedWorkerClientManager(SharedVersionWorker)
        this.mode = RUNTIME_MODES.SHARED_WORKER
        return
      } catch (error) {
        this._handleError(error, 'SharedWorker initialization')
      }
    }

    if (typeof Worker !== 'undefined') {
      try {
        this.worker = new VersionWorker()
        this.worker.onmessage = this._handleRuntimeMessage.bind(this)
        this.worker.onerror = (error) => {
          this._handleError(error, 'Worker error')
          this._fallbackToMainThread()
        }
        this.mode = RUNTIME_MODES.WORKER
        return
      } catch (error) {
        this._handleError(error, 'Worker initialization')
      }
    }

    this._fallbackToMainThread()
  }

  _fallbackToMainThread() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }

    this.mode = RUNTIME_MODES.FALLBACK
    this.fallbackWatcher = new VersionWatcher(this.options)
    this.fallbackWatcher.onUpdate((event, isTip) => {
      this._handleVersionChange(event, isTip)
    })
  }

  _handleError(error, source = '') {
    console.error('[VersionWatcher Error]', {
      message: error && error.message ? error.message : String(error),
      stack: error && error.stack ? error.stack : '',
      source,
      timestamp: new Date().toISOString(),
    })
  }

  _bindEvents() {
    this._visibilityChangeHandler = this.listenPageVisible.bind(this)
    this._jsErrorHandler = this.listenJSError.bind(this)

    EventListener.addEventListenerWrapper(document, 'visibilitychange', this._visibilityChangeHandler)

    if (this.options.isListenJSError) {
      EventListener.addEventListenerWrapper(window, 'error', this._jsErrorHandler)
    }
  }

  _unbindEvents() {
    if (this._visibilityChangeHandler) {
      EventListener.removeEventListenerWrapper(document, 'visibilitychange', this._visibilityChangeHandler)
      this._visibilityChangeHandler = null
    }

    if (this._jsErrorHandler) {
      EventListener.removeEventListenerWrapper(window, 'error', this._jsErrorHandler)
      this._jsErrorHandler = null
    }
  }

  _handleRuntimeMessage(event) {
    const message = normalizeRuntimeMessage(event)
    const { type, data, error } = message || {}

    switch (type) {
      case MESSAGE_TYPES.VERSION_CHANGED:
        this._handleVersionChanged(data)
        break
      case MESSAGE_TYPES.ERROR:
        this._handleError(error, 'Runtime message error')
        break
      default:
        break
    }
  }

  _createRuntimePayload() {
    return {
      endpoint: this.options.endpoint,
      interval: this.options.interval,
      polling: this.options.polling,
      visible: this.isVisible,
    }
  }

  _registerRuntime() {
    if (this.mode === RUNTIME_MODES.SHARED_WORKER && this.sharedWorkerManager) {
      this.sharedWorkerManager.register(this.clientId, this._createRuntimePayload(), (message) => {
        this._handleRuntimeMessage(message)
      })
      return
    }

    if (this.mode === RUNTIME_MODES.WORKER && this.worker) {
      this.worker.postMessage({
        type: MESSAGE_TYPES.REGISTER,
        clientId: this.clientId,
        data: this._createRuntimePayload(),
      })
      return
    }

    if (this.mode === RUNTIME_MODES.FALLBACK && this.fallbackWatcher) {
      this.fallbackWatcher.initialize()
    }
  }

  _setRuntimeVisibility(visible) {
    this.isVisible = visible

    if (this.mode === RUNTIME_MODES.SHARED_WORKER && this.sharedWorkerManager) {
      this.sharedWorkerManager.setVisibility(this.clientId, visible)
      return
    }

    if (this.mode === RUNTIME_MODES.WORKER && this.worker) {
      this.worker.postMessage({
        type: MESSAGE_TYPES.VISIBILITY_CHANGE,
        clientId: this.clientId,
        data: { visible },
      })
      return
    }

    if (this.mode === RUNTIME_MODES.FALLBACK && this.fallbackWatcher) {
      if (visible) {
        this.checkNow()
      } else {
        this.fallbackWatcher.stop()
      }
    }
  }

  _handleVersionChanged(data) {
    const eventObj = {
      newVersion: data.newVersion,
      currentVersion: data.currentVersion,
      ...this.options,
      onVersionSync: () => {
        this.syncVersion(data.newVersion)
      },
    }

    this._handleVersionChange(eventObj, data.isTip)
  }

  _handleVersionChange(event, isTip) {
    for (const callback of this.callbacks) {
      try {
        callback(event, isTip)
      } catch (error) {
        console.error('[VersionWatcherWrapper] Callback execution failed:', error)
      }
    }
  }

  _listenVersionSync() {
    this.versionBroadcast.onVersionSync((version) => {
      if (this.mode === RUNTIME_MODES.SHARED_WORKER && this.sharedWorkerManager) {
        this.sharedWorkerManager.syncVersion(this.clientId, version)
        return
      }

      if (this.mode === RUNTIME_MODES.WORKER && this.worker) {
        this.worker.postMessage({
          type: MESSAGE_TYPES.SYNC_VERSION,
          clientId: this.clientId,
          data: { version },
        })
        return
      }

      if (this.fallbackWatcher) {
        this.fallbackWatcher.currentVersion = version
        if (this.fallbackWatcher.options.polling) {
          this.fallbackWatcher.start()
        }
      }
    })
  }

  getMode() {
    return this.mode
  }

  getTabCount() {
    return this.tabManager ? this.tabManager.getTabCount() : 1
  }

  getTabIds() {
    return this.tabManager ? this.tabManager.getTabIds() : []
  }

  initialize() {
    if (this.initialized || this.options.disabled) {
      return
    }

    this.initialized = true
    this._registerRuntime()
  }

  checkNow() {
    if (!this.initialized && !this.options.disabled) {
      this.initialize()
    }

    if (this.mode === RUNTIME_MODES.SHARED_WORKER && this.sharedWorkerManager) {
      this.sharedWorkerManager.checkNow(this.clientId)
    } else if (this.mode === RUNTIME_MODES.WORKER && this.worker) {
      this.worker.postMessage({
        type: MESSAGE_TYPES.CHECK_NOW,
        clientId: this.clientId,
      })
    } else if (this.mode === RUNTIME_MODES.FALLBACK && this.fallbackWatcher) {
      this.fallbackWatcher.checkNow()
    }
  }

  listenPageVisible() {
    if (document.hidden) {
      this._setRuntimeVisibility(false)
    } else {
      this._setRuntimeVisibility(true)
      this._throttleCheckNow()
    }
  }

  listenJSError(event) {
    if (event.target && event.target.nodeName === 'SCRIPT' && !this.options.disabled) {
      const scriptUrl = event.target.src || ''
      if (!scriptUrl) return
      if (isSameOrigin(scriptUrl) && event.message) {
        this._throttleCheckNow()
      }
    }
  }

  syncVersion(version) {
    this.versionBroadcast.broadcast(version)
  }

  onUpdate(callback) {
    if (typeof callback === 'function') {
      this.callbacks.add(callback)
    }
  }

  stop() {
    this._setRuntimeVisibility(false)
  }

  destroy() {
    this.stop()
    this._unbindEvents()

    if (this.mode === RUNTIME_MODES.SHARED_WORKER && this.sharedWorkerManager) {
      this.sharedWorkerManager.unregister(this.clientId)
      this.sharedWorkerManager = null
    }

    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }

    if (this.fallbackWatcher) {
      this.fallbackWatcher.destroy()
      this.fallbackWatcher = null
    }

    if (this.tabManager) {
      this.tabManager.destroy()
      this.tabManager = null
    }

    this.versionBroadcast.destroy()
    this.callbacks.clear()
  }
}