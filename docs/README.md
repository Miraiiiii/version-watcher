# 文档索引

本文档目录按“使用方”和“维护方”双轨组织。

## 如果你是使用方

优先阅读：

- [使用文档](./user-guide.md)
- [排障文档](./troubleshooting.md)

你可以在这些文档里找到：

- 如何接入 `version-watcher`
- 如何配置 `endpoint`、`interval`、`polling` 等选项
- 运行模式和更新弹窗行为说明
- 本地调试和常见问题处理方式

## 如果你是维护方

优先阅读：

- [开发文档](./development.md)
- [本次优化实现说明](./implementation/sharedworker-compat.md)
- [排障文档](./troubleshooting.md)

你可以在这些文档里找到：

- 仓库目录和核心模块职责
- 本地开发、example 联调、测试和发包验证方式
- SharedWorker 单实例方案、兼容性改造和本次优化的设计取舍
- 近期问题修复记录与调试建议

## 建议阅读顺序

### 接入新项目

1. [README](../README.md)
2. [使用文档](./user-guide.md)
3. [排障文档](./troubleshooting.md)

### 维护本仓库

1. [README](../README.md)
2. [开发文档](./development.md)
3. [本次优化实现说明](./implementation/sharedworker-compat.md)
4. [排障文档](./troubleshooting.md)
