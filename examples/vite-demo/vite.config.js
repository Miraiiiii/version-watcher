import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import VersionWatcherPlugin from '../../src/plugin/vite-entry'

export default defineConfig({
  plugins: [
    vue(),
    VersionWatcherPlugin(),
  ],
  resolve: {
    alias: {
      'version-watcher': path.resolve(__dirname, '../../src/index.js'),
    },
  },
})
