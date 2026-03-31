# Version Watcher

轻量级前端版本监听工具，用于检测站点版本变化，并在同源标签页之间共享版本状态与刷新动作。

## 核心能力

- 浏览器端自动轮询版本文件，并在检测到新版本时弹出更新提示
- 同一 origin 下优先复用单个 SharedWorker，不为每个标签页重复创建独立轮询 worker
- 自动降级到 Worker，再降级到主线程 fallback，保证不支持 SharedWorker 的环境也能工作
- 支持同源标签页之间的版本同步与刷新广播
- 支持 webpack、Vite、Vue CLI 的构建插件，自动生成 `version.json`
- 提供本地联调 example 与发布后 smoke 验证工程

## 安装

```bash
npm install version-watcher
```

## 快速开始

### Vue 插件方式

```js
import { createApp } from 'vue'
import VersionWatcher from 'version-watcher'
import App from './App.vue'

const app = createApp(App)

app.use(VersionWatcher, {
  endpoint: '/dist/version.json',
  interval: 5 * 60 * 1000,
  content: '发现新版本，请刷新当前页面。',
  refreshSameOrigin: true,
})

app.mount('#app')
```

说明：`app.use(VersionWatcher, options)` 会安装插件，但不会把实例暴露给外层。如果你需要手动调用 `checkNow()`、读取运行模式或在页面销毁时主动清理资源，请显式创建 `VersionWatcherInstance`。

### 手动实例方式

```js
import { VersionWatcherInstance } from 'version-watcher'

const watcher = new VersionWatcherInstance({
  endpoint: '/dist/version.json',
  polling: false,
  checkNowThrottleTime: 5000,
})

watcher.checkNow()
console.log(watcher.getMode())
console.log(watcher.getTabCount())

window.addEventListener('beforeunload', () => {
  watcher.destroy()
})
```

## 构建插件

### webpack / Vue CLI

```js
const VersionWatcherPlugin = require('version-watcher/plugin')

module.exports = {
  configureWebpack: {
    plugins: [new VersionWatcherPlugin()],
  },
}
```

### Vite

```js
import { defineConfig } from 'vite'
import VersionWatcherPlugin from 'version-watcher/plugin/vite'

export default defineConfig({
  plugins: [VersionWatcherPlugin()],
})
```

## 常用验证命令

```bash
npm test
npm run build
npm run verify:node
npm run smoke:pack
```

- `npm test`：运行仓库内的回归测试
- `npm run build`：构建发布产物
- `npm run verify:node`：校验插件入口在 Node 环境下可正确加载
- `npm run smoke:pack`：使用 `npm pack` 产物验证 Vite、webpack 5、Vue CLI 5 三条真实消费链路

## 文档导航

- [文档索引](./docs/README.md)
- [使用文档](./docs/user-guide.md)
- [开发文档](./docs/development.md)
- [本次优化实现说明](./docs/implementation/sharedworker-compat.md)
- [排障文档](./docs/troubleshooting.md)

## License

[MIT](./LICENSE)
