# 开发文档

## 仓库结构

核心目录如下：

- `src/index.js`：对外入口，导出 `VersionWatcher` 和 `VersionWatcherInstance`
- `src/core/`：运行时实现，包括 SharedWorker、Worker、fallback、消息协议和 endpoint context
- `src/ui/`：更新提示和确认弹窗 UI
- `src/utils/`：广播、页签管理、事件封装、计时器等通用工具
- `src/service/index.js`：webpack / Vue CLI / Vite 构建插件实现
- `src/plugin/`：源码联调相关插件，例如 Vite 下的 worker import 改写
- `src/theme-chalk/`：弹窗和遮罩样式
- `examples/vite-demo`：本地联调示例
- `examples/smoke-vite`、`examples/smoke-webpack`、`examples/smoke-vue-cli`：发包后兼容性 smoke fixture
- `tests/`：仓库回归测试
- `scripts/verify-node-compat.cjs`：Node 入口加载验证脚本
- `scripts/pack-and-smoke.cjs`：`npm pack` 后的真实消费验证脚本

## 核心模块职责

### 运行时层

- `src/core/version-watcher-wrapper.js`
  - 运行时编排层
  - 负责选择 `SharedWorker`、`Worker`、`fallback`
  - 负责页面可见性、错误触发、版本同步、页签统计等外层行为

- `src/core/version-watcher.shared-worker.js`
  - SharedWorker 入口
  - 同一 origin 下复用一个物理 worker 实例
  - 内部通过 `Map<endpoint, EndpointContext>` 管理逻辑上下文

- `src/core/version-watcher.worker.js`
  - 普通 Worker 入口
  - 用于 SharedWorker 不可用时的降级路径

- `src/core/version-watcher.js`
  - 主线程 fallback 实现

- `src/core/endpoint-context.js`
  - 管理单个 `endpoint` 的订阅者、当前版本、有效轮询间隔和暂停状态

- `src/core/runtime-protocol.js`
  - 统一消息类型和运行时消息归一化逻辑

### 同源共享与广播层

- `src/core/shared-worker-client.js`
  - 页面内的 SharedWorker 单例 client manager

- `src/utils/tab-manager.js`
  - 管理同源标签页心跳和数量统计

- `src/utils/version-broadcast.js`
  - 在不同标签页之间同步已确认版本

- `src/utils/refresh-broadcast.js`
  - 在不同标签页之间广播刷新动作

### UI 层

- `src/ui/version-notifier.js`
  - 负责渲染更新提示

- `src/ui/confirm-dialog.js`
  - 在多个同源页签打开时提供刷新方式选择

## 本地开发

### 安装依赖

```bash
npm install
```

### 常用命令

```bash
npm test
npm run build
npm run verify:node
npm run smoke:pack
npm run example:dev
```

### 命令说明

- `npm test`
  - 运行仓库内回归测试
  - 当前测试覆盖 SharedWorker client 单例、endpoint context、Vite 源码 worker import 改写、样式回归、运行时消息归一化等逻辑

- `npm run build`
  - 构建发布产物
  - 输出浏览器主包、插件入口和样式文件

- `npm run verify:node`
  - 校验 `dist/plugin/index.cjs` 能被 `require`
  - 校验 `dist/plugin/vite.mjs` 能被动态 `import`

- `npm run smoke:pack`
  - 先执行 `npm run build`
  - 再执行 `npm pack`
  - 将 tarball 注入三个 smoke fixture
  - 最后分别执行 fixture 的 `npm run build`

- `npm run example:dev`
  - 启动 `examples/vite-demo`
  - 用于本地联调版本监听、SharedWorker、多标签页和弹窗行为

## Example 联调

`examples/vite-demo` 的定位是“源码联调”，不是“发包消费验证”。

关键点：

- 通过 alias 直接引用仓库 `src/index.js`
- 通过 `src/plugin/source-worker-prefix-plugin.js` 处理源码中的 `shared-worker:` 和 `web-worker:` import 前缀
- 开发环境直接读取 `examples/vite-demo/public/dist/version.json`
- 使用 `npm run bump --prefix examples/vite-demo` 模拟新版本发布

推荐验证流程：

1. `npm run example:dev`
2. 打开一个或多个同源标签页
3. 确认页面显示的 `Runtime mode`
4. 执行 `npm run bump --prefix examples/vite-demo`
5. 点击 `Check now` 或切走再切回页面
6. 验证弹窗、同源同步和轮询暂停行为

## 发包与兼容性验证

### Node 入口验证

`scripts/verify-node-compat.cjs` 会验证：

- `version-watcher/plugin` 在 Node 下是可 `require` 的构造函数
- `version-watcher/plugin/vite` 在 Node 下是可 `import` 的函数

### Smoke 验证

`scripts/pack-and-smoke.cjs` 会验证三条真实消费链路：

- `examples/smoke-vite`
- `examples/smoke-webpack`
- `examples/smoke-vue-cli`

脚本会在临时目录中执行安装和构建，避免复用 fixture 本地 `node_modules` 干扰结果。

## 开发注意事项

- 调试 SharedWorker 行为时，修改 worker 逻辑后应关闭所有同源标签页并重启 dev server
- 如果你在 example 中只看到旧行为，优先排查是否仍有旧 SharedWorker 实例存活
- 新增或修复运行时逻辑时，应优先为消息协议、timer 行为、样式回归补最小测试
- `examples/vite-demo/dist` 如果出现嵌套目录导致构建异常，先清理输出目录后再重试
