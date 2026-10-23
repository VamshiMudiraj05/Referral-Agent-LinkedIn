/**
 * LocationMatcher - Location normalization, synonym mapping, and filtering
 * for candidate discovery and ranking.
 */

const LOCATION_ALIASES = {
  'usa': ['united states', 'usa', 'u.s.a.', 'u.s.', 'america', 'california', 'texas', 'washington', 'new york', 'florida', 'san francisco', 'bay area', 'seattle', 'chicago', 'boston', 'austin', 'los angeles'],
  'us': ['united states', 'usa', 'u.s.a.', 'u.s.', 'america', 'california', 'texas', 'washington', 'new york', 'florida', 'san francisco', 'bay area', 'seattle', 'chicago', 'boston', 'austin', 'los angeles'],
  'united states': ['united states', 'usa', 'u.s.a.', 'u.s.', 'america', 'california', 'texas', 'washington', 'new york', 'florida', 'san francisco', 'bay area', 'seattle', 'chicago', 'boston', 'austin', 'los angeles'],
  'uk': ['united kingdom', 'uk', 'u.k.', 'england', 'great britain', 'london'],
  'united kingdom': ['united kingdom', 'uk', 'u.k.', 'england', 'great britain'],
  'india': ['india', 'telangana', 'karnataka', 'maharashtra', 'tamil nadu', 'delhi', 'hyderabad', 'bengaluru', 'bangalore', 'mumbai', 'pune', 'chennai', 'gurugram', 'gurgaon', 'noida'],
  'bengaluru': ['bengaluru', 'bangalore'],
  'bangalore': ['bengaluru', 'bangalore'],
  'hyderabad': ['hyderabad', 'telangana', 'secunderabad'],
  'mumbai': ['mumbai', 'bombay'],
  'chennai': ['chennai', 'madras'],
  'kolkata': ['kolkata', 'calcutta'],
  'gurgaon': ['gurgaon', 'gurugram'],
  'gurugram': ['gurgaon', 'gurugram'],
  'san francisco': ['san francisco', 'sf', 'bay area', 'silicon valley'],
  'bay area': ['bay area', 'san francisco', 'silicon valley', 'san jose', 'palo alto', 'mountain view', 'sunnyvale', 'oakland'],
  'sf': ['san francisco', 'bay area', 'silicon valley'],
  'new york': ['new york', 'nyc', 'manhattan', 'brooklyn'],
  'nyc': ['new york', 'nyc', 'manhattan'],
  'seattle': ['seattle', 'greater seattle area', 'bellevue', 'redmond'],
  'remote': ['remote', 'work from home', 'anywhere']
};

class LocationMatcher {
  /**
   * Check if a candidate matches the specified location filter
   * @param {Object} candidate
   * @param {string} targetFilter
   * @returns {boolean}
   */
  static matchesFilter(candidate, targetFilter = '') {
    const filter = (targetFilter || '').trim().toLowerCase();
    if (!filter || filter === 'all' || filter === 'any' || filter === 'worldwide' || filter === 'global') {
      return true;
    }

    const locCandidate = (candidate.location || '').toLowerCase();
    const verifiedLoc = (candidate.verifiedLocation || '').toLowerCase();
    const cardText = (candidate.cardText || '').toLowerCase();
    const subline = (candidate.subline || '').toLowerCase();
    const headline = (candidate.headline || candidate.jobTitle || '').toLowerCase();

    const haystack = `${locCandidate} ${verifiedLoc} ${cardText} ${subline} ${headline}`.trim();
    if (!haystack) return false;

    // Direct substring match
    if (haystack.includes(filter)) {
      return true;
    }

    // Check alias list for the filter
    const aliases = LOCATION_ALIASES[filter];
    if (aliases && aliases.length > 0) {
      for (const alias of aliases) {
        if (haystack.includes(alias)) {
          return true;
        }
      }
    }

    // Check word-by-word if target filter is multi-word (e.g. "Hyderabad, India" or "San Francisco, CA")
    const words = filter.split(/[\s,]+/).filter(w => w.length > 2);
    if (words.length > 0 && words.every(word => haystack.includes(word))) {
      return true;
    }

    return false;
  }

  /**
   * Extract best-effort location string from candidate card text
   * @param {string} cardText
   * @param {string} rawLocationFromSelector
   * @returns {string}
   */
  static extractLocationFromCard(cardText = '', rawLocationFromSelector = '') {
    if (rawLocationFromSelector && rawLocationFromSelector.trim()) {
      return rawLocationFromSelector.trim();
    }

    if (!cardText) return '';

    const lines = cardText.split('\n').map(l => l.trim()).filter(Boolean);
    const locationIndicators = [
      'area', 'region', 'city', 'india', 'united states', 'usa', 'uk', 'canada',
      'germany', 'australia', 'singapore', 'remote', 'telangana', 'karnataka',
      'maharashtra', 'california', 'texas', 'hyderabad', 'bengaluru', 'bangalore',
      'mumbai', 'pune', 'chennai', 'delhi', 'seattle', 'francisco', 'york'
    ];

    for (const line of lines) {
      const lower = line.toLowerCase();
      // Skip known non-location lines
      if (lower.includes('mutual') || lower.includes('connection') || lower.includes('connect') ||
          lower.includes('message') || lower.includes('pending') || lower.match(/^(1st|2nd|3rd\+?)$/i)) {
        continue;
      }
      if (line.includes(',') || locationIndicators.some(ind => lower.includes(ind))) {
        return line;
      }
    }

    return '';
  }
}

module.exports = LocationMatcher;
