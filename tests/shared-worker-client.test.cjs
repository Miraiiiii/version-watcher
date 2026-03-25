const assert = require('assert');
const { loadModule } = require('./helpers/load-module.cjs');

async function run() {
  let constructedWorkers = 0;
  const postedMessages = [];
  const ports = [];

  global.SharedWorker = class MockSharedWorker {
    constructor() {
      constructedWorkers += 1;
      this.port = {
        onmessage: null,
        start() {},
        close() {},
        postMessage(message) {
          postedMessages.push(message);
        },
      };
      ports.push(this.port);
    }
  };

  const workerClientModule = loadModule('src/core/shared-worker-client.js');
  const {
    getSharedWorkerClientManager,
    resetSharedWorkerClientManagerForTests,
  } = workerClientModule;

  const managerA = getSharedWorkerClientManager();
  const managerB = getSharedWorkerClientManager();

  assert.strictEqual(managerA, managerB);
  assert.strictEqual(constructedWorkers, 1);

  const events = [];
  managerA.register('client-a', { endpoint: '/a.json' }, (message) => events.push(message));
  managerB.register('client-b', { endpoint: '/b.json' }, (message) => events.push(message));

  assert.deepStrictEqual(
    postedMessages.map((message) => message.type),
    ['register', 'register']
  );

  ports[0].onmessage({
    data: {
      type: 'version-changed',
      clientId: 'client-b',
      data: { newVersion: '2.0.0' },
    },
  });

  assert.deepStrictEqual(events, [
    {
      type: 'version-changed',
      clientId: 'client-b',
      data: { newVersion: '2.0.0' },
    },
  ]);

  managerA.unregister('client-a');
  managerB.unregister('client-b');
  resetSharedWorkerClientManagerForTests();

  delete global.SharedWorker;
}

module.exports = run;
