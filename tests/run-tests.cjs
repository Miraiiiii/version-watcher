const fs = require('fs');
const path = require('path');

async function run() {
  const testsDir = __dirname;
  const files = fs
    .readdirSync(testsDir)
    .filter((file) => file.endsWith('.test.cjs'))
    .sort();

  let failures = 0;

  for (const file of files) {
    const testModule = require(path.join(testsDir, file));
    const runTest = typeof testModule === 'function' ? testModule : testModule.run;

    if (typeof runTest !== 'function') {
      throw new Error(`Test file ${file} must export a function or { run }`);
    }

    try {
      await runTest();
      console.log(`PASS ${file}`);
    } catch (error) {
      failures += 1;
      console.error(`FAIL ${file}`);
      console.error(error && error.stack ? error.stack : error);
    }
  }

  if (failures > 0) {
    process.exitCode = 1;
    return;
  }

  console.log(`All ${files.length} test files passed`);
}

run().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
