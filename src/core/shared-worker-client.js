function getGlobalScope() {
  if (typeof self !== 'undefined') return self
  if (typeof window !== 'undefined') return window
  if (typeof global !== 'undefined') return global
  return {}
}

import { MESSAGE_TYPES } from './runtime-protocol'

let sharedWorkerClientManager = null

class SharedWorkerClientManager {
  constructor(WorkerFactory = getGlobalScope().SharedWorker) {
    if (typeof WorkerFactory !== 'function') {
      throw new Error('SharedWorker is not supported in this environment')
    }

    this.worker = new WorkerFactory()
    this.port = this.worker.port
    this.callbacks = new Map()
    this.port.start && this.port.start()
    this.port.onmessage = this._handleMessage.bind(this)
  }

  _handleMessage(event) {
    const message = event.data || {}
    const callback = this.callbacks.get(message.clientId)

    if (callback) {
      callback(message)
    }
  }

  _postMessage(message) {
    this.port.postMessage(message)
  }

  register(clientId, options, callback) {
    this.callbacks.set(clientId, callback)
    this._postMessage({
      type: MESSAGE_TYPES.REGISTER,
      clientId,
      data: options,
    })
  }

  unregister(clientId) {
    if (!this.callbacks.has(clientId)) return

    this.callbacks.delete(clientId)
    this._postMessage({
      type: MESSAGE_TYPES.UNREGISTER,
      clientId,
    })

    if (this.callbacks.size === 0) {
      this.destroy()
      sharedWorkerClientManager = null
    }
  }

  setVisibility(clientId, visible) {
    this._postMessage({
      type: MESSAGE_TYPES.VISIBILITY_CHANGE,
      clientId,
      data: { visible },
    })
  }

  checkNow(clientId) {
    this._postMessage({
      type: MESSAGE_TYPES.CHECK_NOW,
      clientId,
    })
  }

  syncVersion(clientId, version) {
    this._postMessage({
      type: MESSAGE_TYPES.SYNC_VERSION,
      clientId,
      data: { version },
    })
  }

  destroy() {
    this.callbacks.clear()
    if (this.port) {
      this.port.onmessage = null
      this.port.close && this.port.close()
    }
    this.worker = null
    this.port = null
  }
}

export function getSharedWorkerClientManager(WorkerFactory = getGlobalScope().SharedWorker) {
  if (!sharedWorkerClientManager) {
    sharedWorkerClientManager = new SharedWorkerClientManager(WorkerFactory)
  }

  return sharedWorkerClientManager
}

export function resetSharedWorkerClientManagerForTests() {
  if (sharedWorkerClientManager) {
    sharedWorkerClientManager.destroy()
  }

  sharedWorkerClientManager = null
}

export { SharedWorkerClientManager }
