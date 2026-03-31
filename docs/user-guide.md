# 使用文档

## 项目解决什么问题

`version-watcher` 用于在浏览器端监听版本文件的变化，并在发现新版本时提醒用户刷新页面。它的目标不是做资源热更新，而是解决“站点已部署新版本，但用户页面仍停留在旧版本”的问题。

在支持 `SharedWorker` 的浏览器里，同一 origin 下的多个标签页会共享同一个 worker 实例和版本状态；不支持时会自动降级为 `Worker` 或主线程 fallback。

## 接入方式

### 方式一：作为 Vue 插件安装

适合只需要开箱即用提示，不需要手动控制实例生命周期的场景。

```js
import { createApp } from 'vue'
import VersionWatcher from 'version-watcher'
import App from './App.vue'

const app = createApp(App)

app.use(VersionWatcher, {
  endpoint: '/dist/version.json',
  interval: 5 * 60 * 1000,
  content: '发现新版本，请刷新当前页面。',
})

app.mount('#app')
```

### 方式二：显式创建 `VersionWatcherInstance`

适合需要手动调用 `checkNow()`、查看运行模式或在特定生命周期中销毁实例的场景。

```js
import { VersionWatcherInstance } from 'version-watcher'

const watcher = new VersionWatcherInstance({
  endpoint: '/dist/version.json',
  polling: true,
})

watcher.checkNow()
console.log(watcher.getMode())
console.log(watcher.getTabIds())
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

插件会生成一个结构如下的版本文件：

```json
{
  "version": "a1b2c3d4...",
  "isTip": true
}
```

- `version` 默认取当前 Git 最新 commit hash
- `isTip` 用于决定是否弹出提示，并在提示出现后暂停轮询

## 版本文件

默认版本文件路径是 `/dist/version.json`。如果你不使用构建插件，也可以手动维护这个文件，只要保持以下格式即可：

```json
{
  "version": "1.0.0",
  "isTip": true
}
```

只要返回的 `version` 与当前已记录版本不同，就会触发版本变化逻辑。

## 配置项

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `endpoint` | `string` | `'/dist/version.json'` | 版本信息地址 |
| `interval` | `number` | `300000` | 轮询间隔，单位毫秒 |
| `disabled` | `boolean` | `false` | 是否禁用版本监听 |
| `isListenJSError` | `boolean` | `false` | 是否在同源脚本报错后主动检查版本 |
| `content` | `string` | 内置提示文案 | 更新提示内容 |
| `dangerouslyUseHTMLString` | `boolean` | `false` | 是否允许直接使用 HTML 作为提示内容 |
| `refreshSameOrigin` | `boolean` | `true` | 是否支持同源页签联动刷新 |
| `polling` | `boolean` | `true` | 是否启用定时轮询 |
| `checkNowThrottleTime` | `number` | `10000` | `checkNow()` 的节流时间 |
| `tabHeartbeatInterval` | `number` | `5000` | 同源页签心跳间隔 |
| `tabInactiveTTL` | `number` | 自动推导 | 页签失活判定时间 |
| `customStyle` | `Record<string, string | number>` | - | 自定义提示容器样式 |

## 实例方法

| 方法 | 说明 |
| --- | --- |
| `getMode()` | 获取当前运行模式：`shared-worker`、`worker`、`fallback` |
| `getTabCount()` | 获取当前同源标签页数量 |
| `getTabIds()` | 获取当前同源标签页 ID 列表 |
| `checkNow()` | 立即执行一次版本检查 |
| `destroy()` | 销毁实例并清理监听和广播资源 |

## 运行模式与降级链路

浏览器端会按以下顺序自动选择运行模式：

1. `shared-worker`
2. `worker`
3. `fallback`

SharedWorker 模式下：

- 同一 origin 只创建一个 SharedWorker 脚本实例
- 同一 `endpoint` 在 worker 内共享一个逻辑上下文
- 不同 `endpoint` 在同一个 SharedWorker 内相互隔离

## 同源页签行为

当多个同源标签页同时打开时：

- 版本状态通过 `BroadcastChannel` 或 `localStorage` 同步
- 刷新动作可以广播给其它同源页签
- 提示框在显示后会暂停当前 `endpoint` 的轮询，直到用户完成版本同步或刷新

## 自定义提示内容

当 `dangerouslyUseHTMLString` 为 `true` 时，可以直接传入 HTML 字符串作为提示内容：

```js
new VersionWatcherInstance({
  dangerouslyUseHTMLString: true,
  content: `
    <div class="update-notification">
      <h3>发现新版本</h3>
      <p>系统已更新，请刷新后继续使用。</p>
      <button id="VersionNotifierConfirm">立即更新</button>
      <button id="VersionNotifierCancel">暂不更新</button>
    </div>
  `,
})
```

自定义 HTML 时，请保留以下按钮 ID：

- `VersionNotifierConfirm`
- `VersionNotifierCancel`

## 建议

- 业务接入时优先显式设置 `endpoint`，避免和现有静态资源目录约定冲突
- 如果业务方只想在手动触发时检查版本，可设置 `polling: false`
- 如果你需要验证多标签页共享行为，优先使用仓库里的 `examples/vite-demo` 进行联调
