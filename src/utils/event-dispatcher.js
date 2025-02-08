export const EventDispatcher = {
  events: new Map(),
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event).push(callback)
  },
  emit(event, data) {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  },
  off(event, callback) {
    const callbacks = this.events.get(event)
    if (callbacks) {
      this.events.set(event, callbacks.filter(cb => cb !== callback))
    }
  },
  once(event, callback) {
    const onceCallback = (data) => {
      callback(data)
      this.off(event, onceCallback)
    }
    this.on(event, onceCallback)
  },
  clear(event) {
    if (event) {

      this.events.delete(event)
    } else {
      this.events.clear()
    }
  }
}
