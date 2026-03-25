const path = require('path');
const createJiti = require('jiti');

const jiti = createJiti(__filename, {
  interopDefault: true,
});

function loadModule(relativePath) {
  return jiti(path.resolve(__dirname, '..', '..', relativePath));
}

module.exports = {
  loadModule,
};
