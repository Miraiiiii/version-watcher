import './theme-chalk/index.scss'
import VersionWatcherWrapper from './core/version-watcher-wrapper'
import VersionNotifier from './ui/version-notifier'
import refreshBroadcast from './utils/refresh-broadcast'
import 'core-js'
import 'regenerator-runtime/runtime'

// 监听广播刷新消息，收到消息后进行刷新处理
refreshBroadcast.onRefresh(() => {
  window.location.reload()
})

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
 * @param {Number} options.checkNowThrottleTime 版本立即检查节流时间，默认为10秒，单位为毫秒（一般用在页面切换时，避免频繁检查）
 * @param {Boolean} options.polling 是否启用轮询检查，默认为true。如果设为false，则只在页面可见性变化和JS错误时检查
 * @returns {Void} 无返回值
 */

class VersionWatcherInstance {
  constructor(options) {
    this.watcher = new VersionWatcherWrapper(options)
    this.notifier = new VersionNotifier(options)

    !options.disabled && this.watcher.initialize()

    this.watcher.onUpdate((event, isTip) => {
      isTip && this.notifier.showUpdateNotification({
        ...event,
        tabCount: this.getTabCount()
      })
      console.log(`[VersionWatcher] New version available: ${event.newVersion}`)
    })
  }

  // 获取同源页签数量
  getTabCount() {
    return this.watcher.getTabCount()
  }

  // 获取所有同源页签ID
  getTabIds() {
    return this.watcher.getTabIds()
  }

  checkNow() {
    this.watcher.checkNow()
  }

  destroy() {
    this.watcher.destroy()
  }
}

const VersionWatcher = {
  install(app, options) {
    const instance = new VersionWatcherInstance(options)
    return instance
  }
}

export { VersionWatcher, VersionWatcherInstance }
export default VersionWatcher