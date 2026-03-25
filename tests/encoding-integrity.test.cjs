const assert = require('assert');
const fs = require('fs');
const path = require('path');

const files = [
  'examples/vite-demo/src/main.js',
  'src/core/version-watcher-wrapper.js',
  'src/core/version-watcher.js',
  'src/ui/version-notifier.js',
  'src/utils/refresh-broadcast.js',
  'src/utils/version-broadcast.js',
];

const forbiddenSnippets = [
  '鍙戠幇',
  '涓轰簡',
  '鏇村ソ',
  '鏂扮増鏈',
  '鍚屾簮',
  '骞挎挱',
  '鏈紝',
  '璇峰埛鏂',
  '褰撳墠椤甸潰',
  '\uFFFD',
];

async function run() {
  for (const file of files) {
    const source = fs.readFileSync(path.resolve(file), 'utf8');

    for (const snippet of forbiddenSnippets) {
      assert.ok(
        !source.includes(snippet),
        `${file} should not contain mojibake snippet: ${snippet}`
      );
    }
  }

  const demoMain = fs.readFileSync(path.resolve('examples/vite-demo/src/main.js'), 'utf8');
  assert.ok(demoMain.includes("content: '发现新版本，请刷新当前页面。',"));

  const wrapper = fs.readFileSync(path.resolve('src/core/version-watcher-wrapper.js'), 'utf8');
  assert.ok(wrapper.includes("content: '为了更好的版本体验请更新到最新版本',"));
  assert.ok(wrapper.includes("throw new Error('interval 必须是大于等于 1000 的数字')"));
}

module.exports = run;
