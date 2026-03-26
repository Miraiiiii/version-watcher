import { createInterval } from '../utils/common'

function normalizeSubscriberConfig(config = {}) {
  return {
    interval: config.interval,
    polling: config.polling !== false,
    visible: config.visible !== false,
  }
}

export default class EndpointContext {
  constructor(endpoint, options = {}) {
    this.endpoint = endpoint
    this.currentVersion = null
    this.subscribers = new Map()
    this.timer = null
    this.timerInterval = null
    this.isPaused = false
    this.createInterval = options.createInterval || createInterval
  }

  upsertSubscriber(clientId, config = {}) {
    this.subscribers.set(clientId, normalizeSubscriberConfig(config))
  }

  removeSubscriber(clientId) {
    this.subscribers.delete(clientId)
  }

  setSubscriberVisibility(clientId, visible) {
    const current = this.subscribers.get(clientId)
    if (!current) return

    this.subscribers.set(clientId, {
      ...current,
      visible,
    })
  }

  hasSubscribers() {
    return this.subscribers.size > 0
  }

  hasActivePollingSubscribers() {
    return this.getEffectiveInterval() !== null
  }

  getEffectiveInterval() {
    if (this.isPaused) {
      return null
    }

    const intervals = []

    for (const subscriber of this.subscribers.values()) {
      if (!subscriber.polling || !subscriber.visible) continue
      intervals.push(subscriber.interval)
    }

    if (intervals.length === 0) {
      return null
    }

    return Math.min(...intervals)
  }

  getCurrentVersion() {
    return this.currentVersion
  }

  syncVersion(version) {
    this.currentVersion = version
    this.isPaused = false
  }

  pausePolling() {
    this.isPaused = true
    this.stopTimer()
  }

  reconcileTimer(runCheck) {
    const nextInterval = this.getEffectiveInterval()

    if (nextInterval === null) {
      this.stopTimer()
      return
    }

    if (this.timer && this.timerInterval === nextInterval) {
      return
    }

    this.stopTimer()
    this.timerInterval = nextInterval
    this.timer = this.createInterval(() => runCheck(), nextInterval)
    if (this.timer && typeof this.timer.start === 'function') {
      this.timer.start()
    }
  }

  stopTimer() {
    if (this.timer && typeof this.timer.stop === 'function') {
      this.timer.stop()
    }

    this.timer = null
    this.timerInterval = null
  }

  destroy() {
    this.stopTimer()
    this.subscribers.clear()
  }
}
