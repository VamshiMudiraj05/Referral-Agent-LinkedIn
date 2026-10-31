const LocationMatcher = require('./LocationMatcher');
const GenderDetector = require('./GenderDetector');

class PeopleDiscoveryAgent {
  constructor(browserController, safetyController, logger = console.log) {
    this.browser = browserController;
    this.safety = safetyController;
    this.logger = logger;
  }

  async discoverPeople(companyUrl, targetKeywords = ['Talent Acquisition', 'Recruiter', 'Software Engineer', 'QA Engineer', 'Alumni'], maxCandidates = 80, locationFilter = '') {
    const page = this.browser.page;
    if (!page) throw new Error('Browser page not available');

    // Ensure URL points to people tab
    const matchCompany = companyUrl.match(/(https:\/\/[^/]+\/company\/[^/?#]+)/);
    const cleanBaseUrl = matchCompany ? matchCompany[1] : companyUrl.replace(/\/$/, '');
    const peopleUrl = `${cleanBaseUrl}/people/`;

    this.logger(`Navigating to People section: ${peopleUrl}`);

    // Navigate to People section via in-page navigation or direct goto (avoids sticky header click interception & SPA abortion)
    try {
      await page.evaluate((url) => { window.location.href = url; }, peopleUrl);
      await page.waitForTimeout(2500);
    } catch (e) {
      await page.goto(peopleUrl, { waitUntil: 'domcontentloaded', timeout: 35000 }).catch(() => {});
    }

    if (!page.url().includes('/people')) {
      await page.goto(peopleUrl, { waitUntil: 'domcontentloaded', timeout: 35000 }).catch(() => {});
      await page.waitForTimeout(2000);
    }
    
    // Wait for employee cards to render on People tab
    await page.waitForSelector('a[href*="/in/"]', { timeout: 15000 }).catch(() => null);
    await page.waitForTimeout(2500);

    if (await this.safety.checkSecurityChallenge(page)) {
      throw new Error(this.safety.pauseReason);
    }

    const allDiscovered = new Map();

    // Strategy A: Collect visible employees from default People view by progressive scrolling and clicking Show More
    this.logger(`Collecting employee profiles until reaching target pool (goal: ${maxCandidates})...`);
    await this.scrollAndCollect(page, allDiscovered, maxCandidates);

    // Strategy B: If we still need more candidates to meet quota, use the People search input
    if (allDiscovered.size < maxCandidates) {
      const activeKeywords = locationFilter && locationFilter.trim()
        ? [locationFilter.trim(), ...targetKeywords]
        : targetKeywords;

      for (const kw of activeKeywords) {
        if (allDiscovered.size >= maxCandidates) break;
        try {
          this.logger(`Applying People filter keyword: "${kw}"`);
          const searchInput = await page.$('input#people-search-keywords, input[placeholder*="Search employees"], input[aria-label*="Search employees"]');
          if (searchInput) {
            await searchInput.click();
            await page.keyboard.press('ControlOrMeta+A');
            await page.keyboard.press('Backspace');
            await searchInput.type(kw, { delay: 40 });
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);
            await this.scrollAndCollect(page, allDiscovered, maxCandidates);
          }
        } catch (e) {
          this.logger(`Keyword filter notice for "${kw}": ${e.message}`);
        }
      }
    }

    const candidates = Array.from(allDiscovered.values());
    this.logger(`✓ Total employees discovered in People section: ${candidates.length}`, 'success');
    return candidates;
  }

  async scrollAndCollect(page, map, maxLimit) {
    let previousCount = 0;
    let noChangeCycles = 0;

    for (let scroll = 0; scroll < 20; scroll++) {
      if (map.size >= maxLimit) break;

      const extracted = await page.evaluate(() => {
        const items = [];
        
        // Find all links to member profiles (/in/) strictly outside of header navigation
        const allInLinks = Array.from(document.querySelectorAll('a[href*="/in/"]'));
        
        // Filter out nav bar links
        const validLinks = allInLinks.filter(l => {
          return !l.closest('nav') && !l.closest('#global-nav') && !l.closest('header');
        });

        const seenProfiles = new Set();

        for (const link of validLinks) {
          try {
            const rawHref = link.getAttribute('href') || '';
            const matchIn = rawHref.match(/\/in\/([^/?#]+)/);
            if (!matchIn) continue;

            const slug = matchIn[1];
            if (slug.includes('unavailable') || slug.includes('me')) continue;

            const profileUrl = `https://www.linkedin.com/in/${slug}/`;
            if (seenProfiles.has(profileUrl)) continue;

            // Find surrounding card container
            const card = link.closest('li') || link.closest('.artdeco-card') || link.closest('div[data-view-name*="profile"]') || link.parentElement?.parentElement?.parentElement;
            if (!card) continue;

            const cardText = card.innerText || '';
            const lowerCard = cardText.toLowerCase();

            // Extract Name
            let name = '';
            const nameEl = card.querySelector('.org-people-profile-card__profile-title, .artdeco-entity-lockup__title, span[dir="ltr"], h3');
            if (nameEl) {
              name = nameEl.innerText.split('\n')[0].trim();
            }
            if (!name) {
              name = link.innerText.split('\n')[0].trim();
            }

            // Clean name from degree indicators like " • 2nd" or badges
            name = name.replace(/\s*•\s*(1st|2nd|3rd\+?).*$/i, '').trim();

            if (!name || name.length < 2 || name.toLowerCase().includes('linkedin member') || name.toLowerCase().includes('connect')) {
              continue;
            }

            // Extract headline / job title
            let headline = '';
            const headlineEl = card.querySelector('.artdeco-entity-lockup__subtitle, .org-people-profile-card__profile-position, div.t-14.t-black--light');
            if (headlineEl) {
              const text = headlineEl.innerText.trim();
              if (text && !text.toLowerCase().includes("degree connection") && !text.match(/^(·|\s)*(1st|2nd|3rd\+?)$/i)) {
                headline = text;
              }
            }
            if (!headline || headline.toLowerCase().includes("degree connection") || headline.match(/^(·|\s)*(1st|2nd|3rd\+?)$/i)) {
              const cardLines = cardText.split('\n')
                .map(l => l.trim())
                .filter(l => l.length > 0 && l !== name
                  && !l.toLowerCase().includes("degree connection")
                  && !l.match(/^(·|\s)*(1st|2nd|3rd\+?)$/i)
                  && !l.toLowerCase().includes("mutual")
                  && !l.toLowerCase().includes("shared connection")
                  && l.toLowerCase() !== "connect"
                  && l.toLowerCase() !== "message"
                  && l.toLowerCase() !== "pending");
              headline = cardLines[0] || '';
            }

            // Only treat an explicit connection degree or pending label as a status.
            const degreeMatch = cardText.match(/(?:^|\n)\s*(1st|2nd|3rd\+?)\s*(?:\n|$)/i);
            const is1st = degreeMatch?.[1].toLowerCase() === '1st';
            const isPending = /\b(pending|invitation sent)\b/i.test(cardText);

            // Detect Mutual Connections and Same College Alumni
            const isMutual = lowerCard.includes('mutual connection') || lowerCard.includes('shared connection') || lowerCard.includes('2nd');
            const isAlumni = lowerCard.includes('school') || lowerCard.includes('college') || lowerCard.includes('alumni') || lowerCard.includes('university') || lowerCard.includes('hired here') || lowerCard.includes('studied at');

            // Subline / badge info
            const badgeEl = card.querySelector('.member-insights__insight, .insight-text, .artdeco-entity-lockup__badge');
            const subline = badgeEl ? badgeEl.innerText.trim() : '';

            // Location element if present on People card
            const locEl = card.querySelector('.org-people-profile-card__profile-location, .artdeco-entity-lockup__caption, .entity-result__secondary-subtitle, div[class*="location"]');
            const rawLocation = locEl ? locEl.innerText.trim() : '';

            // Avatar image
            const imgEl = card.querySelector('img[src*="media.licdn.com"], img');
            const avatar = imgEl ? imgEl.getAttribute('src') : '';

            seenProfiles.add(profileUrl);
            items.push({
              personName: name,
              headline: headline || '',
              jobTitle: headline || '',
              profileUrl,
              avatar,
              isAlreadyConnected: is1st,
              isPending,
              isMutual,
              isAlumni,
              subline,
              rawLocation,
              cardText: cardText.substring(0, 300),
              degree: degreeMatch?.[1] || 'unknown'
            });
          } catch (e) {
            // ignore single card parse error
          }
        }

        return items;
      });

      for (const item of extracted) {
        if (!map.has(item.profileUrl)) {
          const loc = LocationMatcher.extractLocationFromCard(item.cardText, item.rawLocation);
          const genderInfo = GenderDetector.detectGender(item);
          map.set(item.profileUrl, {
            ...item,
            location: loc,
            gender: genderInfo.gender,
            pronouns: genderInfo.pronouns,
            genderConfidence: genderInfo.confidence
          });
        }
      }

      if (map.size >= maxLimit) break;

      // Check and click "Show more results" button if present on page
      const clickedShowMore = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const showMoreBtn = btns.find(b => {
          const t = b.innerText.toLowerCase().trim();
          return t.includes('show more results') || t.includes('see more results') || t.includes('show more');
        });
        if (showMoreBtn && showMoreBtn.offsetParent !== null) {
          showMoreBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          showMoreBtn.click();
          return true;
        }
        return false;
      });

      if (clickedShowMore) {
        this.logger(`Loading next batch of employees (discovered: ${map.size}/${maxLimit})...`);
        await page.waitForTimeout(2000);
        noChangeCycles = 0;
        previousCount = map.size;
        continue;
      }

      if (map.size === previousCount) {
        noChangeCycles++;
        if (noChangeCycles >= 3) break;
      } else {
        noChangeCycles = 0;
      }
      previousCount = map.size;

      // Scroll down smoothly to trigger dynamic load
      await page.evaluate(() => {
        window.scrollBy({ top: 1200, behavior: 'smooth' });
      });
      await page.waitForTimeout(1200);
    }
  }
}

module.exports = PeopleDiscoveryAgent;
