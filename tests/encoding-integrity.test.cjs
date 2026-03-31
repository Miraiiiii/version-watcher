const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function run() {
  const demoApp = fs.readFileSync(path.resolve('examples/vite-demo/src/App.vue'), 'utf8');
  assert.ok(demoApp.includes('VersionWatcherInstance'));
  assert.ok(demoApp.includes("const endpoint = '/dist/version.json'"));
  assert.ok(demoApp.includes('content:'));

  const wrapper = fs.readFileSync(path.resolve('src/core/version-watcher-wrapper.js'), 'utf8');
  assert.ok(wrapper.includes('const message = normalizeRuntimeMessage(event)'));

  const protocol = fs.readFileSync(path.resolve('src/core/runtime-protocol.js'), 'utf8');
  assert.ok(protocol.includes('export function normalizeRuntimeMessage'));
}

module.exports = run;
