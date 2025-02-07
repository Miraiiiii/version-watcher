/*
 * @Description: 
 * @Author: 舌红
 * @Date: 2024-01-11 15:39:38
 * @LastEditors: 舌红
 * @LastEditTime: 2025-02-07 10:12:43
 */
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
      setTimeout(this.setVersionInfo, 1000)
    }
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tapAsync('UpdateListenerPlugin', async (stats, callback) => {
      const _that = this
      this.gitInfo = await this.getGitInfo((info) => {
        _that.setVersionInfo(info)
      })
      console.log('资源输出到目录完成 afterEmit', this.gitInfo)
      console.log(stats.hash)
      callback()
    })
  }
}

module.exports = UpdateListenerPlugin