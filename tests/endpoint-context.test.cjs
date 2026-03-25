const assert = require('assert');
const { loadModule } = require('./helpers/load-module.cjs');

async function run() {
  const { default: EndpointContext } = loadModule('src/core/endpoint-context.js');

  const context = new EndpointContext('/version.json');

  context.upsertSubscriber('a', {
    interval: 5000,
    polling: true,
    visible: true,
  });
  context.upsertSubscriber('b', {
    interval: 3000,
    polling: true,
    visible: true,
  });
  context.upsertSubscriber('c', {
    interval: 1000,
    polling: false,
    visible: true,
  });

  assert.strictEqual(context.getEffectiveInterval(), 3000);
  assert.strictEqual(context.hasActivePollingSubscribers(), true);

  context.setSubscriberVisibility('a', false);
  context.setSubscriberVisibility('b', false);

  assert.strictEqual(context.hasActivePollingSubscribers(), false);
  assert.strictEqual(context.getEffectiveInterval(), null);

  context.setSubscriberVisibility('b', true);
  assert.strictEqual(context.getEffectiveInterval(), 3000);

  context.removeSubscriber('a');
  context.removeSubscriber('b');
  context.removeSubscriber('c');

  assert.strictEqual(context.hasSubscribers(), false);
}

module.exports = run;
