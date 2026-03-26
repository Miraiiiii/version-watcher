import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import sourceWorkerPrefixPluginModule from '../../src/plugin/source-worker-prefix-plugin'

const { createSourceWorkerPrefixPlugin } = sourceWorkerPrefixPluginModule

export default defineConfig({
  plugins: [
    createSourceWorkerPrefixPlugin(),
    vue(),
  ],
  resolve: {
    alias: {
      'version-watcher': path.resolve(__dirname, '../../src/index.js'),
    },
  },
})
