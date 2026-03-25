import VersionWatcherPlugin from '../service/index'
import sourceWorkerPrefixPluginModule from './source-worker-prefix-plugin'

const { createSourceWorkerPrefixPlugin } = sourceWorkerPrefixPluginModule

export default function createVersionWatcherVitePlugin(options = {}) {
  return [
    createSourceWorkerPrefixPlugin(),
    new VersionWatcherPlugin(options).vite(),
  ]
}
