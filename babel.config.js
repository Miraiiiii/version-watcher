module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          browsers: [
            'ie >= 9',
            'last 2 versions',
            '> 1%'
          ]
        },
        modules: false,
        useBuiltIns: 'entry',
        corejs: 2
      }
    ]
  ]
}
