import { NetworkService } from './network-monitor'

export default class VersionWatcher {
  constructor(options = {}) {
    this.options = {
      endpoint: '/dist/version.json',
      interval: 5 * 60 * 1000,
      content: '为了更好的版本体验请更新到最新版本',
      polling: true,
      ...options,
    }

    this.currentVersion = null
    this.timer = null
    this.listeners = new Set()
  }

  async initialize() {
    // 改为每次初始化时获取最新版本
    await this.checkVersion()
    if (this.options.polling) {
      this.start()
    }
  }

  async checkNow() {
    await this.checkVersion()
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
    if (isTip) {
      this.stop()
    }

    for (const listener of this.listeners) {
      listener({
        newVersion,
        currentVersion: this.currentVersion,
        isTip,
        onVersionSync: (version) => {
          // 更新当前版本
          this.currentVersion = version
          // 如果需要继续轮询，重新开始
          if (this.options.polling) {
            this.start()
          }
        }
      })
    }

    // 更新当前版本
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

  addListener(callback) {
    if (typeof callback === 'function') {
      this.listeners.add(callback)
    }
  }

  removeListener(callback) {
    this.listeners.delete(callback)
  }

  destroy() {
    this.stop()
    this.listeners.clear()
  }
}
