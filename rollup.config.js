import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser'
import scss from 'rollup-plugin-scss'
import copy from 'rollup-plugin-copy'
import path from 'path'
import fs from 'fs'
import eslint from '@rollup/plugin-eslint'
import webWorkerLoader from 'rollup-plugin-web-worker-loader'
import alias from '@rollup/plugin-alias'

function createPluginCjsWrapper() {
  return {
    name: 'create-plugin-cjs-wrapper',
    writeBundle() {
      const wrapperPath = path.join(process.cwd(), 'dist/plugin/index.cjs')
      const wrapperSource = [
        "'use strict'",
        "const pluginModule = require('./core.cjs')",
        "module.exports = pluginModule && pluginModule.default ? pluginModule.default : pluginModule",
      ].join('\n')

      fs.writeFileSync(wrapperPath, `${wrapperSource}\n`)
    },
  }
}

function fixImagePaths() {
  return {
    name: 'fix-image-paths',
    writeBundle() {
      const cssFile = path.join(process.cwd(), 'dist/theme-chalk.css')
      if (!fs.existsSync(cssFile)) return

      let cssContent = fs.readFileSync(cssFile, 'utf8')
      cssContent = cssContent.replace(/url\(['"]?@\/static\/img\//g, 'url("./static/img/')
      cssContent = cssContent.replace(/png['"]?\)/g, 'png")')
      fs.writeFileSync(cssFile, cssContent)
    },
  }
}

const browserPlugins = [
  alias({
    entries: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
  }),
  resolve({
    browser: true,
    preferBuiltins: false,
  }),
  commonjs(),
  webWorkerLoader({
    targetPlatform: 'browser',
  }),
  copy({
    targets: [
      { src: 'src/static/img/*', dest: 'dist/static/img' },
    ],
    hook: 'writeBundle',
  }),
  scss({
    fileName: 'theme-chalk.css',
    includePaths: ['./src/theme-chalk'],
    outputStyle: 'expanded',
    silenceDeprecations: ['legacy-js-api'],
  }),
  fixImagePaths(),
  babel({
    babelHelpers: 'bundled',
    exclude: 'node_modules/**',
    include: 'src/**',
    babelrc: true,
    presets: [
      ['@babel/preset-env', {
        targets: {
          browsers: ['> 1%', 'last 2 versions', 'not dead'],
        },
      }],
    ],
  }),
  terser({
    format: {
      comments(node, comment) {
        return comment.value.includes('eslint-disable')
      },
    },
  }),
  eslint({
    throwOnError: false,
    throwOnWarning: false,
    include: ['src/**/*.js'],
    exclude: ['node_modules/**', 'dist/**'],
  }),
]

const nodeBabel = babel({
  babelHelpers: 'bundled',
  exclude: 'node_modules/**',
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: '14',
      },
      modules: false,
    }],
  ],
})

export default [
  {
    input: 'src/index.js',
    external: ['vue'],
    output: [
      {
        dir: 'dist',
        format: 'esm',
        exports: 'named',
        preserveModules: false,
        entryFileNames: 'index.esm.js',
        chunkFileNames: '[name]-[hash].mjs',
        banner: '/* eslint-disable */',
      },
      {
        dir: 'dist',
        format: 'cjs',
        exports: 'named',
        preserveModules: false,
        entryFileNames: 'index.cjs.js',
        chunkFileNames: '[name]-[hash].cjs',
        banner: '/* eslint-disable */',
      },
    ],
    plugins: browserPlugins,
  },
  {
    input: 'src/service/index.js',
    external: ['fs', 'path', 'child_process'],
    output: {
      file: 'dist/plugin/core.cjs',
      format: 'cjs',
      exports: 'auto',
    },
    plugins: [resolve(), commonjs(), nodeBabel, createPluginCjsWrapper()],
  },
  {
    input: 'src/plugin/vite-entry.js',
    external: ['fs', 'path', 'child_process'],
    output: {
      file: 'dist/plugin/vite.mjs',
      format: 'esm',
    },
    plugins: [resolve(), commonjs(), nodeBabel],
  },
]
