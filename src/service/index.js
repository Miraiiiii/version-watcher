const { existsSync, mkdirSync, writeFileSync } = require('fs')
const path = require('path')
const { execSync } = require('child_process')

function execGit(command) {
  try {
    return execSync(command, {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim()
  } catch (error) {
    return ''
  }
}

function normalizePathSegment(value) {
  return String(value || '')
    .replace(/^\.\//, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
}

class VersionWatcherPlugin {
  constructor(options = {}) {
    this.options = {
      outputDir: 'dist',
      filename: 'version.json',
      publicPath: '',
      ...options,
    }
    this.resolvedConfig = null
  }

  getGitInfo() {
    const version = execGit('git rev-parse HEAD') || 'dev'
    const message = execGit('git log --no-merges -1 --pretty=format:"%s"')

    return {
      version,
      isTip: !/--no-tip/.test(message),
    }
  }

  getOutputDir(baseDir = process.cwd()) {
    return path.resolve(baseDir, this.options.outputDir)
  }

  getPublicPath() {
    if (this.options.publicPath) {
      return this.options.publicPath
    }

    const outputDir = normalizePathSegment(this.options.outputDir)
    const filename = normalizePathSegment(this.options.filename)
    return `/${outputDir}/${filename}`
  }

  writeVersionInfo(outputDir, info = this.getGitInfo()) {
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }

    const filePath = path.join(outputDir, this.options.filename)
    writeFileSync(filePath, JSON.stringify(info, null, 2), {
      encoding: 'utf8',
    })
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tap('VersionWatcherPlugin', () => {
      const outputPath = compiler.options.output && compiler.options.output.path
        ? compiler.options.output.path
        : this.getOutputDir()
      this.writeVersionInfo(outputPath)
    })
  }

  vite() {
    return {
      name: 'vite-plugin-version-watcher',
      configResolved: (config) => {
        this.resolvedConfig = config
      },
      configureServer: (server) => {
        const publicPath = this.getPublicPath()
        server.middlewares.use((req, res, next) => {
          const requestPath = (req.url || '').split('?')[0]
          if (requestPath !== publicPath) {
            next()
            return
          }

          const info = this.getGitInfo()
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(info, null, 2))
        })
      },
      writeBundle: () => {
        const rootDir = this.resolvedConfig ? this.resolvedConfig.root : process.cwd()
        const outDir = this.resolvedConfig
          ? this.resolvedConfig.build.outDir
          : this.options.outputDir
        this.writeVersionInfo(path.resolve(rootDir, outDir))
      },
    }
  }
}

module.exports = VersionWatcherPlugin

