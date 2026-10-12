const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync, spawnSync } = require('child_process');

function getDefaultChromePath() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  if (process.platform === 'win32') {
    const candidates = [
      path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe')
    ];
    for (const candidate of candidates) {
      if (candidate && fs.existsSync(candidate)) {
        return candidate;
      }
    }
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  }

  if (process.platform === 'darwin') {
    const macPath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    if (fs.existsSync(macPath)) return macPath;
    const userMacPath = path.join(process.env.HOME || '', 'Applications', 'Google Chrome.app', 'Contents', 'MacOS', 'Google Chrome');
    if (fs.existsSync(userMacPath)) return userMacPath;
    return macPath;
  }

  // Linux and other POSIX
  const linuxCandidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ];
  for (const candidate of linuxCandidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return '/usr/bin/google-chrome';
}

class BrowserController {
  constructor(options = {}) {
    this.userDataDir = options.userDataDir || path.join(__dirname, '..', 'data', 'chrome_profile');
    this.executablePath = options.executablePath || getDefaultChromePath();
    this.headless = options.headless !== undefined ? options.headless : false; // Default to visible for easy login and safety
    this.context = null;
    this.page = null;
    this.isLoggedIn = false;
    this.logger = options.logger || console.log;
  }

  setHeadless(val) {
    this.headless = val;
  }

  cleanStaleLocks() {
    try {
      // 1. Terminate any lingering processes attached to this profile dir
      try {
        if (process.platform === 'win32') {
          const safePath = this.userDataDir.replace(/['`$]/g, '');
          spawnSync('powershell.exe', [
            '-NoProfile',
            '-Command',
            `Get-CimInstance Win32_Process -Filter "Name = 'chrome.exe'" | Where-Object { $_.CommandLine -like '*${safePath}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`
          ], { stdio: 'ignore' });
        } else {
          const escapedPath = this.userDataDir.replace(/"/g, '\\"');
          execSync(`pkill -f "${escapedPath}" || true`, { stdio: 'ignore' });
        }
      } catch (e) {}

      // 2. Remove stale Chromium singleton lock files
      const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];
      for (const file of lockFiles) {
        const fullPath = path.join(this.userDataDir, file);
        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('Notice: Error during lock cleanup:', err.message);
    }
  }

  async init() {
    // 1. If an existing context is already open and healthy, reuse it directly
    if (this.context) {
      try {
        const pages = this.context.pages();
        if (pages.length > 0 && !pages[0].isClosed()) {
          this.page = pages[0];
          this.logger('Reusing active browser session.');
          return true;
        }
      } catch (e) {
        await this.close();
      }
    }

    if (!fs.existsSync(this.userDataDir)) {
      fs.mkdirSync(this.userDataDir, { recursive: true });
    } else {
      this.cleanStaleLocks();
    }

    this.logger('Initializing browser with persistent profile...');

    const launchArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--window-size=1280,850'
    ];

    const launchFn = async () => {
      this.context = await chromium.launchPersistentContext(this.userDataDir, {
        executablePath: this.executablePath,
        headless: this.headless,
        viewport: { width: 1280, height: 850 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        args: launchArgs
      });

      const pages = this.context.pages();
      this.page = pages.length > 0 ? pages[0] : await this.context.newPage();
      
      // Auto-reset references if user or system closes window
      this.context.on('close', () => {
        this.context = null;
        this.page = null;
      });
      if (this.page) {
        this.page.on('close', () => {
          this.page = null;
        });
      }

      // Anti-detect helper
      await this.page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });

      this.logger('Browser initialized successfully');
      return true;
    };

    try {
      return await launchFn();
    } catch (err) {
      // Self-healing: If profile is locked by an existing process or stale session
      if (err.message.includes('Opening in existing browser session') || err.message.includes('Singleton')) {
        this.logger('Detected lingering Chrome profile lock. Auto-resolving and reopening browser...', 'warning');
        this.cleanStaleLocks();
        await new Promise(r => setTimeout(r, 1500));
        try {
          return await launchFn();
        } catch (retryErr) {
          this.logger(`Failed to initialize browser after lock clearing: ${retryErr.message}`, 'error');
          throw retryErr;
        }
      } else {
        this.logger(`Failed to initialize browser: ${err.message}`, 'error');
        throw err;
      }
    }
  }

  async checkLoginStatus() {
    if (!this.page) throw new Error('Browser not initialized');
    this.logger('Checking LinkedIn authentication status...');

    try {
      await this.page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.page.waitForTimeout(2500);

      const currentUrl = this.page.url();
      if (currentUrl.includes('/feed') || currentUrl.includes('/mynetwork')) {
        this.isLoggedIn = true;
        this.logger('✓ Successfully verified: Logged in to LinkedIn', 'success');
        return { loggedIn: true };
      }

      // Check for global navigation
      const navExists = await this.page.$('nav.global-nav, #global-nav, div[data-view-name="feed-full-identity"]');
      if (navExists) {
        this.isLoggedIn = true;
        this.logger('✓ Successfully verified: Logged in to LinkedIn', 'success');
        return { loggedIn: true };
      }

      this.isLoggedIn = false;
      this.logger('LinkedIn login required. Please sign in manually in the browser window.', 'warning');
      return { 
        loggedIn: false, 
        currentUrl,
        reason: 'Please log in to LinkedIn in the browser window. Do not bypass 2FA or CAPTCHA automatically.'
      };
    } catch (err) {
      this.logger(`Login check encounter: ${err.message}`, 'warning');
      return { loggedIn: false, error: err.message };
    }
  }

  async waitForManualLogin(maxWaitMs = 180000, pollIntervalMs = 4000) {
    this.logger('Waiting for manual user login in browser window...');
    const start = Date.now();

    while (Date.now() - start < maxWaitMs) {
      try {
        const url = this.page.url();
        if (url.includes('/feed') || url.includes('/mynetwork') || url.includes('/in/')) {
          this.isLoggedIn = true;
          this.logger('✓ Detected login completion!', 'success');
          return true;
        }

        const nav = await this.page.$('nav.global-nav, #global-nav');
        if (nav) {
          this.isLoggedIn = true;
          this.logger('✓ Detected login navigation element!', 'success');
          return true;
        }
      } catch (e) {
        // Page might be navigating
      }
      await this.page.waitForTimeout(pollIntervalMs);
    }

    throw new Error('Manual login timed out after 3 minutes. Please log in and try again.');
  }

  async captureScreenshot() {
    if (!this.page) return null;
    try {
      const buffer = await this.page.screenshot({ type: 'jpeg', quality: 65 });
      return buffer.toString('base64');
    } catch (err) {
      return null;
    }
  }

  async humanClick(selector, options = {}) {
    const el = typeof selector === 'string' ? await this.page.waitForSelector(selector, { timeout: 8000, ...options }) : selector;
    if (!el) throw new Error(`Element not found: ${selector}`);
    
    // Natural jitter before click
    await this.page.waitForTimeout(300 + Math.random() * 400);
    await el.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(200);
    await el.click();
    await this.page.waitForTimeout(500 + Math.random() * 500);
  }

  async humanType(selector, text) {
    const el = typeof selector === 'string' ? await this.page.waitForSelector(selector, { timeout: 8000 }) : selector;
    await el.click();
    await this.page.waitForTimeout(200);
    
    // Type with slightly randomized human delay per character
    for (const char of text) {
      await this.page.keyboard.type(char, { delay: Math.floor(Math.random() * 40) + 25 });
    }
    await this.page.waitForTimeout(400);
  }

  async close() {
    try {
      if (this.context) {
        await this.context.close();
      }
    } catch (err) {
      console.warn('Error closing browser context:', err);
    }
    this.context = null;
    this.page = null;
    this.cleanStaleLocks();
  }
}

module.exports = BrowserController;
