const { existsSync, writeFileSync } = require('fs')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

class UpdateListenerPlugin {
  constructor() {
    this.gitInfo = {
      version: '',
      isTip: true
    }
  }

  // 获取子进程
  getChildProcess(key) {
    return new Promise((resolve) => {
      exec(key, (err, stdout) => {
        if (err) {
          console.error(err)
          resolve(null)
        }
        resolve(stdout.trim())
      })
    })
  }

  // 获取git信息
  async getGitInfo(callback) {
    return Promise.all([
      this.getChildProcess('git rev-parse --abbrev-ref HEAD'),
      this.getChildProcess('git rev-parse HEAD'),
      this.getChildProcess('git show -s --format=%cd'),
      this.getChildProcess('git show -s --format=%cn'),
      this.getChildProcess('git log --no-merges --grep="^Revert" --invert-grep -1 --pretty=format:"%s"')
    // eslint-disable-next-line no-unused-vars
    ]).then(([branchName, version, date, name, message]) => {
      const reg = /--no-tip/
      const info = {
        version,
        isTip: !reg.test(message)
      }
      callback && callback(info)
      return info
    }).catch(err => {
      console.error('git error', err)
    })
  }

  // 写入版本信息
  setVersionInfo(info) {
    if (existsSync('./dist')) {
      try {
        writeFileSync('./dist/version.json', JSON.stringify(info), {
          encoding: 'utf8'
        })
        console.log('写入version.json成功')
      } catch (error) {
        console.log('写入version.json失败')
        console.error(error)
      }
    } else {
      const self = this
      setTimeout(() => self.setVersionInfo(info), 1000)
    }
  }

  // Webpack 插件实现
  apply(compiler) {
    compiler.hooks.afterEmit.tapAsync('UpdateListenerPlugin', async (stats, callback) => {
      const _that = this
      this.gitInfo = await this.getGitInfo((info) => {
        _that.setVersionInfo(info)
      })
      console.log('资源输出到目录完成 afterEmit', this.gitInfo)
      callback()
    })
  }

  // Vite 插件实现
  vite() {
    const self = this
    return {
      name: 'vite-plugin-version-watcher',
      async writeBundle() {
        const info = await self.getGitInfo()
        self.gitInfo = info
        console.log('资源输出到目录完成 afterEmit', self.gitInfo)
        self.setVersionInfo(info)
      }
    }
  }
}

// 导出 Webpack 插件
module.exports = UpdateListenerPlugin

// 导出 Vite 插件工厂函数
UpdateListenerPlugin.vite = function() {
  const plugin = new UpdateListenerPlugin()
  return plugin.vite()
}