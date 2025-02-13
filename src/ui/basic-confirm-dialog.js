class BasicConfirmDialog {
  constructor(options = {}) {
    this.options = {
      title: '提示',
      content: '',
      confirmText: '确定',
      cancelText: '取消',
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

    // 取消按钮
    const cancelBtn = document.createElement('button')
    cancelBtn.textContent = this.options.cancelText
    cancelBtn.className = 'vw-confirm-cancel'
    cancelBtn.onclick = () => this._handleCancel()

    // 确认按钮
    const confirmBtn = document.createElement('button')
    confirmBtn.textContent = this.options.confirmText
    confirmBtn.className = 'vw-confirm-primary'
    confirmBtn.onclick = () => this._handleConfirm()

    // 组装对话框
    buttons.appendChild(cancelBtn)
    buttons.appendChild(confirmBtn)
    content.appendChild(title)
    content.appendChild(message)
    content.appendChild(buttons)
    dialog.appendChild(content)

    // 点击遮罩层关闭
    dialog.onclick = (e) => {
      if (e.target === dialog) {
        this._handleCancel()
      }
    }

    return dialog
  }

  _handleConfirm() {
    if (this.resolvePromise) {
      this.resolvePromise()
    }
    this._close()
  }

  _handleCancel() {
    if (this.rejectPromise) {
      this.rejectPromise(new Error('User cancelled'))
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

export default BasicConfirmDialog
