const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function run() {
  const notifierStyles = fs.readFileSync(path.resolve('src/theme-chalk/notifier.scss'), 'utf8');

  assert.ok(!notifierStyles.includes("updateConfirm.png"));
  assert.ok(notifierStyles.includes('background: linear-gradient'));
}

module.exports = run;
