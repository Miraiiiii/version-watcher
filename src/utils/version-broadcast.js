class VersionBroadcast {
  constructor(channelName = 'version-sync') {
    if ('BroadcastChannel' in window) {
      this._mode = 'broadcastchannel'
      this.channel = new BroadcastChannel(channelName)
    } else if (window.localStorage) {
      this._mode = 'localstorage'
      this.channelName = channelName
      this.storageListener = null
    } else {
      this._mode = 'noop'
      console.warn('当前浏览器不支持 BroadcastChannel 和 localStorage，版本同步功能将无法使用')
    }
  }

  // 广播新版本
  broadcast(version) {
    if (this._mode === 'broadcastchannel') {
      console.log('[VersionBroadcast] Broadcasting version:', version)
      this.channel.postMessage({ type: 'version-sync', version })
    } else if (this._mode === 'localstorage') {
      try {
        localStorage.setItem(this.channelName, JSON.stringify({
          timestamp: Date.now(),
          version
        }))
      } catch (error) {
        console.error('localStorage 广播版本失败:', error)
      }
    }
  }

  // 监听版本更新
  onVersionSync(callback) {
    if (this._mode === 'broadcastchannel') {
      this.channel.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'version-sync') {
          callback && callback(event.data.version)
        }
      })
    } else if (this._mode === 'localstorage') {
      this.storageListener = (event) => {
        this.handleStorageEvent(event, callback)
      }
      window.addEventListener('storage', this.storageListener)
    }
  }

  handleStorageEvent(event, callback) {
    if (event.key === this.channelName) {
      try {
        const data = JSON.parse(event.newValue)
        if (data && data.version) {
          callback && callback(data.version)
        }
      } catch (error) {
        console.error('解析版本数据失败:', error)
      }
    }
  }

  // 清理监听器
  destroy() {
    if (this._mode === 'broadcastchannel') {
      this.channel.close()
    } else if (this._mode === 'localstorage' && this.storageListener) {
      window.removeEventListener('storage', this.storageListener)
      this.storageListener = null
    }
  }
}

export default new VersionBroadcast()
