export class RefreshBroadcast {
  constructor(channelName = 'refresh-all-tabs') {
    if ('BroadcastChannel' in window) {
      this._mode = 'broadcastchannel'
      this.channel = new BroadcastChannel(channelName)
    } else if (window.localStorage) {
      this._mode = 'localstorage'
      this.channelName = channelName
      this.storageListener = null
    } else {
      this._mode = 'noop'
      console.warn('当前浏览器不支持 BroadcastChannel 和 localStorage，刷新广播功能将无法使用')
    }
  }

  broadcast() {
    if (this._mode === 'broadcastchannel') {
      this.channel.postMessage('refresh')
    } else if (this._mode === 'localstorage') {
      try {
        localStorage.setItem(this.channelName, Date.now().toString())
      } catch (error) {
        console.error('localStorage 广播消息失败:', error)
      }
    }
  }

  onRefresh(callback) {
    if (this._mode === 'broadcastchannel') {
      this.messageListener = (event) => {
        if (event.data === 'refresh') {
          callback && callback()
        }
      }
      this.channel.addEventListener('message', this.messageListener)
    } else if (this._mode === 'localstorage') {
      this.storageListener = (event) => {
        this.handleStorageEvent(event, callback)
      }
      window.addEventListener('storage', this.storageListener)
    }
  }

  handleStorageEvent(event, callback) {
    if (event.key === this.channelName) {
      callback && callback()
    }
  }

  destroy() {
    if (this._mode === 'broadcastchannel') {
      if (this.messageListener) {
        this.channel.removeEventListener('message', this.messageListener)
        this.messageListener = null
      }
      this.channel.close()
    } else if (this._mode === 'localstorage' && this.storageListener) {
      window.removeEventListener('storage', this.storageListener)
      this.storageListener = null
    }
  }
}

export function createRefreshBroadcast(channelName) {
  return new RefreshBroadcast(channelName)
}