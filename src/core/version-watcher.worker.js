/* eslint-disable no-restricted-globals */
import { NetworkService } from './network-monitor'
import EndpointContext from './endpoint-context'
import { MESSAGE_TYPES, createRuntimeMessage } from './runtime-protocol'

const scope = typeof self !== 'undefined' ? self : typeof global !== 'undefined' ? global : {}
let clientId = null
let endpoint = null
let context = null

function normalizeEndpoint(rawEndpoint) {
  return new URL(rawEndpoint, scope.location.href).toString()
}

function postMessage(message) {
  scope.postMessage({
    clientId,
    ...message,
  })
}

async function checkVersion() {
  if (!context) return

  try {
    const response = await NetworkService.fetchVersion(endpoint)
    const { version, isTip } = response
    const previousVersion = context.getCurrentVersion()

    if (!previousVersion) {
      context.syncVersion(version)
      return
    }

    if (version !== previousVersion) {
      context.syncVersion(version)
      postMessage(createRuntimeMessage(MESSAGE_TYPES.VERSION_CHANGED, {
        data: {
          newVersion: version,
          currentVersion: previousVersion,
          isTip,
        },
      }))

      if (isTip) {
        context.stopTimer()
      }
    }
  } catch (error) {
    postMessage(createRuntimeMessage(MESSAGE_TYPES.ERROR, {
      error: {
        message: error.message,
        stack: error.stack || '',
      },
    }))
  }
}

scope.onmessage = function onmessage(event) {
  const message = event.data || {}
  const { type, data = {} } = message

  switch (type) {
    case MESSAGE_TYPES.REGISTER:
      clientId = message.clientId
      endpoint = normalizeEndpoint(data.endpoint)
      context = new EndpointContext(endpoint)
      context.upsertSubscriber(clientId, data)
      checkVersion()
      context.reconcileTimer(checkVersion)
      postMessage(createRuntimeMessage(MESSAGE_TYPES.STATUS, {
        data: {
          status: 'registered',
          mode: 'worker',
        },
      }))
      break
    case MESSAGE_TYPES.UNREGISTER:
      if (context) {
        context.destroy()
      }
      context = null
      endpoint = null
      clientId = null
      break
    case MESSAGE_TYPES.VISIBILITY_CHANGE:
      if (!context || !clientId) return
      context.setSubscriberVisibility(clientId, data.visible)
      context.reconcileTimer(checkVersion)
      break
    case MESSAGE_TYPES.CHECK_NOW:
      checkVersion()
      break
    case MESSAGE_TYPES.SYNC_VERSION:
      if (!context) return
      context.syncVersion(data.version)
      context.reconcileTimer(checkVersion)
      break
    default:
      break
  }
}

scope.onerror = function onerror(errorEvent) {
  postMessage(createRuntimeMessage(MESSAGE_TYPES.ERROR, {
    error: {
      message: errorEvent.message || 'Unknown worker error',
      stack: errorEvent.error && errorEvent.error.stack ? errorEvent.error.stack : '',
    },
  }))

  errorEvent.preventDefault()
}
