# SharedWorker 与跨构建工具兼容改造实现说明

## 背景

本次改造的目标是把项目从“每个标签页各自检测版本”的实现，升级成“同一 origin 下共享一个 SharedWorker”的模型，并同时保证发布后的包能够在 Node 14+ / 16+、webpack 5、Vite、Vue CLI 5 环境中被真实消费。

## 改造前的主要问题

- 没有真正做到同源页签共享一个 SharedWorker
- 运行时逻辑在 SharedWorker、Worker、fallback 之间缺少统一抽象
- 发布兼容性文档和包导出路径不一致
- 本地联调 demo 与发包 smoke 缺少清晰边界
- 构建、验证、联调、排障文档分散在 README 中，且容易失真

## 目标与约束

本次改造明确了以下约束：

- 同一 origin 下只创建一个 SharedWorker 脚本实例
- 不能按 `endpoint` 创建多个 SharedWorker
- 同一个 SharedWorker 内允许维护多个 `endpoint` 逻辑上下文
- 浏览器运行时保持 `SharedWorker -> Worker -> fallback` 降级链路
- 发布后的插件入口要支持 CommonJS 和 ESM 消费路径
- 本地联调和发包 smoke 必须是两条明确区分的验证链路

## 运行时架构

### 单实例 SharedWorker

SharedWorker 方案由以下几部分组成：

- `src/core/shared-worker-client.js`
  - 页面内模块级单例 manager
  - 同一个页面里的多个实例复用同一个 SharedWorker 连接

- `src/core/version-watcher.shared-worker.js`
  - 单个物理 SharedWorker 脚本入口
  - 内部通过 `Map<endpoint, EndpointContext>` 管理逻辑上下文

- `src/core/endpoint-context.js`
  - 管理单个 `endpoint` 的订阅者、当前版本、有效轮询间隔、timer 和暂停状态

### 统一运行时协议

`src/core/runtime-protocol.js` 统一了以下消息类型：

- `register`
- `unregister`
- `visibility-change`
- `check-now`
- `sync-version`
- `version-changed`
- `status`
- `error`

同时增加了 `normalizeRuntimeMessage`，用于统一处理：

- 原生 Worker 的 `MessageEvent`
- SharedWorker client manager 直接回调的 plain object

这次改造过程中，SharedWorker 更新提示不出现的一个关键问题，就是 wrapper 导入了该 helper 但没有真正使用它，导致消息在 wrapper 层被吞掉。该问题后来通过补充运行时消息回归测试修复。

## 轮询控制

### endpoint 级别共享

同一个 `endpoint` 下：

- 多个订阅者共享一个逻辑上下文
- `interval` 取所有可见且启用轮询订阅者中的最小值
- `polling: false` 的订阅者不参与定时间隔计算，但仍可执行 `checkNow`

### 提示出现后的轮询暂停

单纯调用 `stopTimer()` 不足以阻止后续再次启动轮询，因为：

- 页面可见性变化
- 版本同步
- 重新注册或上下文重算

都可能再次调用 `reconcileTimer()`。

因此本次改造给 `EndpointContext` 增加了暂停状态：

- 发现新版本且 `isTip` 为 `true` 时调用 `pausePolling()`
- 暂停期间 `getEffectiveInterval()` 返回 `null`
- 直到用户完成版本同步，`syncVersion()` 才会解除暂停

这解决了“弹窗已经出现，但 `version.json` 仍持续请求”的问题。

## 构建插件与发包兼容

### 对外导出

当前包导出主要包括：

- `version-watcher`
- `version-watcher/plugin`
- `version-watcher/plugin/vite`
- `version-watcher/theme-chalk`

### 验证目标

发布兼容性以以下场景为硬指标：

- Node 14+ / 16+ 环境可以加载插件入口
- Vite 工程可以使用 `version-watcher/plugin/vite`
- webpack 5 和 Vue CLI 5 工程可以使用 `version-watcher/plugin`
- 发布包可以通过 tarball 被真实 fixture 安装和构建

### 验证脚本

- `scripts/verify-node-compat.cjs`
  - 验证 Node 入口加载

- `scripts/pack-and-smoke.cjs`
  - 打包后在临时目录中安装并构建 smoke fixture

## Example 与 smoke 的边界

### examples/vite-demo

定位：源码联调。

职责：

- 验证 SharedWorker 行为
- 验证多标签页共享
- 验证本地 `bump` 后的版本提示
- 验证联调场景下源码中的 worker import 前缀处理

该 demo 不再使用 Vite 插件在 dev server 中动态生成 git 版本，而是直接读取 `public/dist/version.json`，保证 `npm run bump --prefix examples/vite-demo` 修改的是页面实际轮询的版本源。

### smoke fixtures

定位：发布后的真实消费验证。

包括：

- `examples/smoke-vite`
- `examples/smoke-webpack`
- `examples/smoke-vue-cli`

## 本次关键修复记录

### 1. SharedWorker 消息解析修复

- 现象：版本已变化，但没有控制台日志，也没有弹窗
- 根因：wrapper 使用旧逻辑解析 SharedWorker 回调消息
- 修复：新增并真正使用 `normalizeRuntimeMessage`

### 2. demo 版本源冲突修复

- 现象：`bump` 后 network 响应与 `public/dist/version.json` 不一致
- 根因：Vite dev 插件在本地拦截了 `/dist/version.json` 并返回 git 信息
- 修复：demo 本地联调改为直接读取静态版本文件，只保留源码 worker import 改写插件

### 3. 更新提示后轮询仍继续的修复

- 现象：弹窗已经出现，但 network 仍持续请求 `version.json`
- 根因：仅 `stopTimer()`，没有持久化“暂停轮询”状态
- 修复：`EndpointContext` 增加 `pausePolling()` 和 `isPaused`

### 4. notifier 样式修复

- 现象：提示框只显示文字和按钮，背景卡片缺失
- 根因：样式依赖背景图资源，在 demo / build 链路中不稳定
- 修复：改为纯 CSS 卡片样式，不再依赖背景图片

## 回归测试

本次改造补充或强化了以下测试方向：

- SharedWorker client manager 单例行为
- endpoint context 的 interval 合并和暂停轮询行为
- 运行时消息归一化
- demo Vite 配置与版本源选择
- notifier 样式不再依赖背景图

## 已知事项

- Sass 仍存在 legacy JS API deprecation warning，属于工具链层面问题，本次未继续处理
- `examples/vite-demo` 在某些情况下如果输出目录残留嵌套结构，构建前需要先清理 `dist`
