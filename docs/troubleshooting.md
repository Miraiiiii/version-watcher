# 排障文档

## 本地 demo 请求到的 `version.json` 与文件内容不一致

### 现象

你修改了 `examples/vite-demo/public/dist/version.json`，但浏览器 network 返回的内容并不一致。

### 原因

如果本地 dev server 通过构建插件拦截了 `/dist/version.json`，它可能返回动态生成的 git 信息，而不是静态文件内容。

### 当前处理方式

`examples/vite-demo` 已经切换为直接读取静态版本文件，只保留源码联调必须的 worker import 改写逻辑。

### 建议

- 如果你怀疑版本源不对，先直接在浏览器里打开 `/dist/version.json`
- 再对比 `examples/vite-demo/public/dist/version.json` 的实际内容

## 修改 SharedWorker 逻辑后，本地行为还是旧的

### 原因

SharedWorker 可能被现有同源标签页继续持有，页面脚本更新了，但旧 worker 还没被销毁。

### 处理方式

1. 关闭所有同源 demo 标签页
2. 停掉 dev server
3. 重新启动 `npm run example:dev`
4. 再打开页面验证

## `Same-origin tab count` 不自动变化

当前 demo 页面里的 `tabCount` 展示不是自动订阅式刷新，而是通过显式调用 `watcher.getTabCount()` 读取。

因此：

- 同源页签统计逻辑本身是有效的
- 但 demo 页面上的数字不会自己更新
- 点击 `Refresh stats` 后会重新读取最新值

这不会影响 SharedWorker、本地版本检测或同源刷新广播。

## 弹窗出现后仍持续请求 `version.json`

### 旧问题根因

过去只调用了 `stopTimer()`，但没有持久化暂停状态，所以后续可能因为可见性变化或上下文重算重新拉起轮询。

### 当前行为

出现更新提示后，`EndpointContext` 会进入暂停状态，直到用户同步版本或刷新页面。

如果你仍然看到持续请求：

- 确认是否还有旧的 SharedWorker 实例存活
- 关闭同源标签页并重启 dev server 后再测一次

## 为什么已经检测到版本变化，却没有弹窗也没有日志

### 旧问题根因

SharedWorker 消息回调和 Worker 的 `MessageEvent` 形态不同，wrapper 如果按旧逻辑解析，会把 `version-changed` 消息吞掉。

### 当前修复

运行时统一通过 `normalizeRuntimeMessage` 归一化消息。

如果你再次遇到这个问题：

- 先看页面显示的 `Runtime mode`
- 再确认控制台是否输出 `[VersionWatcher] New version available`
- 没有日志时，优先检查 worker 是否仍是旧实例

## `verify:node` 和 `smoke:pack` 有什么区别

### `npm run verify:node`

作用：验证插件入口在 Node 环境下能否正确加载。

它检查：

- `version-watcher/plugin` 可被 `require`
- `version-watcher/plugin/vite` 可被 `import`

### `npm run smoke:pack`

作用：验证真实发包产物能否被目标工程消费。

它会：

1. 执行 `npm run build`
2. 执行 `npm pack`
3. 将 tarball 安装到 Vite、webpack、Vue CLI 三个 fixture
4. 执行各自的 `npm run build`

### 建议使用方式

- 改导出、插件入口或打包配置时，先跑 `verify:node`
- 发版前或做兼容性改动后，再跑 `smoke:pack`

## `examples/vite-demo` 构建时报 `dist/dist` 相关错误

在某些情况下，example 输出目录中残留嵌套结构，可能导致 Vite build 准备输出目录时报错。

建议处理方式：

```bash
Remove-Item -Recurse -Force examples/vite-demo/dist
npm run example:build
```

如果只是本地联调，不需要依赖 `example:build`，优先使用 `npm run example:dev`。
