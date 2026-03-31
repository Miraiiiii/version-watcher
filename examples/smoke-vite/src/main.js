import { VersionWatcherInstance } from 'version-watcher'

const watcher = new VersionWatcherInstance({ polling: false })
watcher.checkNow()
