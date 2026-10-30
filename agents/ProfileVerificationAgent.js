const LocationMatcher = require('./LocationMatcher');

class ProfileVerificationAgent {
  constructor(browserController, safetyController, logger = console.log) {
    this.browser = browserController;
    this.safety = safetyController;
    this.logger = logger;
  }

  async verifyCandidateProfile(candidate, targetCompanyName, locationFilter = '') {
    const page = this.browser.page;
    if (!page) throw new Error('Browser page not available');

    this.logger(`Validating profile on LinkedIn: ${candidate.personName} (${candidate.profileUrl})`);

    try {
      await page.goto(candidate.profileUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await this.safety.humanDelay(0.7);

      if (await this.safety.checkSecurityChallenge(page)) {
        return {
          isValid: false,
          reason: this.safety.pauseReason || 'LinkedIn security challenge detected; profile was not verified',
          candidate
        };
      }

      const discoveredOnCompanyPeoplePage = (candidate.discoveredAtCompany || '').trim().toLowerCase()
        === targetCompanyName.trim().toLowerCase();
      const hasRelevantRole = ['HR / Talent', 'IT / Engineering'].includes(candidate.department)
        || candidate.isAlumni === true;
      if (discoveredOnCompanyPeoplePage && !hasRelevantRole) {
        return {
          isValid: false,
          reason: 'Candidate does not match the HR, IT/Engineering, or alumni outreach criteria',
          candidate
        };
      }

      if (!discoveredOnCompanyPeoplePage && typeof page.waitForFunction === 'function') {
        await page.waitForFunction(() =>
          Array.from(document.querySelectorAll('main h1, h1'))
            .some(element => element.getClientRects().length > 0
              && (element.innerText || element.textContent || '').trim()),
        null,
        { timeout: 10000 }).catch(error => {
          this.logger(`Timed out waiting for LinkedIn's visible profile name: ${error.message}`, 'warning');
        });
      }

      const verificationResult = await page.evaluate(({ targetCompany }) => {
        const visibleNameHeadings = Array.from(document.querySelectorAll('main h1, h1'))
          .filter(element => element.getClientRects().length > 0)
          .map(element => (element.innerText || element.textContent || '').trim())
          .filter(Boolean);
        const rawName = visibleNameHeadings[0] || '';
        let profileHeaderText = '';
        const topCardNameEl = Array.from(document.querySelectorAll('main h1, h1'))
          .find(element => element.getClientRects().length > 0
            && (element.innerText || element.textContent || '').trim() === rawName);
        if (topCardNameEl) {
          let header = topCardNameEl;
          for (let level = 0; level < 5 && header.parentElement; level++) {
            header = header.parentElement;
            if (header.matches('section')) break;
          }
          profileHeaderText = header.innerText || '';
        }

        const headlineEl = document.querySelector('.text-body-medium.break-words, div.text-body-medium');
        const headline = headlineEl ? headlineEl.innerText.trim() : '';

        const normalizeCompanyName = value => (value || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, ' ')
          .trim()
          .replace(/\s+/g, ' ');
        const normalizedTarget = normalizeCompanyName(targetCompany);
        const matchesCompany = text => {
          const normalizedText = normalizeCompanyName(text);
          return normalizedTarget.length > 0 && ` ${normalizedText} `.includes(` ${normalizedTarget} `);
        };

        // Only current Experience entries count; headlines and People-tab membership can be stale.
        const experienceAnchor = document.querySelector('#experience');
        const expSection = experienceAnchor?.closest('section')
          || Array.from(document.querySelectorAll('section')).find(section =>
            section.querySelector('h2')?.innerText.trim().toLowerCase() === 'experience'
          );
        let currentCompanyFound = false;
        let verifiedTitle = '';

        if (expSection) {
          const expItems = expSection.querySelectorAll('li.artdeco-list__item, li.pvs-list__paged-list-item');
          for (const expItem of expItems) {
            const experienceText = expItem.innerText || '';
            const isCurrent = /\b(present|current|now)\b/i.test(experienceText);

            if (isCurrent && matchesCompany(experienceText)) {
              currentCompanyFound = true;
              const lines = experienceText.split('\n').map(line => line.trim()).filter(Boolean);
              verifiedTitle = lines[0] || '';
              break;
            }
          }
        }

        const locationEl = document.querySelector('.text-body-small.inline.t-black--light.break-words, span[class*="top-card__subline-item"], .pv-text-details__left-panel > span.text-body-small');
        const verifiedLocation = locationEl ? locationEl.innerText.trim() : '';

        return {
          verifiedName: rawName,
          headline,
          currentCompanyFound,
          verifiedTitle,
          verifiedLocation,
          isFirstDegree: /(?:^|\n)\s*1st\s*(?:\n|$)/i.test(profileHeaderText),
          isPending: Array.from(document.querySelectorAll('main button, main [role="button"]'))
            .some(button => /^\s*pending\s*$/i.test((button.innerText || button.getAttribute('aria-label') || '').trim()))
        };
      }, {
        targetCompany: targetCompanyName
      });

      // Reject active intern, trainee, or student roles during profile verification
      const titleToCheck = `${verificationResult.verifiedTitle || ''} ${verificationResult.headline || ''} ${candidate.jobTitle || ''}`.toLowerCase();
      const withoutEx = titleToCheck.replace(/\b(ex|former)[- ]+([a-z0-9]+[- ]+)?(intern|internship|trainee|student|fellow|apprentice)s?\b/gi, '');
      const internPattern = /\b(interns?|internships?|trainees?|students?|apprentices?(?:ship)?|co-?ops?|freshers?|undergrads?(?:uate)?|aspiring)\b/i;
      if (internPattern.test(withoutEx)) {
        const reason = `Profile indicates an active intern, trainee, or student role ("${verificationResult.verifiedTitle || verificationResult.headline}")`;
        this.logger(`Refusing outreach: ${reason}`, 'warning');
        return { isValid: false, reason, candidate };
      }

      if (discoveredOnCompanyPeoplePage) {
        if (locationFilter && locationFilter.trim()) {
          const profileLoc = verificationResult.verifiedLocation || candidate.location || '';
          if (profileLoc && !LocationMatcher.matchesFilter({ location: profileLoc, verifiedLocation: profileLoc }, locationFilter)) {
            const reason = `Profile location ("${profileLoc}") does not match target location filter ("${locationFilter}")`;
            this.logger(`Refusing outreach: ${reason}`, 'warning');
            return { isValid: false, reason, candidate };
          }
        }

        const verifiedProfileUrl = page.url().split('?')[0].replace(/\/$/, '');
        return {
          isValid: true,
          verifiedName: candidate.personName,
          verifiedTitle: candidate.jobTitle || candidate.headline || '',
          verifiedLocation: verificationResult.verifiedLocation || candidate.location || '',
          verifiedProfileUrl,
          verifiedCompany: targetCompanyName,
          isAlreadyConnected: verificationResult.isFirstDegree,
          isPending: verificationResult.isPending
        };
      }

      if (verificationResult.isPending) {
        return {
          isValid: true,
          verifiedName: verificationResult.verifiedName || candidate.personName,
          verifiedTitle: verificationResult.verifiedTitle || candidate.jobTitle || candidate.headline || '',
          verifiedProfileUrl: page.url().split('?')[0].replace(/\/$/, ''),
          verifiedCompany: targetCompanyName,
          isPending: true,
          isAlreadyConnected: false
        };
      }

      const normalizeName = value => (value || '')
        .toLowerCase()
        .replace(/\([^)]*\)/g, ' ')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
      const expectedName = normalizeName(candidate.personName);
      const verifiedName = normalizeName(verificationResult.verifiedName);

      if (!expectedName || !verifiedName || expectedName !== verifiedName) {
        const reason = `Profile identity did not match candidate "${candidate.personName}" (profile name: "${verificationResult.verifiedName || 'not found'}")`;
        this.logger(`Refusing outreach: ${reason}`, 'warning');
        return { isValid: false, reason, candidate };
      }

      if (!verificationResult.currentCompanyFound) {
        const reason = `Could not verify a current Experience role at "${targetCompanyName}" for ${verificationResult.verifiedName}. Headline alone is not accepted as proof.`;
        this.logger(`Refusing outreach: ${reason}`, 'warning');
        return { isValid: false, reason, candidate };
      }

      if (locationFilter && locationFilter.trim()) {
        const profileLoc = verificationResult.verifiedLocation || candidate.location || '';
        if (profileLoc && !LocationMatcher.matchesFilter({ location: profileLoc, verifiedLocation: profileLoc }, locationFilter)) {
          const reason = `Profile location ("${profileLoc}") does not match target location filter ("${locationFilter}")`;
          this.logger(`Refusing outreach: ${reason}`, 'warning');
          return { isValid: false, reason, candidate };
        }
      }

      const verifiedProfileUrl = page.url().split('?')[0].replace(/\/$/, '');
      return {
        isValid: true,
        verifiedName: verificationResult.verifiedName,
        verifiedTitle: verificationResult.verifiedTitle || candidate.jobTitle || candidate.headline || '',
        verifiedProfileUrl,
        verifiedCompany: targetCompanyName,
        isAlreadyConnected: verificationResult.isFirstDegree,
        isPending: verificationResult.isPending
      };
    } catch (err) {
      this.logger(`Profile verification error for ${candidate.personName}: ${err.message}`, 'error');
      return {
        isValid: false,
        reason: `Profile verification failed; refusing outreach: ${err.message}`,
        candidate
      };
    }
  }
}

module.exports = ProfileVerificationAgent;
