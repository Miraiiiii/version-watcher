import './theme-chalk/index.scss'
import VersionWatcherWrapper from './core/version-watcher-wrapper'
import VersionNotifier from './ui/version-notifier'
import { createRefreshBroadcast } from './utils/refresh-broadcast'
import 'core-js'
import 'regenerator-runtime/runtime'

class VersionWatcherInstance {
  constructor(options = {}) {
    this.watcher = new VersionWatcherWrapper(options)
    this.notifier = new VersionNotifier(options)
    this.refreshBroadcast = createRefreshBroadcast()
    this.refreshBroadcast.onRefresh(() => {
      window.location.reload()
    })

    if (!options.disabled) {
      this.watcher.initialize()
    }

    this.watcher.onUpdate(this.handleUpdate.bind(this))
  }

  handleUpdate(event, isTip) {
    if (isTip) {
      this.notifier.showUpdateNotification({
        ...event,
        tabCount: this.getTabCount(),
      })
    }
    console.log(`[VersionWatcher] New version available: ${event.newVersion}`)
  }

  getMode() {
    return this.watcher.getMode()
  }

  getTabCount() {
    return this.watcher.getTabCount()
  }

  getTabIds() {
    return this.watcher.getTabIds()
  }

  checkNow() {
    this.watcher.checkNow()
  }

  destroy() {
    this.notifier.destroy()
    this.refreshBroadcast.destroy()
    this.watcher.destroy()
  }
}

const VersionWatcher = {
  install(app, options = {}) {
    return new VersionWatcherInstance(options)
  },
}

export { VersionWatcher, VersionWatcherInstance }
export default VersionWatcher
