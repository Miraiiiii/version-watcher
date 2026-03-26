/* eslint-disable no-restricted-globals */
import { NetworkService } from './network-monitor'
import EndpointContext from './endpoint-context'
import { MESSAGE_TYPES, createRuntimeMessage } from './runtime-protocol'

const scope = typeof self !== 'undefined' ? self : typeof global !== 'undefined' ? global : {}
const contexts = new Map()
const clients = new Map()

function normalizeEndpoint(endpoint) {
  return new URL(endpoint, scope.location.href).toString()
}

function postToClient(clientId, message) {
  const client = clients.get(clientId)
  if (!client) return

  client.port.postMessage({
    clientId,
    ...message,
  })
}

function ensureContext(endpoint) {
  if (!contexts.has(endpoint)) {
    contexts.set(endpoint, new EndpointContext(endpoint))
  }

  return contexts.get(endpoint)
}

function cleanupContext(endpoint) {
  const context = contexts.get(endpoint)
  if (!context || context.hasSubscribers()) return

  context.destroy()
  contexts.delete(endpoint)
}

async function checkContext(endpoint) {
  const context = contexts.get(endpoint)
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

      for (const [clientId, client] of clients.entries()) {
        if (client.endpoint !== endpoint) continue

        postToClient(clientId, createRuntimeMessage(MESSAGE_TYPES.VERSION_CHANGED, {
          data: {
            newVersion: version,
            currentVersion: previousVersion,
            isTip,
          },
        }))
      }

      if (isTip) {
        context.pausePolling()
      }
    }
  } catch (error) {
    for (const [clientId, client] of clients.entries()) {
      if (client.endpoint !== endpoint) continue

      postToClient(clientId, createRuntimeMessage(MESSAGE_TYPES.ERROR, {
        error: {
          message: error.message,
          stack: error.stack || '',
        },
      }))
    }
  }
}

function reconcileContext(endpoint, shouldCheckImmediately = false) {
  const context = contexts.get(endpoint)
  if (!context) return

  if (shouldCheckImmediately && !context.getCurrentVersion()) {
    checkContext(endpoint)
  }

  context.reconcileTimer(() => checkContext(endpoint))
}

function unregisterClient(clientId) {
  const client = clients.get(clientId)
  if (!client) return

  const context = contexts.get(client.endpoint)
  if (context) {
    context.removeSubscriber(clientId)
    context.reconcileTimer(() => checkContext(client.endpoint))
    cleanupContext(client.endpoint)
  }

  clients.delete(clientId)
}

function handleMessage(port, message = {}) {
  const { clientId, type, data = {} } = message

  switch (type) {
    case MESSAGE_TYPES.REGISTER: {
      const endpoint = normalizeEndpoint(data.endpoint)
      const previousClient = clients.get(clientId)

      if (previousClient && previousClient.endpoint !== endpoint) {
        unregisterClient(clientId)
      }

      const context = ensureContext(endpoint)
      clients.set(clientId, {
        port,
        endpoint,
      })
      context.upsertSubscriber(clientId, data)
      reconcileContext(endpoint, true)

      postToClient(clientId, createRuntimeMessage(MESSAGE_TYPES.STATUS, {
        data: {
          status: 'registered',
          mode: 'shared-worker',
        },
      }))
      break
    }
    case MESSAGE_TYPES.UNREGISTER:
      unregisterClient(clientId)
      break
    case MESSAGE_TYPES.VISIBILITY_CHANGE: {
      const client = clients.get(clientId)
      if (!client) return

      const context = contexts.get(client.endpoint)
      if (!context) return

      context.setSubscriberVisibility(clientId, data.visible)
      context.reconcileTimer(() => checkContext(client.endpoint))
      break
    }
    case MESSAGE_TYPES.CHECK_NOW: {
      const client = clients.get(clientId)
      if (!client) return

      checkContext(client.endpoint)
      break
    }
    case MESSAGE_TYPES.SYNC_VERSION: {
      const client = clients.get(clientId)
      if (!client) return

      const context = contexts.get(client.endpoint)
      if (!context) return

      context.syncVersion(data.version)
      context.reconcileTimer(() => checkContext(client.endpoint))
      break
    }
    default:
      break
  }
}

scope.onconnect = function onconnect(event) {
  const port = event.ports[0]
  port.start && port.start()
  port.onmessage = (messageEvent) => handleMessage(port, messageEvent.data)
}
