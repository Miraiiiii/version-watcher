class RefreshBroadcast {
  constructor(channelName = 'refresh-all-tabs') {
    if ('BroadcastChannel' in window) {
      this._mode = 'broadcastchannel'
      this.channel = new BroadcastChannel(channelName)
    } else if (window.localStorage) {
      this._mode = 'localstorage'
      this.channelName = channelName
      // 为了后续移除监听器，保存引用
      this.storageListener = null
    } else {
      this._mode = 'noop';
      console.warn('当前浏览器不支持 BroadcastChannel 和 localStorage，刷新广播功能将无法使用');
    }
  }

  // 发送刷新消息
  broadcast() {
    if (this._mode === 'broadcastchannel') {
      this.channel.postMessage('refresh')
    } else if (this._mode === 'localstorage') {
      try {
        // 写入 localStorage，利用 storage 事件通知其他标签页
        localStorage.setItem(this.channelName, Date.now().toString());
      } catch (error) {
        console.error('localStorage 广播消息失败:', error);
      }
    }
  }

  // 监听刷新消息
  onRefresh(callback) {
    if (this._mode === 'broadcastchannel') {
      this.channel.addEventListener('message', (event) => {
        if (event.data === 'refresh') {
          callback && callback()
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
      callback && callback()
    }
  }

  close() {
    if (this._mode === 'broadcastchannel') {
      this.channel.close()
    } else if (this._mode === 'localstorage' && this.storageListener) {
      window.removeEventListener('storage', this.storageListener)
      this.storageListener = null
    }
  }
}



export default new RefreshBroadcast()
