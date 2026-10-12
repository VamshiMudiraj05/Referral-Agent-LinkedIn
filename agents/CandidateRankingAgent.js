class CandidateRankingAgent {
  constructor(strategy = 'mutuals_alumni_first') {
    this.strategy = strategy; // 'mutuals_alumni_first' | 'hr_first' | 'it_first' | 'combined'

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
      'engineering director', 'vp of engineering', 'head of engineering', 'cto'
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

    this.internKeywords = ['trainee', 'student'];
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  isExcluded(title = '') {
    const lower = title.toLowerCase();

    // Check if it's purely a trainee/student
    if (this.internKeywords.some(k => lower.includes(k)) && !lower.includes('engineer') && !lower.includes('developer')) {
      return { excluded: true, reason: 'Non-technical trainee' };
    }

    // Check if it's an excluded role (Sales, Finance, Marketing, Legal, etc.)
    const isHrOrTech = this.hrKeywords.some(k => lower.includes(k)) || 
                       this.techKeywords.some(k => lower.includes(k)) ||
                       lower.includes('engineer') || lower.includes('developer') || lower.includes('recruiter');

    if (!isHrOrTech) {
      return { excluded: true, reason: 'Not an HR/Talent or IT/Engineering role' };
    }

    // Explicitly exclude pure sales/marketing even if title has ambiguous terms
    for (const kw of this.excludedKeywords) {
      if (lower.includes(kw)) {
        // Exception: if it's "Technical Recruiter" or "Sales Recruiter", it's still a recruiter!
        const isRecruiter = this.hrKeywords.some(k => lower.includes(k));
        if (isRecruiter) {
          return { excluded: false };
        }
        return { excluded: true, reason: `Excluded department: ${kw}` };
      }
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
    const isAlumni = candidate.isAlumni ||
      combinedText.includes('school') ||
      combinedText.includes('college') ||
      combinedText.includes('alumni') ||
      combinedText.includes('university') ||
      combinedText.includes('studied at') ||
      combinedText.includes('hired here');
    const exclusionCheck = this.isExcluded(title);

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
    if (dept === 'HR / Talent') deptScore = 50;
    else if (dept === 'IT / Engineering') deptScore = 45;
    else deptScore = 20;

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

    return {
      ...candidate,
      department: dept,
      score: totalScore,
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

    // 2. Filter out non-HR and non-IT candidates
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

    const hrCandidates = nonMutualsAlumni.filter(c => c.department === 'HR / Talent')
      .sort((a, b) => b.score - a.score);

    const itCandidates = nonMutualsAlumni.filter(c => c.department === 'IT / Engineering')
      .sort((a, b) => b.score - a.score);

    let sorted = [];

    if (this.strategy === 'hr_first') {
      // HR first, then IT, with mutuals/alumni boosted within their departments
      const allHr = annotated.filter(c => c.department === 'HR / Talent').sort((a, b) => b.score - a.score);
      const allIt = annotated.filter(c => c.department === 'IT / Engineering').sort((a, b) => b.score - a.score);
      sorted = [...allHr, ...allIt];
    } else if (this.strategy === 'it_first') {
      // IT first, then HR
      const allIt = annotated.filter(c => c.department === 'IT / Engineering').sort((a, b) => b.score - a.score);
      const allHr = annotated.filter(c => c.department === 'HR / Talent').sort((a, b) => b.score - a.score);
      sorted = [...allIt, ...allHr];
    } else {
      // Default: 'mutuals_alumni_first'
      // 1. ALL Mutuals & Alumni (HR + IT) first!
      // 2. HR / Talent Acquisition
      // 3. IT / Software Engineering
      sorted = [...mutualsAndAlumni, ...hrCandidates, ...itCandidates];
    }

    // Attach priority index
    return sorted.map((candidate, idx) => ({
      ...candidate,
      priorityRank: idx + 1
    }));
  }
}

module.exports = CandidateRankingAgent;
