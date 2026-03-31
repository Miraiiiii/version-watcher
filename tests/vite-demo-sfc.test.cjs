const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function run() {
  const main = fs.readFileSync(path.resolve('examples/vite-demo/src/main.js'), 'utf8');

  assert.ok(main.includes("import App from './App.vue'"), 'demo main.js should import App.vue');
  assert.ok(!main.includes('template: `'), 'demo main.js should not embed a runtime-only template');

  const app = fs.readFileSync(path.resolve('examples/vite-demo/src/App.vue'), 'utf8');
  assert.ok(app.includes('<script setup>'), 'demo App.vue should use <script setup>');
  assert.ok(app.includes('<template>'), 'demo App.vue should define a template');
}

module.exports = run;
