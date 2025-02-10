# Version Watcher

一个轻量级的前端版本监控工具，用于实时检测和提示网站版本更新。

## 特性

- 🚀 自动检测版本更新
- ⏰ 可配置的检查间隔
- 🔔 自定义更新提示内容
- 🛡️ 支持 JS 错误监控
- 🌐 支持同源页面自动刷新
- 🎨 可自定义提示框样式
- 📦 提供构建工具插件，自动生成版本信息

## 安装

```bash
npm install version-watcher
```

## 使用方法

### 前端监控

```javascript
import VersionWatcher from 'version-watcher'

// 基础使用
new VersionWatcher()

// 自定义配置
new VersionWatcher({
  endpoint: '/dist/version.json',  // 版本信息文件路径
  interval: 5 * 60 * 1000,        // 检查间隔（默认5分钟）
  content: '发现新版本，请刷新页面',  // 自定义提示内容
  disabled: false,                // 是否禁用更新提示
  isListenJSError: false,        // 是否监听JS错误
  refreshSameOrigin: true        // 是否自动刷新同源页面
})
```

### 构建工具插件

在构建工具配置文件中使用插件，自动生成和更新版本信息：

#### Vue CLI (webpack)

```javascript
// vue.config.js
const VersionWatcherPlugin = require('version-watcher/plugin')

module.exports = {
  configureWebpack: {
    plugins: [
      new VersionWatcherPlugin()
    ]
  }
}
```

#### Vite

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import VersionWatcherPlugin from 'version-watcher/plugin/vite'

export default defineConfig({
  plugins: [
    VersionWatcherPlugin.vite()
  ],
  // 本地开发时的配置
  server: {
    fs: {
      strict: false // 允许访问工作区以外的文件，用于本地调试
    }
  }
})
```

> **注意：** 在使用 Vite 进行本地开发时，需要将 `server.fs.strict` 设置为 `false`。这是因为 version-watcher 需要访问项目根目录之外的文件来检测版本更新。如果不设置这个选项，可能会遇到文件访问限制的错误。

插件会在每次构建时：
1. 自动获取最新的 Git 提交信息
2. 生成包含版本信息的 JSON 文件
3. 确保版本文件位于正确的构建输出目录

插件生成的版本信息格式如下：

```json
{
  "version": "a1b2c3d",  // Git 最新的 commit hash
  "isTip": true         // 是否显示更新提示
}
```

> 提示：插件会自动获取 Git 仓库最新的 commit hash 作为版本号，每次代码提交后构建都会生成新的版本号，从而触发用户端的更新提示。

### 手动维护版本信息

如果不使用构建工具插件，你需要手动维护版本信息文件。默认情况下，文件路径为 `/dist/version.json`，格式如下：

```json
{
  "version": "1.0.0",     // 版本号
  "isTip": true          // 是否显示更新提示
}
```

> 提示：version 的值可以是任意字符串，只要与当前访问页面的版本不同，就会触发更新提示。

## 配置选项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| endpoint | String | '/dist/version.json' | 版本信息接口地址 |
| interval | Number | 300000 | 检查更新间隔（毫秒） |
| disabled | Boolean | false | 是否禁用更新提示 |
| isListenJSError | Boolean | false | 是否监听JS错误 |
| content | String | '为了更好的版本体验请更新到最新版本' | 提示框内容 |
| dangerouslyUseHTMLString | Boolean | false | 是否允许内容使用HTML |
| refreshSameOrigin | Boolean | true | 是否自动刷新同源页面 |

## 自定义更新提示

当 `dangerouslyUseHTMLString` 设置为 `true` 时，你可以使用 HTML 字符串来自定义更新提示的内容和按钮：

```html
new VersionWatcher({
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
  dangerouslyUseHTMLString: true
})
```

### 按钮 ID 说明

为了使自定义的 HTML 内容能够正确响应用户操作，需要为按钮元素添加特定的 ID：

- `VersionNotifierConfirm`: 点击后立即刷新更新
- `VersionNotifierCancel`: 点击后关闭提示，暂不更新

> 注意：使用 HTML 字符串时请确保内容的安全性，避免 XSS 风险。

## 开发

```bash
# 安装依赖
npm install

# 开发构建
npm run build
```

## License

[MIT](LICENSE)
