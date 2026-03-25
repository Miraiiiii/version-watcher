import { defineConfig } from 'vite'
import VersionWatcherPlugin from 'version-watcher/plugin/vite'

export default defineConfig({
  plugins: [VersionWatcherPlugin()],
})
