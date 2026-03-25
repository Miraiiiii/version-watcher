const { VersionWatcherInstance } = require('version-watcher')

const watcher = new VersionWatcherInstance({ polling: false })
watcher.checkNow()
console.log('webpack smoke build ready')
