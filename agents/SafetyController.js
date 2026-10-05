class SafetyController {
  constructor(options = {}) {
    this.maxRequestsPerCompany = options.maxRequestsPerCompany || 10;
    this.maxRequestsPerSession = options.maxRequestsPerSession || 20;
    this.minDelayMs = options.minDelayMs || 3500;
    this.maxDelayMs = options.maxDelayMs || 7000;
    
    this.requestsThisCompany = 0;
    this.requestsThisSession = 0;
    this.currentCompany = '';
    this.isPaused = false;
    this.pauseReason = '';
    this.onSecurityAlert = null;
  }

  setCompany(company) {
    if (this.currentCompany.toLowerCase() !== company.toLowerCase()) {
      this.currentCompany = company;
      this.requestsThisCompany = 0;
    }
  }

  canSendRequest() {
    if (this.isPaused) {
      return { allowed: false, reason: this.pauseReason || 'Agent is paused' };
    }
    if (this.requestsThisCompany >= this.maxRequestsPerCompany) {
      return { allowed: false, reason: `Reached maximum requests for ${this.currentCompany} (${this.maxRequestsPerCompany})` };
    }
    if (this.requestsThisSession >= this.maxRequestsPerSession) {
      return { allowed: false, reason: `Reached maximum total requests for session (${this.maxRequestsPerSession})` };
    }
    return { allowed: true };
  }

  recordRequestSent() {
    this.requestsThisCompany++;
    this.requestsThisSession++;
  }

  async humanDelay(multiplier = 1.0) {
    const min = this.minDelayMs * multiplier;
    const max = this.maxDelayMs * multiplier;
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
    return delay;
  }

  async checkSecurityChallenge(page) {
    if (!page) return false;
    try {
      const url = page.url() || '';

      // If user is on a standard authenticated LinkedIn page with active navigation, it is NOT blocked
      const isNormalPage = await page.evaluate(() => {
        const nav = document.querySelector('nav.global-nav, #global-nav, .global-nav__content');
        const isCompanyOrFeed = window.location.href.includes('/company/') || 
                                window.location.href.includes('/feed/') || 
                                window.location.href.includes('/in/') ||
                                window.location.href.includes('/search/');
        // If navigation bar exists and no blocking modal is showing, it's a completely normal page
        return !!(nav && isCompanyOrFeed);
      });

      if (isNormalPage) {
        return false;
      }

      // Check for hard security checkpoint URLs
      const securityUrlPatterns = [
        '/checkpoint/challenge',
        '/checkpoint/lg/',
        '/checkpoint/v2/',
        '/security-check',
        '/authwall',
        'checkpoint/security-check'
      ];

      for (const pattern of securityUrlPatterns) {
        if (url.includes(pattern)) {
          this.triggerSecurityPause('LinkedIn security verification URL detected');
          return true;
        }
      }

      // Check DOM elements for explicit full-page blocking security screens
      const challengeFound = await page.evaluate(() => {
        const h1 = document.querySelector('h1, .challenge-dialog h2');
        const h1Text = h1 ? h1.innerText.toLowerCase() : '';

        const hardBlockIndicators = [
          'security check',
          'enter the code',
          'verify your identity',
          'quick verification',
          'please solve this puzzle',
          'unusual activity detected',
          'we have restricted your account'
        ];

        for (const ind of hardBlockIndicators) {
          if (h1Text.includes(ind)) return ind;
        }

        // Check if there is an active challenge dialog modal
        const challengeDialog = document.querySelector('.challenge-dialog, #captcha-challenge');
        if (challengeDialog && challengeDialog.offsetParent !== null) {
          return 'Challenge dialog modal active';
        }

        return null;
      });

      if (challengeFound) {
        this.triggerSecurityPause(`LinkedIn security challenge detected (${challengeFound})`);
        return true;
      }

      return false;
    } catch (err) {
      console.warn('Safety check evaluation notice:', err.message);
      return false;
    }
  }

  triggerSecurityPause(reason) {
    this.isPaused = true;
    this.pauseReason = `LinkedIn requires manual intervention. The agent has paused to protect the account. (${reason})`;
    if (this.onSecurityAlert) {
      this.onSecurityAlert(this.pauseReason);
    }
  }

  resume() {
    this.isPaused = false;
    this.pauseReason = '';
  }

  pause(reason = 'User paused workflow') {
    this.isPaused = true;
    this.pauseReason = reason;
  }
}

module.exports = SafetyController;
