import fs from 'fs'
import path from 'path'

const filePath = path.resolve(process.cwd(), 'public/dist/version.json')
const current = JSON.parse(fs.readFileSync(filePath, 'utf8'))
const nextVersion = `demo-${Date.now()}`

fs.writeFileSync(filePath, JSON.stringify({
  ...current,
  version: nextVersion,
}, null, 2))

console.log(`Updated demo version to ${nextVersion}`)
