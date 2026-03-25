const VersionWatcherPlugin = require('version-watcher/plugin')

module.exports = {
  configureWebpack: {
    plugins: [new VersionWatcherPlugin()],
  },
}
