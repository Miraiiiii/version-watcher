module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        // 目标环境设置为 IE 11（或其他不支持 class 的环境），保证所有 ES6 语法被转译
        targets: { ie: '11' },
        // modules 设置为 false，保持 Rollup 后处理模块（这不会影响类的转译）
        modules: false
      }
    ]
  ]
}
