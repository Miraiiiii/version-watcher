const assert = require('assert');
const packageJson = require('../package.json');

async function run() {
  assert.deepStrictEqual(Object.keys(packageJson.exports).sort(), [
    '.',
    './assets/*',
    './plugin',
    './plugin/vite',
    './theme-chalk',
  ]);

  assert.strictEqual(packageJson.main, 'dist/index.cjs.js');
  assert.strictEqual(packageJson.module, 'dist/index.esm.js');
  assert.strictEqual(packageJson.types, 'index.d.ts');
  assert.strictEqual(packageJson.exports['.'].import, './dist/index.esm.js');
  assert.strictEqual(packageJson.exports['.'].require, './dist/index.cjs.js');
  assert.strictEqual(packageJson.exports['.'].types, './index.d.ts');
  assert.strictEqual(packageJson.exports['./plugin'], './dist/plugin/index.cjs');
  assert.strictEqual(packageJson.exports['./plugin/vite'], './dist/plugin/vite.mjs');
  assert.strictEqual(packageJson.exports['./theme-chalk'], './dist/theme-chalk.css');
  assert.ok(packageJson.scripts.test);
  assert.ok(packageJson.scripts['smoke:pack']);
}

module.exports = run;
