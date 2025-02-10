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
