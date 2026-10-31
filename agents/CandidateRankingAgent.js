const LocationMatcher = require('./LocationMatcher');
const GenderDetector = require('./GenderDetector');

class CandidateRankingAgent {
  constructor(strategy = 'mutuals_alumni_first') {
    this.strategy = strategy; // 'mutuals_alumni_first' | 'hr_first' | 'it_first' | 'combined'
    this.locationFilter = '';
    this.genderFilter = 'all'; // 'all' | 'female' | 'male'

    // HR & Talent Acquisition keywords
    this.hrKeywords = [
      'recruiter', 'technical recruiter', 'talent acquisition', 'talent partner',
      'talent specialist', 'talent advisor', 'talent scout', 'sourcer', 'recruiting',
      'recruitment', 'head of talent', 'talent lead', 'people operations', 'campus recruiter',
      'university recruiter', 'talent lead', 'hiring', 'talent manager', 'hr manager',
      'human resources', 'talent associate', 'recruiting coordinator'
    ];

    // IT & Software Engineering keywords
    this.techKeywords = [
      'software engineer', 'software developer', 'developer', 'full stack',
      'backend', 'frontend', 'web developer', 'mobile developer', 'ios developer',
      'android developer', 'java developer', 'python developer', 'react developer',
      'node developer', 'devops', 'cloud engineer', 'data engineer', 'data scientist',
      'machine learning', 'ml engineer', 'ai engineer', 'qa engineer', 'test engineer',
      'automation engineer', 'quality assurance', 'sdet', 'software test',
      'engineering manager', 'tech lead', 'technical lead', 'solution architect',
      'cloud architect', 'software architect', 'technology manager', 'it manager',
      'infrastructure', 'cybersecurity', 'security engineer', 'systems engineer',
      'site reliability', 'sre', 'platform engineer', 'systems architect',
      'engineering director', 'vp of engineering', 'head of engineering', 'cto',
      'mts', 'smts', 'member of technical staff', 'technical staff', 'support engineer',
      'solutions engineer', 'solutions architect', 'firmware', 'embedded'
    ];

    // Excluded keywords (Sales, Marketing, Finance, Legal, etc.)
    this.excludedKeywords = [
      'sales', 'business development', 'bdr', 'sdr', 'account executive',
      'account manager', 'enterprise sales', 'inside sales', 'commercial',
      'revenue', 'partnerships', 'accounting', 'accountant', 'payroll',
      'finance', 'financial', 'legal', 'attorney', 'lawyer', 'compliance',
      'procurement', 'purchasing', 'buyer', 'office manager', 'receptionist',
      'marketing', 'seo', 'content writer', 'copywriter', 'graphic designer',
      'art director', 'medical', 'nurse', 'manufacturing'
    ];

    // Restricted intern and trainee keywords
    this.internKeywords = [
      'intern', 'internship', 'trainee', 'student', 'apprentice', 'apprenticeship',
      'fellow', 'fellowship', 'co-op', 'coop', 'fresher', 'graduate trainee',
      'management trainee', 'undergraduate', 'aspiring developer', 'aspiring engineer'
    ];
  }

  isInternOrTrainee(text = '') {
    if (!text) return false;
    const clean = text.toLowerCase();
    // Strip out 'ex-' or 'former' clauses like 'ex-intern', 'ex-sde intern', 'former intern'
    const withoutEx = clean.replace(/\b(ex|former)[- ]+([a-z0-9]+[- ]+)?(intern|internship|trainee|student|fellow|apprentice)s?\b/gi, '');
    const internPattern = /\b(interns?|internships?|trainees?|students?|apprentices?(?:ship)?|co-?ops?|freshers?|undergrads?(?:uate)?|aspiring)\b/i;
    return internPattern.test(withoutEx);
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  setLocationFilter(location) {
    this.locationFilter = (location || '').trim();
  }

  setGenderFilter(gender) {
    this.genderFilter = (gender || 'all').toLowerCase().trim();
  }

  isExcluded(title = '', extraContext = '') {
    const lower = title.toLowerCase();

    // 1. Strictly exclude any intern, trainee, student, or apprentice role
    if (this.isInternOrTrainee(title) || (extraContext && this.isInternOrTrainee(extraContext))) {
      return { excluded: true, isInternOrTrainee: true, reason: 'Intern / Trainee / Student role restricted' };
    }

    // Strip company references like "salesforce" so company name doesn't trigger excluded keyword "sales"
    const cleanLower = lower.replace(/\bsalesforce\b/gi, '').trim();

    // 2. Check if it's an excluded department (Sales, Finance, Marketing, Legal, etc.)
    for (const kw of this.excludedKeywords) {
      const kwRegex = new RegExp('\\b' + kw + '\\b', 'i');
      if (kwRegex.test(cleanLower)) {
        // Exception: if it's a software engineer or developer or architect or technical lead or recruiter, it's NOT an excluded department!
        const isTech = this.techKeywords.some(k => cleanLower.includes(k)) ||
                       /\b(engineer|developer|architect|tech lead|sdet|mts|smts)\b/i.test(cleanLower);
        const isRecruiter = this.hrKeywords.some(k => cleanLower.includes(k)) ||
                            /\b(recruiter|sourcer|talent)\b/i.test(cleanLower);
        if (isTech || isRecruiter) {
          return { excluded: false };
        }
        return { excluded: true, reason: `Excluded department: ${kw}` };
      }
    }

    // 3. Must be an HR/Talent or IT/Engineering role
    const isHrOrTech = this.hrKeywords.some(k => lower.includes(k)) || 
                       this.techKeywords.some(k => lower.includes(k)) ||
                       /\b(engineer|developer|recruiter|qa|test|architect|mts|smts|tech|engineering)\b/i.test(lower);

    if (!isHrOrTech) {
      return { excluded: true, reason: 'Not an HR/Talent or IT/Engineering role' };
    }

    return { excluded: false };
  }

  classifyDepartment(title = '') {
    const lower = title.toLowerCase();

    for (const kw of this.hrKeywords) {
      if (lower.includes(kw)) return 'HR / Talent';
    }

    for (const kw of this.techKeywords) {
      if (lower.includes(kw)) return 'IT / Engineering';
    }

    if (lower.includes('engineer') || lower.includes('developer') || lower.includes('tech') || lower.includes('qa') || lower.includes('test')) {
      return 'IT / Engineering';
    }

    if (lower.includes('talent') || lower.includes('recruit') || lower.includes('people') || lower.includes('hr')) {
      return 'HR / Talent';
    }

    return 'Other';
  }

  calculateSeniorityScore(title = '') {
    const lower = title.toLowerCase();
    if (lower.includes('vp') || lower.includes('vice president') || lower.includes('director') || lower.includes('head of')) {
      return { score: 25, level: 'Director / Head' };
    }
    if (lower.includes('lead') || lower.includes('manager') || lower.includes('principal') || lower.includes('staff')) {
      return { score: 20, level: 'Lead / Manager' };
    }
    if (lower.includes('senior') || lower.includes('sr.') || lower.includes('sr ')) {
      return { score: 15, level: 'Senior' };
    }
    return { score: 10, level: 'Mid-level' };
  }

  scoreCandidate(candidate) {
    const title = candidate.jobTitle || candidate.headline || '';
    const combinedText = `${candidate.personName} ${candidate.headline} ${candidate.jobTitle} ${candidate.subline || ''} ${candidate.cardText || ''}`.toLowerCase();
    
    // Check exclusion (passing title and headline/subline context)
    const exclusionCheck = this.isExcluded(title, candidate.headline || candidate.subline || '');

    // Interns / Trainees / Students are STRICTLY restricted and NEVER bypassed by alumni status
    if (exclusionCheck.isInternOrTrainee) {
      return {
        ...candidate,
        department: 'Excluded',
        score: 0,
        isExcluded: true,
        exclusionReason: exclusionCheck.reason,
        seniorityLevel: 'N/A',
        isMutual: false,
        isAlumni: false,
        breakdown: { department: 0, seniority: 0, connection: 0, mutual: 0, alumni: 0 }
      };
    }

    const isAlumni = candidate.isAlumni ||
      combinedText.includes('school') ||
      combinedText.includes('college') ||
      combinedText.includes('alumni') ||
      combinedText.includes('university') ||
      combinedText.includes('studied at') ||
      combinedText.includes('hired here');

    if (exclusionCheck.excluded && !isAlumni) {
      return {
        ...candidate,
        department: 'Excluded',
        score: 0,
        isExcluded: true,
        exclusionReason: exclusionCheck.reason,
        seniorityLevel: 'N/A',
        isMutual: false,
        isAlumni: false,
        breakdown: { department: 0, seniority: 0, connection: 0, mutual: 0, alumni: 0 }
      };
    }

    const dept = this.classifyDepartment(title);
    let deptScore = 0;
    if (this.strategy === 'hr_first') {
      if (dept === 'HR / Talent') deptScore = 50;
      else if (dept === 'IT / Engineering') deptScore = 45;
      else deptScore = 20;
    } else {
      // Tech-first prioritization for 'mutuals_alumni_first', 'it_first', and default
      if (dept === 'IT / Engineering') deptScore = 50;
      else if (dept === 'HR / Talent') deptScore = 40;
      else deptScore = 20;
    }

    const seniority = this.calculateSeniorityScore(title);
    const seniorityScore = seniority.score;

    // Detect Mutual Connections & College Alumni from candidate headline, card text, or properties
    const isMutual = candidate.isMutual || 
                     combinedText.includes('mutual connection') || 
                     combinedText.includes('mutual') ||
                     (candidate.degree === '2nd');

    // Massive priority boosts for Mutual Connections and Same College Alumni
    let mutualScore = isMutual ? 40 : 0;
    let alumniScore = isAlumni ? 40 : 0;

    const baseScore = deptScore + seniorityScore;
    const totalScore = Math.min(100, Math.max(10, baseScore + mutualScore + alumniScore));

    // Gender detection
    const genderInfo = GenderDetector.detectGender(candidate);
    const detectedGender = candidate.gender || genderInfo.gender;
    const pronouns = candidate.pronouns || genderInfo.pronouns;

    // Location detection
    const candidateLocation = candidate.location || LocationMatcher.extractLocationFromCard(candidate.cardText || '', candidate.rawLocation || '');

    // Gender Filter check
    if (this.genderFilter && this.genderFilter !== 'all') {
      const matchesGender = GenderDetector.matchesFilter({ ...candidate, gender: detectedGender }, this.genderFilter);
      if (!matchesGender) {
        return {
          ...candidate,
          gender: detectedGender,
          pronouns,
          genderConfidence: genderInfo.confidence,
          location: candidateLocation,
          department: dept,
          score: 0,
          isExcluded: true,
          exclusionReason: `Does not match target gender filter (${this.genderFilter})`,
          seniorityLevel: seniority.level,
          isMutual,
          isAlumni,
          breakdown: { department: 0, seniority: 0, connection: 0, mutual: 0, alumni: 0 }
        };
      }
    }

    // Location Filter check
    let locationScoreBonus = 0;
    if (this.locationFilter && this.locationFilter.trim()) {
      const matchesLoc = LocationMatcher.matchesFilter({ ...candidate, location: candidateLocation }, this.locationFilter);
      const hasExplicitLocation = !!candidateLocation;

      // Only exclude if the card explicitly states a location that conflicts with filter
      if (hasExplicitLocation && !matchesLoc) {
        return {
          ...candidate,
          gender: detectedGender,
          pronouns,
          genderConfidence: genderInfo.confidence,
          location: candidateLocation,
          department: dept,
          score: 0,
          isExcluded: true,
          exclusionReason: `Explicit location ("${candidateLocation}") does not match location filter ("${this.locationFilter}")`,
          seniorityLevel: seniority.level,
          isMutual,
          isAlumni,
          breakdown: { department: 0, seniority: 0, connection: 0, mutual: 0, alumni: 0 }
        };
      }

      // If candidate card explicitly matches, prioritize with high score boost
      if (hasExplicitLocation && matchesLoc) {
        locationScoreBonus = 25;
      }
    }

    const finalScore = Math.min(100, totalScore + locationScoreBonus);

    return {
      ...candidate,
      gender: detectedGender,
      pronouns,
      genderConfidence: genderInfo.confidence,
      location: candidateLocation,
      department: dept,
      score: finalScore,
      seniorityLevel: seniority.level,
      isMutual,
      isAlumni,
      isExcluded: false,
      breakdown: {
        department: deptScore,
        seniority: seniorityScore,
        mutual: mutualScore,
        alumni: alumniScore
      }
    };
  }

  rankCandidates(candidates, historyManager = null, companyName = '') {
    // 1. Score each candidate
    const scored = candidates.map(c => this.scoreCandidate(c));

    // 2. Filter out non-HR and non-IT candidates (and all excluded candidates)
    const valid = scored.filter(c => !c.isExcluded
      && (c.department === 'HR / Talent' || c.department === 'IT / Engineering' || c.isAlumni));

    // 3. Deduplicate by profileUrl / name
    const seen = new Set();
    const unique = [];
    for (const c of valid) {
      const key = (c.profileUrl || c.personName || '').toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(c);
      }
    }

    // 4. Check already connected / pending / duplicate in history
    const annotated = unique.map(c => {
      let isAlreadyConnected = c.isAlreadyConnected || false;
      let isPending = c.isPending || false;

      if (historyManager && c.profileUrl) {
        if (historyManager.isDuplicate(c.profileUrl, companyName, c.personName)) {
          isAlreadyConnected = true;
        }
      }
      return {
        ...c,
        isAlreadyConnected,
        isPending
      };
    });

    // 5. Partition based on user priority:
    // First priority: Mutuals and Alumni
    const mutualsAndAlumni = annotated.filter(c => c.isMutual || c.isAlumni)
      .sort((a, b) => b.score - a.score);

    const nonMutualsAlumni = annotated.filter(c => !c.isMutual && !c.isAlumni);

    const itCandidates = nonMutualsAlumni.filter(c => c.department === 'IT / Engineering')
      .sort((a, b) => b.score - a.score);

    const hrCandidates = nonMutualsAlumni.filter(c => c.department === 'HR / Talent')
      .sort((a, b) => b.score - a.score);

    let sorted = [];

    if (this.strategy === 'hr_first') {
      // HR first, then IT
      const allHr = annotated.filter(c => c.department === 'HR / Talent').sort((a, b) => b.score - a.score);
      const allIt = annotated.filter(c => c.department === 'IT / Engineering').sort((a, b) => b.score - a.score);
      sorted = [...allHr, ...allIt];
    } else if (this.strategy === 'it_first') {
      // Engineering & Tech first, then HR
      const allIt = annotated.filter(c => c.department === 'IT / Engineering').sort((a, b) => b.score - a.score);
      const allHr = annotated.filter(c => c.department === 'HR / Talent').sort((a, b) => b.score - a.score);
      sorted = [...allIt, ...allHr];
    } else {
      // User requirement: Mutuals -> Tech people -> Last HR (default and 'mutuals_alumni_first')
      const techMutuals = mutualsAndAlumni.filter(c => c.department === 'IT / Engineering');
      const otherMutuals = mutualsAndAlumni.filter(c => c.department !== 'IT / Engineering' && c.department !== 'HR / Talent');
      const hrMutuals = mutualsAndAlumni.filter(c => c.department === 'HR / Talent');

      const sortedMutuals = [...techMutuals, ...otherMutuals, ...hrMutuals];
      sorted = [...sortedMutuals, ...itCandidates, ...hrCandidates];
    }

    // Attach priority index
    return sorted.map((candidate, idx) => ({
      ...candidate,
      priorityRank: idx + 1
    }));
  }
}

module.exports = CandidateRankingAgent;
