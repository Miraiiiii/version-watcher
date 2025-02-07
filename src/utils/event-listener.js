/*
 * @Description: 事件监听器
 * @Author: 舌红
 * @Date: 2025-02-07 11:24:10
 * @LastEditors: 舌红
 * @LastEditTime: 2025-02-07 11:26:47
 */

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
