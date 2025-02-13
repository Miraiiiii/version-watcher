import BasicConfirmDialog from './basic-confirm-dialog'

class ConfirmService {
  constructor() {
    this.currentDialog = null
  }

  confirm(options) {
    // 如果已经有弹窗，先关闭它
    if (this.currentDialog) {
      this.currentDialog._close()
    }

    // 创建新的弹窗
    this.currentDialog = new BasicConfirmDialog(options)
    
    // 返回 Promise
    return this.currentDialog.show().finally(() => {
      this.currentDialog = null
    })
  }
}

// 创建单例
const confirmService = new ConfirmService()
export default confirmService
