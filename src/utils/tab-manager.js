class TabManager {
  constructor(channelName = 'version-watcher-tabs') {
    this.channel = new BroadcastChannel(channelName)
    this.tabs = new Set()
    this.tabId = this._generateTabId()
    
    // 监听其他页签的消息
    this.channel.onmessage = this._handleMessage.bind(this)
    
    // 在页面加载时广播自己的存在
    this._broadcastPresence()
    
    // 在页面可见性变化时广播自己的存在
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this._broadcastPresence()
      }
    })

    // 在页面关闭时通知其他页签
    window.addEventListener('unload', () => {
      this._broadcastLeave()
    })

    // 定期检查活跃状态
    this._startHeartbeat()
  }

  // 生成唯一的页签ID
  _generateTabId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // 广播自己的存在
  _broadcastPresence() {
    this.channel.postMessage({
      type: 'presence',
      tabId: this.tabId,
      timestamp: Date.now()
    })
  }

  // 广播自己要离开
  _broadcastLeave() {
    this.channel.postMessage({
      type: 'leave',
      tabId: this.tabId
    })
  }

  // 开始心跳检测
  _startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this._broadcastPresence()
      this._cleanInactiveTabs()
    }, 5000) // 每5秒发送一次心跳
  }

  // 清理不活跃的页签
  _cleanInactiveTabs() {
    if (!this.tabsLastSeen) return
    const now = Date.now()
    for (const [tabId, lastSeen] of this.tabsLastSeen) {
      if (now - lastSeen > 10000) { // 10秒没有心跳就认为页签已关闭
        this.tabs.delete(tabId)
        this.tabsLastSeen.delete(tabId)
      }
    }
  }

  // 处理其他页签的消息
  _handleMessage(event) {
    const { type, tabId } = event.data

    // 忽略自己发出的消息
    if (tabId === this.tabId) {
      return
    }

    // 更新页签最后活跃时间
    if (!this.tabsLastSeen) {
      this.tabsLastSeen = new Map()
    }
    this.tabsLastSeen.set(tabId, Date.now())
    
    switch (type) {
      case 'presence':
        // 收到其他页签的存在广播
        if (tabId !== this.tabId) {
          this.tabs.add(tabId)
        }
        break
      case 'leave':
        // 移除离开的页签
        this.tabs.delete(tabId)
        break
      case 'sync_request':
        // 收到同步请求，回应自己的存在
        this._broadcastPresence()
        break
    }
  }

  // 获取当前同源页签数量
  getTabCount() {
    // 加1是因为要包含当前页签
    return this.tabs.size + 1
  }

  // 获取所有页签ID
  getTabIds() {
    return [...this.tabs, this.tabId]
  }

  // 销毁实例
  destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    this._broadcastLeave()
    this.channel.close()
  }
}

export default TabManager
