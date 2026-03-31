const { execSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { copySync, removeSync } = require('fs-extra')

function run(command, cwd) {
  execSync(command, {
    cwd,
    stdio: 'inherit',
  })
}

function createTempFixture(rootDir, fixture, tarballPath) {
  const fixtureDir = path.join(rootDir, fixture)
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'version-watcher-smoke-'))
  const targetDir = path.join(tempRoot, path.basename(fixtureDir))

  copySync(fixtureDir, targetDir, {
    filter(src) {
      const baseName = path.basename(src)
      return baseName !== 'node_modules' && baseName !== 'dist' && baseName !== 'package-lock.json'
    },
  })

  const tarballName = path.basename(tarballPath)
  const localTarballPath = path.join(targetDir, tarballName)
  fs.copyFileSync(tarballPath, localTarballPath)

  const packageJsonPath = path.join(targetDir, 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  packageJson.dependencies = packageJson.dependencies || {}
  packageJson.dependencies['version-watcher'] = `file:./${tarballName}`
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))

  return {
    tempRoot,
    targetDir,
  }
}

function main() {
  const rootDir = path.resolve(__dirname, '..')
  run('npm run build', rootDir)

  const packOutput = execSync('npm pack', {
    cwd: rootDir,
    stdio: ['ignore', 'pipe', 'inherit'],
  }).toString().trim().split(/\r?\n/)
  const tarballPath = path.join(rootDir, packOutput[packOutput.length - 1])

  const fixtures = [
    'examples/smoke-vite',
    'examples/smoke-webpack',
    'examples/smoke-vue-cli',
  ]

  for (const fixture of fixtures) {
    const { tempRoot, targetDir } = createTempFixture(rootDir, fixture, tarballPath)

    try {
      run('npm install --no-audit --no-fund --loglevel=error', targetDir)
      run('npm run build', targetDir)
    } finally {
      removeSync(tempRoot)
    }
  }
}

main()

