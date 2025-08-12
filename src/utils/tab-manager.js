import { createInterval } from './common'

const MSG = {
  PRESENCE: 'presence',
  LEAVE: 'leave',
  SYNC_REQUEST: 'sync_request',
}

class TabManager {
  constructor(channelName = 'version-watcher-tabs', options = {}) {
    const {
      heartbeatInterval = 5000,
      // 如果未显式提供 inactiveTTL，则按心跳的 6 倍计算，避免后台标签页被过早清理
      inactiveTTL,
    } = options

    this.channelName = channelName
    this.heartbeatMs = heartbeatInterval
    const computedInactiveTTL = typeof inactiveTTL === 'number' ? inactiveTTL : this.heartbeatMs * 6
    this.inactiveTTL = computedInactiveTTL

    this.tabId = this._generateTabId()
    this.tabsLastSeen = new Map()

    if ('BroadcastChannel' in window) {
      this._mode = 'broadcastchannel'
      this.channel = new BroadcastChannel(this.channelName)
      this._bcHandler = (event) => this._handleMessage(event.data)
      this.channel.addEventListener('message', this._bcHandler)
    } else if (window.localStorage) {
      this._mode = 'localstorage'
      this._storageListener = (event) => this._handleStorageEvent(event)
      window.addEventListener('storage', this._storageListener)
    } else {
      this._mode = 'noop'
      console.warn('当前浏览器不支持 BroadcastChannel 和 localStorage，TabManager 将降级为 noop')
    }

    this._onVisibilityChange = () => {
      if (!document.hidden) this._broadcastPresence()
    }
    document.addEventListener('visibilitychange', this._onVisibilityChange)

    this._onPageHide = () => {
      this._broadcastLeave()
    }
    window.addEventListener('pagehide', this._onPageHide)

    // 兜底：在页面即将卸载时也广播一次离开，减少“僵尸”标签
    this._onBeforeUnload = () => {
      this._broadcastLeave()
    }
    window.addEventListener('beforeunload', this._onBeforeUnload)

    this._broadcastPresence()
    this._broadcastSyncRequest()

    this.heartbeatInterval = createInterval(() => {
      this._broadcastPresence()
      this._cleanInactiveTabs()
    }, this.heartbeatMs).start()
  }

  _generateTabId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }

  _postMessage(payload) {
    if (this._mode === 'broadcastchannel') {
      this.channel.postMessage(payload)
    } else if (this._mode === 'localstorage') {
      try {
        localStorage.setItem(
          this.channelName,
          JSON.stringify({ ...payload, nonce: Math.random().toString(36).slice(2) })
        )
      } catch (err) {
        console.error('localStorage 广播失败:', err)
      }
    }
  }

  _broadcastPresence() {
    this._postMessage({
      type: MSG.PRESENCE,
      tabId: this.tabId,
      timestamp: Date.now(),
    })
  }

  _broadcastLeave() {
    this._postMessage({
      type: MSG.LEAVE,
      tabId: this.tabId,
      timestamp: Date.now(),
    })
  }

  _broadcastSyncRequest() {
    this._postMessage({
      type: MSG.SYNC_REQUEST,
      tabId: this.tabId,
      timestamp: Date.now(),
    })
  }

  _handleStorageEvent(event) {
    if (event.key !== this.channelName || !event.newValue) return
    try {
      const data = JSON.parse(event.newValue)
      this._handleMessage(data)
    } catch (e) {
      console.error('解析 storage 消息失败:', e)
    }
  }

  _handleMessage(data) {
    if (!data || !data.type) return
    const { type, tabId } = data
    if (tabId === this.tabId) return

    this.tabsLastSeen.set(tabId, Date.now())

    switch (type) {
      case MSG.PRESENCE:
        break
      case MSG.LEAVE:
        this.tabsLastSeen.delete(tabId)
        break
      case MSG.SYNC_REQUEST:
        this._broadcastPresence()
        break
      default:
        break
    }
  }

  _cleanInactiveTabs() {
    const now = Date.now()
    for (const [id, lastSeen] of this.tabsLastSeen) {
      if (now - lastSeen > this.inactiveTTL) {
        this.tabsLastSeen.delete(id)
      }
    }
  }

  getTabCount() {
    this._cleanInactiveTabs()
    return this.tabsLastSeen.size + 1
  }

  getTabIds() {
    this._cleanInactiveTabs()
    return [...this.tabsLastSeen.keys(), this.tabId]
  }

  destroy() {
    if (this.heartbeatInterval) {
      this.heartbeatInterval.stop()
    }
    this._broadcastLeave()

    document.removeEventListener('visibilitychange', this._onVisibilityChange)
    window.removeEventListener('pagehide', this._onPageHide)
    window.removeEventListener('beforeunload', this._onBeforeUnload)

    if (this._mode === 'broadcastchannel') {
      if (this.channel && this._bcHandler) {
        this.channel.removeEventListener('message', this._bcHandler)
      }
      this.channel && this.channel.close()
    } else if (this._mode === 'localstorage') {
      if (this._storageListener) {
        window.removeEventListener('storage', this._storageListener)
      }
    }
  }
}

export default TabManager
