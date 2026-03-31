import { createApp } from 'vue'
import App from './App.vue'
import VersionWatcher from 'version-watcher'

const app = createApp(App)
app.use(VersionWatcher, { polling: false })
app.mount('#app')
