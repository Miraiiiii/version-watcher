import './theme-chalk/index.scss'
import VersionWatcher from './core/version-watcher'
import VersionNotifier from './ui/version-notifier'

/**
 * 监听版本更新
 * @param {Object} options 配置对象
 * @param {String} options.endpoint 请求版本信息根目录路径，默认为'/dist/version.json'
 * @param {Number} options.interval 检查更新间隔时间，默认为5分钟，单位为毫秒
 * @param {Boolean} options.disabled 是否禁用提示更新，默认为false
 * @param {Boolean} options.isListenJSError 是否监听JS报错，默认为false
 * @param {String} options.content 弹窗内容
 * @param {Boolean} options.dangerouslyUseHTMLString 是否允许使用HTML字符串，默认为false
 * @param {Boolean} options.showTest 弹窗常显测试
 * @param {Boolean} options.refreshSameOrigin 是否刷新同源页面，默认为true
 * @returns {Void} 无返回值
 */

export default {
  install(app, options) {
    const versionWatcher = new VersionWatcher(options)
    const versionNotifier = new VersionNotifier(options)

    !options.disabled && versionWatcher.initialize()

    versionWatcher.onUpdate((event, isTip) => {
      isTip && versionNotifier.showUpdateNotification(event)
      console.log(`[VersionWatcher] New version available: ${event.newVersion}`)
    })

  }
}