$ErrorActionPreference = 'Stop'

if (-not (Test-Path 'dist/plugin/index.cjs')) {
  npm run build
}

node -e "const Plugin = require('./dist/plugin/index.cjs'); if (typeof Plugin !== 'function') { throw new Error('plugin entry must export a constructor'); }"
node -e "import('./dist/plugin/vite.mjs').then((mod) => { if (typeof mod.default !== 'function') { throw new Error('vite plugin entry must export a function'); } }).catch((error) => { console.error(error); process.exit(1); })"
