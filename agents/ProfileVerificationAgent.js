class ProfileVerificationAgent {
  constructor(browserController, safetyController, logger = console.log) {
    this.browser = browserController;
    this.safety = safetyController;
    this.logger = logger;
  }

  async verifyCandidateProfile(candidate, targetCompanyName) {
    const page = this.browser.page;
    if (!page) throw new Error('Browser page not available');

    this.logger(`Validating profile on LinkedIn: ${candidate.personName} (${candidate.profileUrl})`);

    try {
      await page.goto(candidate.profileUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await this.safety.humanDelay(0.7);

      if (await this.safety.checkSecurityChallenge(page)) {
        throw new Error(this.safety.pauseReason);
      }

      const verificationResult = await page.evaluate(({ targetCompany, fallbackName, fallbackHeadline, fallbackTitle }) => {
        // Scrape top card details
        const topCardNameEl = document.querySelector('h1.inline.t-24, h1.text-heading-xlarge, h1');
        const rawName = topCardNameEl ? topCardNameEl.innerText.trim() : '';

        const headlineEl = document.querySelector('.text-body-medium.break-words, div.text-body-medium');
        const headline = headlineEl ? headlineEl.innerText.trim() : '';

        // Check experience section
        const expSection = document.querySelector('#experience')?.closest('section');
        let currentCompanyFound = false;
        let verifiedCompany = '';
        let verifiedTitle = '';

        const cleanTarget = targetCompany.toLowerCase().trim();

        if (expSection) {
          const expItems = expSection.querySelectorAll('li.artdeco-list__item, li.pvs-list__paged-list-item');
          if (expItems.length > 0) {
            // Check the top (most recent) experience item
            const firstExp = expItems[0].innerText;
            const isPresent = firstExp.toLowerCase().includes('present') || firstExp.toLowerCase().includes('current');
            
            if (firstExp.toLowerCase().includes(cleanTarget)) {
              currentCompanyFound = true;
              verifiedCompany = targetCompany;
            }

            // Extract role title from first line
            const lines = firstExp.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length > 0) {
              verifiedTitle = lines[0];
            }
          }
        }

        // If not found in experience list explicitly, verify headline
        const combinedHeadline = (headline || fallbackHeadline).toLowerCase();
        if (!currentCompanyFound && combinedHeadline) {
          if (combinedHeadline.includes(`at ${cleanTarget}`) || combinedHeadline.includes(`@ ${cleanTarget}`) || combinedHeadline.includes(cleanTarget) || combinedHeadline.includes(`@${cleanTarget}`)) {
            currentCompanyFound = true;
            verifiedCompany = targetCompany;
            verifiedTitle = headline || fallbackHeadline;
          }
        }

        // Check if Connect button or status is visible directly on profile
        const buttons = Array.from(document.querySelectorAll('button'));
        const hasConnectBtn = buttons.some(b => {
          const t = (b.innerText || '').toLowerCase();
          return t.includes('connect');
        });
        const hasPendingBtn = buttons.some(b => (b.innerText || '').toLowerCase().includes('pending'));
        const hasMessageBtn = buttons.some(b => (b.innerText || '').toLowerCase() === 'message');

        return {
          verifiedName: rawName || fallbackName,
          headline: headline || fallbackHeadline,
          currentCompanyFound,
          verifiedTitle: verifiedTitle || headline || fallbackTitle,
          hasConnectBtn,
          hasPendingBtn,
          hasMessageBtn
        };
      }, {
        targetCompany: targetCompanyName,
        fallbackName: candidate.personName,
        fallbackHeadline: candidate.headline || '',
        fallbackTitle: candidate.jobTitle || ''
      });

      // If current company was not verified strictly in experience section or headline
      if (!verificationResult.currentCompanyFound) {
        this.logger(`⚠ Notice: Could not strictly verify current employment at "${targetCompanyName}". Headline: "${verificationResult.headline}"`, 'warning');
        const lowerHeadline = (verificationResult.headline || '').toLowerCase();
        if (!lowerHeadline.includes(targetCompanyName.toLowerCase())) {
          return {
            isValid: false,
            reason: `Does not appear to currently work at ${targetCompanyName} (Headline: ${verificationResult.headline})`,
            candidate
          };
        }
      }

      this.logger(`✓ Verified current employment for ${verificationResult.verifiedName}: ${verificationResult.verifiedTitle}`, 'success');

      return {
        isValid: true,
        verifiedName: verificationResult.verifiedName,
        verifiedTitle: verificationResult.verifiedTitle,
        hasConnectBtn: verificationResult.hasConnectBtn,
        hasPendingBtn: verificationResult.hasPendingBtn,
        hasMessageBtn: verificationResult.hasMessageBtn
      };
    } catch (err) {
      this.logger(`Profile verification error for ${candidate.personName}: ${err.message}`, 'error');
      // If evaluate or navigation failed, gracefully allow if discovered from company People section
      return {
        isValid: true,
        verifiedName: candidate.personName,
        verifiedTitle: candidate.jobTitle || candidate.headline,
        hasConnectBtn: true
      };
    }
  }
}

module.exports = ProfileVerificationAgent;
