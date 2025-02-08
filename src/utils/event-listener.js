export const EventListener = {
  EVENT_LISTENERS: new Set(),
  addEventListenerWrapper(target, event, handler) {
    target.addEventListener(event, handler)
    this.EVENT_LISTENERS.add({
      target,
      event,
      handler
    })
  },
  removeEventListenerWrapper(target, event, handler) {
    this.EVENT_LISTENERS.forEach(listener => {
      if (listener.target === target && listener.event === event && listener.handler === handler) {
        target.removeEventListener(event, handler)
        this.EVENT_LISTENERS.delete(listener)
      }
    })
  },
  removeAllEventListeners() {
    this.EVENT_LISTENERS.forEach(({ target, event, handler }) => {
      target.removeEventListener(event, handler)
    })
    this.EVENT_LISTENERS.clear()
  }

}
