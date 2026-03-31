const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function run() {
  const source = fs.readFileSync(path.resolve('examples/vite-demo/vite.config.js'), 'utf8');

  assert.ok(source.includes("../../src/plugin/source-worker-prefix-plugin"));
  assert.ok(!source.includes("../../src/plugin/vite-entry"));
  assert.ok(source.includes('createSourceWorkerPrefixPlugin()'));
}

module.exports = run;
