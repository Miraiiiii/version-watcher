export const RUNTIME_MODES = {
  SHARED_WORKER: 'shared-worker',
  WORKER: 'worker',
  FALLBACK: 'fallback',
}

export const MESSAGE_TYPES = {
  REGISTER: 'register',
  UNREGISTER: 'unregister',
  VISIBILITY_CHANGE: 'visibility-change',
  CHECK_NOW: 'check-now',
  SYNC_VERSION: 'sync-version',
  VERSION_CHANGED: 'version-changed',
  STATUS: 'status',
  ERROR: 'error',
}

export function createRuntimeMessage(type, payload = {}) {
  return {
    type,
    ...payload,
  }
}
