/*
 * @Description: 
 * @Author: 舌红
 * @Date: 2025-02-06 15:00:39
 * @LastEditors: 舌红
 * @LastEditTime: 2025-02-07 17:43:26
 */
export default class VersionNotifier {
  constructor(options = {}) {
    this.injectStyle(options)
  }

  createContainer() {
    const div = document.createElement('div')
    div.id = 'version-notifier'
    document.body.appendChild(div)
    return div
  }

  showUpdateNotification(event) {
    if (!this.container) {
      this.container = this.createContainer()
    }
    this.container.innerHTML = ''
    const alert = document.createElement('div')
    alert.className = 'version-notifier__body'
    event.dangerouslyUseHTMLString && (alert.style.backgroundColor = '#FFFFFF')

    const defaultContent = `
      <div class="version-notifier__wrapper">
        <div class="version-notifier__title">
          新版上线啦！
        </div>
        <div class="version-notifier__content">
          <div class="version-notifier__desc">
            ${event.content}
          </div>
        </div>
        <div class="version-notifier__footer">
          <div id="VersionNotifierConfirm" class="version-notifier__btn version-notifier__btn--confirm">
            立即更新
          </div>
          <div id="VersionNotifierCancel" class="version-notifier__btn version-notifier__btn--cancel">
            暂不更新
          </div>
        </div>
      </div>
    `
    alert.innerHTML = event.dangerouslyUseHTMLString ? event.content : defaultContent
    const confirm = alert.querySelector('#VersionNotifierConfirm')
    const cancel = alert.querySelector('#VersionNotifierCancel')
    confirm && confirm.addEventListener('click', () => {
      window.location.reload()
    })
    cancel && cancel.addEventListener('click', () => {
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
      '#version-notifier': {
        ...options.customStyle
      }
    }
    style.textContent = Object.entries(textContent)
      .map(([selector, styles]) => `${selector} { ${styles} }`)
      .join('\n')
    document.head.appendChild(style)
  }
}
