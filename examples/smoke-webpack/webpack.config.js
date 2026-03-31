const path = require('path')
const VersionWatcherPlugin = require('version-watcher/plugin')

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
  },
  plugins: [new VersionWatcherPlugin()],
}
