import { createApp, ref } from "vue";
import { VersionWatcherInstance } from "version-watcher";

const mode = ref("initializing");
const tabCount = ref(1);
const endpoint = "/dist/version.json";

const watcher = new VersionWatcherInstance({
  endpoint,
  interval: 5000,
  polling: true,
  content: "发现新版本，请刷新当前页面。",
});

mode.value = watcher.getMode();
tabCount.value = watcher.getTabCount();

const App = {
  setup() {
    return {
      endpoint,
      mode,
      tabCount,
      checkNow: () => watcher.checkNow(),
      refreshStats: () => {
        mode.value = watcher.getMode();
        tabCount.value = watcher.getTabCount();
      },
    };
  },
  template: `
    <main style="font-family: sans-serif; max-width: 720px; margin: 40px auto; line-height: 1.6;">
      <h1>Version Watcher Demo</h1>
      <p>Endpoint: <code>{{ endpoint }}</code></p>
      <p>Runtime mode: <strong>{{ mode }}</strong></p>
      <p>Same-origin tab count: <strong>{{ tabCount }}</strong></p>
      <div style="display: flex; gap: 12px;">
        <button @click="checkNow">Check now</button>
        <button @click="refreshStats">Refresh stats</button>
      </div>
      <p style="margin-top: 16px;">Use <code>npm run bump --prefix examples/vite-demo</code> to change the demo version file.</p>
    </main>
  `,
};

createApp(App).mount("#app");
