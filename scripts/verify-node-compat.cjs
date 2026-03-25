const { execSync } = require('child_process')
const path = require('path')
const { pathToFileURL } = require('url')

function main() {
  const rootDir = path.resolve(__dirname, '..')
  const pluginEntry = path.join(rootDir, 'dist/plugin/index.cjs')
  const viteEntryUrl = pathToFileURL(path.join(rootDir, 'dist/plugin/vite.mjs')).href

  execSync(`node -e "const Plugin = require('${pluginEntry.replace(/\\/g, '\\\\')}'); if (typeof Plugin !== 'function') throw new Error('plugin entry must export a constructor');"`, {
    cwd: rootDir,
    stdio: 'inherit',
  })

  execSync(`node -e "import('${viteEntryUrl}').then((mod) => { if (typeof mod.default !== 'function') throw new Error('vite plugin entry must export a function'); }).catch((error) => { console.error(error); process.exit(1); })"`, {
    cwd: rootDir,
    stdio: 'inherit',
  })
}

main()
