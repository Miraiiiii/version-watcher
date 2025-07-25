/* eslint-disable no-restricted-globals */
import { NetworkService } from './network-monitor'
import { createInterval } from '../utils/common'

// 立即发送初始化消息
self.postMessage({ type: 'init', message: 'Worker initialized successfully!' })

let timer = null
let currentVersion = null
let options = {
  endpoint: '/dist/version.json',
  interval: 5 * 60 * 1000,
  disabled: false,
  isListenJSError: false,
  polling: true
}

// 处理来自主线程的消息
self.onmessage = function(event) {
  const { type, data } = event.data

  switch (type) {
    case 'start':
      options = { ...options, ...data }
      startChecking()
      break
    case 'stop':
      stopChecking()
      break
    case 'checkNow':
      checkVersion()
      break
    case 'syncVersion':
      console.log('[Worker] Syncing version:', data)
      currentVersion = data
      break
  }
}

async function checkVersion() {
  try {
    const baseUrl = self.location.origin
    const url = new URL(options.endpoint, baseUrl)
    const response = await NetworkService.fetchVersion(url)
    const { version, isTip } = response

    // 首次获取时设置当前版本
    if (!currentVersion) {
      currentVersion = version
      return
    }

    if (version !== currentVersion) {
      // 通知主线程版本变化
      self.postMessage({ 
        type: 'version-changed',
        data: {
          newVersion: version,
          currentVersion,
          isTip
        }
      })
      
      // 更新当前版本
      currentVersion = version

      // 如果需要提示，停止检查
      if (isTip) {
        stopChecking()
      }
    }
  } catch (error) {
    console.error('[Worker] Check version failed:', error)
  }
}

function startChecking() {
  stopChecking()

  // 立即执行一次检查
  checkVersion()
  
  // 只有在启用轮询的情况下才设置定时器
  if (options.polling) {
    timer = createInterval(() => checkVersion(), options.interval)
  }

  self.postMessage({ 
    type: 'status',
    data: { status: 'started', polling: options.polling }
  })
}

function stopChecking() {
  if (timer) {
    timer.stop()
    timer = null
      
    self.postMessage({ 
      type: 'status',
      data: { status: 'stopped' }
    })
  }
}

// 修改错误处理
self.onerror = function(event) {
  self.postMessage({ 
    type: 'error',
    error: {
      message: event.message || '未知错误',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error && event.error.stack ? event.error.stack : ''
    }
  })
    
  // 防止错误继续传播
  event.preventDefault()
}

// 修改 Promise 错误处理
self.onunhandledrejection = function(event) {
  const error = event.reason
  self.postMessage({ 
    type: 'error',
    error: {
      message: error.message || '未处理的 Promise 错误',
      stack: error.stack || '',
      name: error.name
    }
  })
  
  // 防止错误继续传播
  event.preventDefault()
}
