$ErrorActionPreference = 'Stop'

npm run build
$packOutput = npm pack
$tarballName = ($packOutput | Select-Object -Last 1).Trim()
$tarballPath = Join-Path (Get-Location) $tarballName

$fixtures = @(
  @{ Path = 'examples/smoke-vite'; Build = 'npm run build' },
  @{ Path = 'examples/smoke-webpack'; Build = 'npm run build' },
  @{ Path = 'examples/smoke-vue-cli'; Build = 'npm run build' }
)

foreach ($fixture in $fixtures) {
  Push-Location $fixture.Path
  try {
    npm install
    npm install --no-save $tarballPath
    Invoke-Expression $fixture.Build
  } finally {
    Pop-Location
  }
}
