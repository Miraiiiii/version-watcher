import refreshBroadcast from '../utils/refresh-broadcast'
import ConfirmDialog from './confirm-dialog'

export default class VersionNotifier {
  constructor(options = {}) {
    this.injectStyle(options)
  }

  createContainer() {
    const div = document.createElement('div')
    div.id = 'vw-version-notifier'
    div.className = 'vw-version-notifier'
    document.body.appendChild(div)
    return div
  }

  showUpdateNotification(event) {
    if (!this.container) {
      this.container = this.createContainer()
    }
    this.container.innerHTML = ''
    const alert = document.createElement('div')
    alert.className = 'vw-version-notifier__body'
    event.dangerouslyUseHTMLString && (alert.style.backgroundColor = '#FFFFFF')

    const defaultContent = `
      <div class="vw-version-notifier__wrapper">
        <div class="vw-version-notifier__title">
          新版上线啦！
        </div>
        <div class="vw-version-notifier__content">
          <div class="vw-version-notifier__desc">
            ${event.content}
          </div>
        </div>
        <div class="vw-version-notifier__footer">
          <div id="VersionNotifierConfirm" class="vw-version-notifier__btn vw-version-notifier__btn--confirm">
            立即更新
          </div>
          <div id="VersionNotifierCancel" class="vw-version-notifier__btn vw-version-notifier__btn--cancel">
            暂不更新
          </div>
        </div>
      </div>
    `
    alert.innerHTML = event.dangerouslyUseHTMLString ? event.content : defaultContent
    const confirm = alert.querySelector('#VersionNotifierConfirm')
    const cancel = alert.querySelector('#VersionNotifierCancel')

    confirm && confirm.addEventListener('click', async () => {
      try {
        // 当允许刷新同源页签且当前页面同源时，通知其它标签页刷新
        if (event.refreshSameOrigin && event.tabCount > 1) {
          const dialog = new ConfirmDialog({
            content: '检测到有多个同源标签页，请选择更新方式',
            newVersion: event.newVersion
          })

          const action = await dialog.show()
          if (action === 'refreshAll') {
            refreshBroadcast.broadcast()
            window.location.reload()
          } else if (action === 'refreshCurrent') {
            // 同步版本到其他页签
            if (event.onVersionSync) {
              event.onVersionSync(event.newVersion)
            }
            window.location.reload()
          } else if (action === 'later') {
            // 同步版本到其他页签
            if (event.onVersionSync) {
              event.onVersionSync(event.newVersion)
            }
            if (this.container) {
              this.container.remove()
              this.container = null
            }
          }
        } else {
          // 只有一个标签页时直接刷新
          window.location.reload()
        }
      } catch (error) {
        if (this.container) {
          this.container.remove()
          this.container = null
        }
      }
    })

    cancel && cancel.addEventListener('click', () => {
      // 同步版本到其他页签
      if (event.onVersionSync) {
        event.onVersionSync(event.newVersion)
      }
      if (this.container) {
        this.container.remove()
        this.container = null
      }
    })
    this.container.appendChild(alert)
  }

  injectStyle(options) {
    if (!options.customStyle) return
    const style = document.createElement('style')
    const textContent = {
      '#vw-version-notifier': {
        ...options.customStyle
      }
    }
    style.textContent = Object.entries(textContent)
      .map(([selector, styles]) => `${selector} { ${styles} }`)
      .join('\n')
    document.head.appendChild(style)
  }
}
