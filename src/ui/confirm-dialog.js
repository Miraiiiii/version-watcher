class ConfirmDialog {
  constructor(options = {}) {
    this.options = {
      title: '提示',
      content: '发现新版本，是否更新？',
      ...options
    }
    
    this.dialog = null
    this.resolvePromise = null
    this.rejectPromise = null
  }

  _createDialog() {
    const dialog = document.createElement('div')
    dialog.className = 'vw-confirm-dialog'

    const content = document.createElement('div')
    content.className = 'vw-confirm-content'

    // 标题
    const title = document.createElement('div')
    title.className = 'vw-confirm-title'
    title.textContent = this.options.title

    // 内容
    const message = document.createElement('div')
    message.className = 'vw-confirm-message'
    message.textContent = this.options.content

    // 按钮容器
    const buttons = document.createElement('div')
    buttons.className = 'vw-confirm-buttons'

    // 刷新所有页签按钮
    const refreshAllBtn = document.createElement('button')
    refreshAllBtn.textContent = '刷新所有页签'
    refreshAllBtn.className = 'vw-confirm-primary'
    refreshAllBtn.onclick = () => this._handleAction('refreshAll')

    // 仅刷新当前页签按钮
    const refreshCurrentBtn = document.createElement('button')
    refreshCurrentBtn.textContent = '仅刷新当前页签'
    refreshCurrentBtn.className = 'vw-confirm-secondary'
    refreshCurrentBtn.onclick = () => this._handleAction('refreshCurrent')

    // 稍后更新按钮
    const laterBtn = document.createElement('button')
    laterBtn.textContent = '稍后更新'
    laterBtn.className = 'vw-confirm-cancel'
    laterBtn.onclick = () => this._handleAction('later')

    // 组装按钮
    buttons.appendChild(refreshAllBtn)
    buttons.appendChild(refreshCurrentBtn)
    buttons.appendChild(laterBtn)

    // 组装对话框
    content.appendChild(title)
    content.appendChild(message)
    content.appendChild(buttons)
    dialog.appendChild(content)

    return dialog
  }

  _handleAction(action) {
    if (this.resolvePromise) {
      this.resolvePromise(action)
    }
    this._close()
  }

  _close() {
    if (this.dialog && this.dialog.parentNode) {
      this.dialog.parentNode.removeChild(this.dialog)
    }
    this.dialog = null
  }

  show() {
    return new Promise((resolve, reject) => {
      this.resolvePromise = resolve
      this.rejectPromise = reject

      this.dialog = this._createDialog()
      document.body.appendChild(this.dialog)
    })
  }
}

export default ConfirmDialog
