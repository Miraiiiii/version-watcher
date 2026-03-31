const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');

async function run() {
  const modulePath = pathToFileURL(path.resolve(__dirname, '../src/plugin/source-worker-prefix-plugin.js')).href;
  const mod = await import(modulePath);
  const api = mod.default && mod.default.rewriteSourceWorkerImports ? mod.default : mod;

  assert.strictEqual(typeof api.rewriteSourceWorkerImports, 'function');

  const source = [
    "import SharedVersionWorker from 'shared-worker:./version-watcher.shared-worker.js'",
    "import VersionWorker from 'web-worker:./version-watcher.worker.js'",
    "import VersionWatcher from './version-watcher'",
  ].join('\n');

  const rewritten = api.rewriteSourceWorkerImports(source);

  assert.ok(rewritten.includes("'./version-watcher.shared-worker.js?sharedworker'"));
  assert.ok(rewritten.includes("'./version-watcher.worker.js?worker'"));
  assert.ok(rewritten.includes("import VersionWatcher from './version-watcher'"));
  assert.notStrictEqual(rewritten, source);

  assert.strictEqual(
    api.rewriteSourceWorkerImports("import foo from './plain.js'"),
    "import foo from './plain.js'"
  );
}

module.exports = run;
