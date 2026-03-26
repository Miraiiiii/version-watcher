const assert = require('assert');
const { loadModule } = require('./helpers/load-module.cjs');

async function run() {
  const { createInterval } = loadModule('src/utils/common.js');

  let calls = 0;

  await new Promise((resolve, reject) => {
    const timer = createInterval(() => {
      calls += 1;
      timer.stop();
      setTimeout(() => {
        try {
          assert.strictEqual(calls, 1);
          resolve();
        } catch (error) {
          reject(error);
        }
      }, 30);
    }, 5).start();
  });
}

module.exports = run;
