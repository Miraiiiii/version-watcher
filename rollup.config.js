import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser'
import scss from 'rollup-plugin-scss'
import copy from 'rollup-plugin-copy'
import path from 'path'
import fs from 'fs'
import eslint from '@rollup/plugin-eslint'

// 创建一个简单的插件来修改CSS中的图片路径
function fixImagePaths() {
  return {
    name: 'fix-image-paths',
    writeBundle() {
      const cssFile = path.join(process.cwd(), 'dist/theme-chalk.css')
      if (fs.existsSync(cssFile)) {
        let cssContent = fs.readFileSync(cssFile, 'utf8')
        // 修改图片路径
        cssContent = cssContent.replace(/\.\.\/static\/img\//g, './static/img/')
        fs.writeFileSync(cssFile, cssContent)
      }
    }
  }
}

export default [
  // 打包 src/index.js，生成 CommonJS 版本
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      exports: 'auto',
      // 使用 /*! 开头的 banner 注释，告诉 ESLint 跳过整个文件的检查
      banner: '/* eslint-disable */'
    },
    plugins: [
      resolve(),
      commonjs(),
      copy({
        targets: [
          { src: 'src/static/img/*', dest: 'dist/static/img' }
        ]
      }),
      scss({
        fileName: 'theme-chalk.css',
        includePaths: ['./src/theme-chalk'],
        outputStyle: 'expanded'
      }),
      fixImagePaths(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        include: 'src/**',
        babelrc: true
      }),
      terser({
        format: {
          // 保留包含 "eslint-disable" 的注释（必须返回 true 保持该注释）
          comments: function (node, comment) {
            return comment.value.includes('eslint-disable');
          }
        }
      }),
      eslint({
        throwOnError: false,
        throwOnWarning: false,
        include: ['src/**/*.js'], // 只校验 .js 文件
        exclude: ['node_modules/**', 'dist/**']
      })
    ]
  },
  // 单独打包 service 插件（构建工具部分）
  {
    input: 'src/service/index.js',
    output: {
      file: 'dist/service/index.js',
      format: 'cjs'
    },
    plugins: [
      resolve(),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**'
      })
    ]
  }
]