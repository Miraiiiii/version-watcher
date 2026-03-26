import { NetworkService } from './network-monitor'
import { createInterval } from '../utils/common'
import { RUNTIME_MODES } from './runtime-protocol'

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

  getMode() {
    return RUNTIME_MODES.FALLBACK
  }

  async initialize() {
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
          this.currentVersion = version
          if (this.options.polling) {
            this.start()
          }
        },
      }, isTip)
    }

    this.currentVersion = newVersion
  }

  onUpdate(callback) {
    if (typeof callback === 'function') {
      this.listeners.add(callback)
    }
  }

  start() {
    this.stop()
    this.timer = createInterval(() => this.checkVersion(), this.options.interval).start()
  }

  stop() {
    if (this.timer) {
      this.timer.stop()
      this.timer = null
    }
  }

  destroy() {
    this.stop()
    this.listeners.clear()
  }
}