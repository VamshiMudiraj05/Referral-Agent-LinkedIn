class CompanyDiscoveryAgent {
  constructor(browserController, safetyController, logger = console.log) {
    this.browser = browserController;
    this.safety = safetyController;
    this.logger = logger;
  }

  async findOfficialCompanyPage(companyName) {
    const page = this.browser.page;
    if (!page) throw new Error('Browser page not available');

    this.logger(`Searching LinkedIn for official company page: "${companyName}"...`);
    
    // Safety check first
    if (await this.safety.checkSecurityChallenge(page)) {
      throw new Error(this.safety.pauseReason);
    }

    // Direct search URL for companies
    const searchUrl = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(companyName)}&origin=GLOBAL_SEARCH_HEADER`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
    
    // Wait for client-side search results to render
    await page.waitForSelector('a[href*="/company/"]', { timeout: 12000 }).catch(() => null);
    await page.waitForTimeout(2500);

    if (await this.safety.checkSecurityChallenge(page)) {
      throw new Error(this.safety.pauseReason);
    }

    // Scrape candidate company cards from search results using universal selectors
    let companies = await page.evaluate((targetName) => {
      const results = [];
      const cleanTarget = targetName.toLowerCase().trim();

      // Find all anchor links pointing to a LinkedIn company
      const allLinks = Array.from(document.querySelectorAll('a[href*="/company/"]'));
      const seenUrls = new Set();

      for (const link of allLinks) {
        try {
          const rawHref = link.getAttribute('href') || '';
          // Extract company slug
          const matchSlug = rawHref.match(/\/company\/([^/?#]+)/);
          if (!matchSlug) continue;

          const slug = matchSlug[1].toLowerCase();
          // Filter out auxiliary subpages like /company/setup/
          if (slug === 'setup' || slug === 'about' || slug === 'login') continue;

          const canonicalUrl = `https://www.linkedin.com/company/${slug}/`;
          if (seenUrls.has(canonicalUrl)) continue;

          // Find the surrounding card/row container
          const container = link.closest('li') || link.closest('div[data-view-name]') || link.parentElement?.parentElement;
          const containerText = container ? container.innerText : link.innerText;

          // Determine company title
          let nameText = link.innerText.split('\n')[0].trim();
          if (!nameText || nameText.length < 2) {
            // Check for title element in container
            const titleEl = container?.querySelector('h2, h3, [class*="title"], [data-view-name*="title"]');
            if (titleEl) nameText = titleEl.innerText.split('\n')[0].trim();
          }

          if (!nameText || nameText.toLowerCase().includes('follow') || nameText.includes('followers')) {
            // Skip non-title link
            continue;
          }

          // Parse followers count
          let followers = 0;
          const matchFollowers = containerText.match(/([\d,.]+)\s*(k|m|million|thousand)?\s*followers/i);
          if (matchFollowers) {
            let num = parseFloat(matchFollowers[1].replace(/,/g, ''));
            const unit = (matchFollowers[2] || '').toLowerCase();
            if (unit === 'k' || unit === 'thousand') num *= 1000;
            if (unit === 'm' || unit === 'million') num *= 1000000;
            followers = Math.round(num);
          }

          // Check verified badge
          const isVerified = containerText.includes('Verified') || container?.querySelector('svg[aria-label*="Verified"], [data-test-icon*="verified"]') !== null;

          // Check if recruiter/agency or fan page in title
          const lowerName = nameText.toLowerCase();
          const lowerText = containerText.toLowerCase();
          const isAgency = lowerName.includes('staffing') || lowerName.includes('recruitment') || lowerName.includes('jobs') || lowerText.includes('staffing agency');
          const isFanPage = lowerName.includes('fan club') || lowerName.includes('community') || lowerName.includes('unofficial');

          // Match score calculation
          let matchScore = 0;
          if (lowerName === cleanTarget) matchScore += 100;
          else if (lowerName.startsWith(cleanTarget)) matchScore += 65;
          else if (lowerName.includes(cleanTarget)) matchScore += 40;

          if (isVerified) matchScore += 35;

          if (followers > 500000) matchScore += 60;
          else if (followers > 100000) matchScore += 45;
          else if (followers > 10000) matchScore += 25;
          else if (followers > 1000) matchScore += 10;

          if (isAgency) matchScore -= 80;
          if (isFanPage) matchScore -= 90;

          seenUrls.add(canonicalUrl);
          results.push({
            name: nameText,
            url: canonicalUrl,
            slug,
            followers,
            isVerified,
            matchScore,
            isAgency,
            isFanPage,
            textSummary: containerText.substring(0, 160)
          });
        } catch (e) {
          // ignore single item parse error
        }
      }

      return results;
    }, companyName);

    this.logger(`Found ${companies.length} potential company listings in LinkedIn search.`);

    // If search results evaluation found no items (e.g. DOM timing or LinkedIn UI variations), try direct company URL fallback
    if (!companies || companies.length === 0) {
      const fallbackSlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const fallbackUrl = `https://www.linkedin.com/company/${fallbackSlug}/`;
      this.logger(`Attempting direct fallback verification at: ${fallbackUrl}...`);

      try {
        await page.goto(fallbackUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await page.waitForTimeout(2000);

        const pageTitle = await page.title();
        const currentUrl = page.url();

        if (currentUrl.includes('/company/') && !currentUrl.includes('/404') && !currentUrl.includes('/unavailable')) {
          this.logger(`✓ Found official company page via direct slug: ${currentUrl}`, 'success');
          companies = [{
            name: companyName,
            url: currentUrl.split('?')[0].replace(/\/$/, '') + '/',
            followers: 0,
            matchScore: 100
          }];
        }
      } catch (e) {
        this.logger(`Direct fallback notice: ${e.message}`);
      }
    }

    if (!companies || companies.length === 0) {
      throw new Error(`No company pages found for "${companyName}". Please check the spelling or company name.`);
    }

    // Sort by match score descending
    companies.sort((a, b) => b.matchScore - a.matchScore);
    const topCandidate = companies[0];

    this.logger(`Selected official candidate: "${topCandidate.name}" (~${(topCandidate.followers || 0).toLocaleString()} followers) -> ${topCandidate.url}`);

    // Navigate to company page to extract full official details
    await page.goto(topCandidate.url, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await page.waitForTimeout(2000);

    if (await this.safety.checkSecurityChallenge(page)) {
      throw new Error(this.safety.pauseReason);
    }

    const officialDetails = await page.evaluate((topCand) => {
      // Scrape header details
      const h1 = document.querySelector('h1.org-top-card-summary__title, h1');
      const name = h1 ? h1.innerText.trim() : topCand.name;

      const infoItems = Array.from(document.querySelectorAll('.org-top-card-summary-info-list__info-item, .org-top-card-summary__info-item, div.org-top-card-summary-info-list span'))
        .map(el => el.innerText.trim());

      const taglineEl = document.querySelector('.org-top-card-summary__tagline, p.org-top-card-summary__tagline');
      const tagline = taglineEl ? taglineEl.innerText.trim() : '';

      // Extract website link
      const websiteLinkEl = document.querySelector('a[data-field="website"], a.org-top-card-primary-actions__action--website, a[href*="http"]:not([href*="linkedin.com"])');
      const website = websiteLinkEl ? websiteLinkEl.getAttribute('href') : '';

      return {
        name,
        officialUrl: window.location.href.split('?')[0].replace(/\/$/, '') + '/',
        industry: infoItems[0] || 'IT Services and IT Consulting',
        location: infoItems[1] || 'Global',
        followers: topCand.followers || 0,
        tagline: tagline || '',
        website: website || ''
      };
    }, topCandidate);

    this.logger(`✓ Official Company Page Verified: ${officialDetails.name}`, 'success');
    return officialDetails;
  }
}

module.exports = CompanyDiscoveryAgent;
