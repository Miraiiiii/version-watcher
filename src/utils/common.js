/**
 * 判断传入的 URL 是否与当前页面同源
 * @param {String} urlStr 传入的 URL 字符串
 * @returns {Boolean}
 */
export function isSameOrigin(url) {
  try {
    const parsedUrl = new URL(url, window.location.href)
    return parsedUrl.origin === window.location.origin
  } catch (e) {
    console.error('URL解析错误:', e)
    return false
  }
}

/**
 * 使用 setTimeout 模拟 setInterval 的函数
 * @param {Function} callback 要执行的回调函数
 * @param {Number} delay 延迟时间（毫秒）
 * @returns {Object} 包含 start, stop 和 isRunning 方法的控制对象
 */
export function createInterval(callback, delay) {
  let timerId = null
  let isRunning = false

  function executeCallback() {
    if (!isRunning) return
    
    callback()
    
    // 在回调执行完成后再次设置 timeout
    timerId = setTimeout(executeCallback, delay)
  }

  return {
    start() {
      if (isRunning) return
      
      isRunning = true
      timerId = setTimeout(executeCallback, delay)
      return this
    },
    
    stop() {
      isRunning = false
      if (timerId !== null) {
        clearTimeout(timerId)
        timerId = null
      }
      return this
    },
    
    isRunning() {
      return isRunning
    }
  }
}
