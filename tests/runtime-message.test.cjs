const assert = require('assert');
const { loadModule } = require('./helpers/load-module.cjs');

async function run() {
  const protocol = loadModule('src/core/runtime-protocol.js');

  assert.strictEqual(typeof protocol.normalizeRuntimeMessage, 'function');

  const sharedWorkerMessage = {
    type: 'version-changed',
    clientId: 'client-1',
    data: {
      newVersion: '2.0.0',
      currentVersion: '1.0.0',
      isTip: true,
    },
  };

  assert.deepStrictEqual(
    protocol.normalizeRuntimeMessage(sharedWorkerMessage),
    sharedWorkerMessage
  );

  const workerEvent = {
    data: sharedWorkerMessage,
  };

  assert.deepStrictEqual(
    protocol.normalizeRuntimeMessage(workerEvent),
    sharedWorkerMessage
  );
}

module.exports = run;
