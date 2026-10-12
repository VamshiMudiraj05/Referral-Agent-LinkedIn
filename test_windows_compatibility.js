const assert = require('assert');
const path = require('path');
const fs = require('fs');
const BrowserController = require('./agents/BrowserController');

console.log('🧪 Testing Windows Cross-Platform Compatibility...\n');

// 1. Verify BrowserController default Chrome executable path resolution
console.log('1. Checking Chrome executable path resolution...');
const browser = new BrowserController();
console.log('Detected executable path:', browser.executablePath);
assert(browser.executablePath, 'Executable path must not be empty');
assert(fs.existsSync(browser.executablePath), `Chrome binary must exist at ${browser.executablePath}`);
console.log('✓ Successfully resolved valid Chrome executable for current OS:', browser.executablePath);

// 2. Test cleanStaleLocks on current OS
console.log('\n2. Testing cleanStaleLocks execution...');
try {
  browser.cleanStaleLocks();
  console.log('✓ cleanStaleLocks completed cleanly without errors');
} catch (err) {
  assert.fail(`cleanStaleLocks failed with error: ${err.message}`);
}

// 3. Test BrowserController initialization and teardown (headless test)
console.log('\n3. Testing browser launch and persistent context initialization...');
(async () => {
  const testProfileDir = path.join(__dirname, 'data', 'test_browser_profile');
  const testBrowser = new BrowserController({
    userDataDir: testProfileDir,
    headless: true,
    logger: (msg) => console.log('   [BrowserController]', msg)
  });

  try {
    const initialized = await testBrowser.init();
    assert.strictEqual(initialized, true, 'BrowserController.init() should return true');
    assert(testBrowser.context, 'Browser context should be active');
    assert(testBrowser.page, 'Browser page should be active');
    console.log('✓ Browser persistent context successfully launched');

    const userAgent = await testBrowser.page.evaluate(() => navigator.userAgent);
    console.log('   User Agent:', userAgent);
    if (process.platform === 'win32') {
      assert(userAgent.includes('Windows NT 10.0'), 'User agent should match Windows on win32 platform');
    }

    await testBrowser.close();
    console.log('✓ Browser closed cleanly');

    // Clean up temporary test profile
    if (fs.existsSync(testProfileDir)) {
      try {
        fs.rmSync(testProfileDir, { recursive: true, force: true });
      } catch (e) {}
    }

    console.log('\n✨ ALL WINDOWS COMPATIBILITY CHECKS PASSED! ✨\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Browser test failed:', err);
    try {
      await testBrowser.close();
    } catch (e) {}
    if (fs.existsSync(testProfileDir)) {
      try {
        fs.rmSync(testProfileDir, { recursive: true, force: true });
      } catch (e) {}
    }
    process.exit(1);
  }
})();
