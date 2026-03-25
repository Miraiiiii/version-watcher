# Version Watcher

一个轻量级的前端版本监控工具，用于实时检测和提示网站版本更新。

## 特性

- 浏览器端自动检测版本更新并提示用户刷新
- 同源页面共享单个 SharedWorker，自动降级到 Worker / 主线程
- 支持轮询、页面重新可见、JS 错误后的主动检查
- 支持同源标签页刷新广播与版本同步
- 支持自定义提示内容和样式
- 提供 webpack、Vite、Vue CLI 构建插件，自动生成版本信息
- 提供本地联调 example 和发包 smoke 验证脚本

## 安装

```bash
npm install version-watcher
```

## 使用方法

### Vue 应用中使用

```javascript
import { createApp } from 'vue'
import VersionWatcher from 'version-watcher'
import App from './App.vue'

const app = createApp(App)

app.use(VersionWatcher, {
  endpoint: '/dist/version.json',
  interval: 5 * 60 * 1000,
  content: '发现新版本，请刷新页面',
  refreshSameOrigin: true,
  polling: true,
})

app.mount('#app')
```

> 说明：`app.use(VersionWatcher, options)` 会安装插件，但不会返回实例。如果你需要手动调用 `checkNow()`、读取运行模式或在销毁时释放资源，请显式创建 `VersionWatcherInstance`。

### 非 Vue 应用中使用

```javascript
import { VersionWatcherInstance } from 'version-watcher'

const versionWatcher = new VersionWatcherInstance({
  endpoint: '/dist/version.json',
  polling: false,
  checkNowThrottleTime: 5000,
})

versionWatcher.checkNow()
console.log(versionWatcher.getMode())
console.log(versionWatcher.getTabCount())

versionWatcher.destroy()
```

### 实例方法

| 方法名 | 说明 | 参数 |
|--------|------|------|
| `getMode` | 获取当前运行模式：`shared-worker`、`worker`、`fallback` | - |
| `getTabCount` | 获取当前同源标签页数量 | - |
| `getTabIds` | 获取当前同源标签页 ID 列表 | - |
| `checkNow` | 立即执行一次版本检查 | - |
| `destroy` | 销毁实例并清理资源 | - |

## 构建工具插件

在构建工具配置文件中使用插件，自动生成和更新版本信息。

### Vue CLI / webpack

```javascript
const VersionWatcherPlugin = require('version-watcher/plugin')

module.exports = {
  configureWebpack: {
    plugins: [new VersionWatcherPlugin()],
  },
}
```

### Vite

```javascript
import { defineConfig } from 'vite'
import VersionWatcherPlugin from 'version-watcher/plugin/vite'

export default defineConfig({
  plugins: [VersionWatcherPlugin()],
})
```

### 插件选项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `outputDir` | `string` | `'dist'` | 版本文件输出目录 |
| `filename` | `string` | `'version.json'` | 版本文件名称 |
| `publicPath` | `string` | `''` | Vite dev server 暴露版本文件时使用的访问路径 |

插件会在每次构建时：
1. 自动读取最新的 Git 提交信息。
2. 生成包含版本信息的 JSON 文件。
3. 确保版本文件位于正确的构建输出目录。

Vite 开发模式下，插件也会直接提供 `/dist/version.json`，不需要再设置 `server.fs.strict = false`。

插件生成的版本信息格式如下：

```json
{
  "version": "a1b2c3d4...",
  "isTip": true
}
```

> 提示：`version` 默认取当前 Git 仓库最新 commit hash；提交代码并重新构建后，会生成新的版本号，从而触发用户端更新提示。

### 手动维护版本信息

如果不使用构建工具插件，你可以手动维护版本信息文件。默认情况下，文件路径为 `/dist/version.json`，格式如下：

```json
{
  "version": "1.0.0",
  "isTip": true
}
```

> 提示：`version` 可以是任意字符串，只要与当前访问页面记录的版本不同，就会触发更新提示。

## 配置选项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `endpoint` | `String` | `'/dist/version.json'` | 版本信息接口地址 |
| `interval` | `Number` | `300000` | 检查更新间隔（毫秒） |
| `disabled` | `Boolean` | `false` | 是否禁用更新提示 |
| `isListenJSError` | `Boolean` | `false` | 是否监听 JS 错误 |
| `content` | `String` | `'为了更好的版本体验请更新到最新版本'` | 提示框内容 |
| `dangerouslyUseHTMLString` | `Boolean` | `false` | 是否允许内容使用 HTML |
| `refreshSameOrigin` | `Boolean` | `true` | 是否自动刷新同源页面 |
| `polling` | `Boolean` | `true` | 是否启用轮询检查 |
| `checkNowThrottleTime` | `Number` | `10000` | 版本立即检查节流时间，默认 10 秒 |
| `tabHeartbeatInterval` | `Number` | `5000` | 同源标签页心跳间隔 |
| `tabInactiveTTL` | `Number` | - | 标签页失活判定时间 |
| `customStyle` | `Object` | - | 自定义提示框样式 |

## 运行模式

浏览器端会按以下顺序自动选择运行模式：

1. `shared-worker`
2. `worker`
3. `fallback`

在支持 `SharedWorker` 的浏览器里，同一 origin 下只会创建一个 SharedWorker 脚本实例，不会为不同标签页重复创建。不同 `endpoint` 会在同一个 SharedWorker 内部按逻辑上下文隔离。

## 高级配置

### 轮询控制

`version-watcher` 提供两种版本检查模式：

1. **轮询模式**（默认）
   - 定期检查版本更新（默认每 5 分钟）
   - 页面从隐藏变为可见时检查
   - JS 错误发生时检查（如果启用了错误监听）

2. **手动模式**
   - 禁用定期轮询检查
   - 仅在以下情况触发检查：
     - 页面从隐藏变为可见时
     - JS 错误发生时（如果启用了错误监听）
     - 手动调用 `checkNow()` 时

通过设置 `polling: false` 可以禁用轮询检查：

```javascript
const watcher = new VersionWatcherInstance({
  polling: false,
  checkNowThrottleTime: 5000,
})
```

## 自定义更新提示

当 `dangerouslyUseHTMLString` 设置为 `true` 时，你可以使用 HTML 字符串来自定义更新提示的内容和按钮：

```html
new VersionWatcherInstance({
  content: `
    <div class="update-notification">
      <h3>发现新版本</h3>
      <p>系统已更新，请刷新使用新版本。</p>
      <div class="buttons">
        <button id="VersionNotifierConfirm">立即更新</button>
        <button id="VersionNotifierCancel">暂不更新</button>
      </div>
    </div>
  `,
  dangerouslyUseHTMLString: true,
})
```

### 按钮 ID 说明

为了使自定义的 HTML 内容能够正确响应用户操作，需要为按钮元素添加特定的 ID：

- `VersionNotifierConfirm`：点击后立即刷新更新
- `VersionNotifierCancel`：点击后关闭提示，暂不更新

> 注意：使用 HTML 字符串时请确保内容的安全性，避免 XSS 风险。

## 本地调试

```bash
npm install
npm run example:dev
```

也可以直接在 example 目录下运行：

```bash
npm install --prefix examples/vite-demo
npm run dev --prefix examples/vite-demo
npm run bump --prefix examples/vite-demo
```

`examples/vite-demo` 会直接联调仓库源码，不依赖发包产物。`npm run bump --prefix examples/vite-demo` 用于模拟新版本发布。

## 验证命令

```bash
npm test
npm run build
npm run verify:node
npm run smoke:pack
```

- `verify:node`：验证发布后的 CommonJS / ESM 插件入口在 Node 环境中可被正确加载。
- `smoke:pack`：使用 `npm pack` 产物分别验证 Vite、webpack 5、Vue CLI 5 三个 fixture 的真实消费链路。

## License

[MIT](LICENSE)
