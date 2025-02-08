/**
 * 判断传入的 URL 是否与当前页面同源
 * @param {String} urlStr 传入的 URL 字符串
 * @returns {Boolean}
 */
export function isSameOrigin(urlStr) {
  // 如果 urlStr 以 '//' 开头，则补全协议 (例如：//example.com/script.js)
  if (urlStr.startsWith('//')) {
    urlStr = window.location.protocol + urlStr

  }

  // 如果 urlStr 不是以 http 或 https 开头，则认为是相对路径，同源
  if (!/^https?:\/\//i.test(urlStr)) {
    return true
  }
  // 使用正则提取协议和主机名以及端口号
  const match = urlStr.match(/^(https?:)\/\/([^/]+)(\/|$)/i)
  if (match) {
    const urlOrigin = match[1] + '//' + match[2]
    return urlOrigin === window.location.origin
  }
  return false
}
