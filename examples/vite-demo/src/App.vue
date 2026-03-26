<script setup>
import { ref } from 'vue'
import { VersionWatcherInstance } from 'version-watcher'

const mode = ref('initializing')
const tabCount = ref(1)
const endpoint = '/dist/version.json'

const watcher = new VersionWatcherInstance({
  endpoint,
  interval: 5000,
  polling: true,
  content: '发现新版本，请刷新当前页面。',
})

mode.value = watcher.getMode()
tabCount.value = watcher.getTabCount()

function checkNow() {
  watcher.checkNow()
}

function refreshStats() {
  mode.value = watcher.getMode()
  tabCount.value = watcher.getTabCount()
}
</script>

<template>
  <main class="demo">
    <h1>Version Watcher Demo</h1>
    <p>Endpoint: <code>{{ endpoint }}</code></p>
    <p>Runtime mode: <strong>{{ mode }}</strong></p>
    <p>Same-origin tab count: <strong>{{ tabCount }}</strong></p>
    <div class="actions">
      <button @click="checkNow">Check now</button>
      <button @click="refreshStats">Refresh stats</button>
    </div>
    <p class="hint">Use <code>npm run bump --prefix examples/vite-demo</code> to change the demo version file.</p>
  </main>
</template>

<style scoped>
.demo {
  max-width: 720px;
  margin: 40px auto;
  line-height: 1.6;
  font-family: sans-serif;
}

.actions {
  display: flex;
  gap: 12px;
}

.hint {
  margin-top: 16px;
}
</style>
