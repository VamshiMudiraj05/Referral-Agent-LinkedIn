const assert = require('assert');
const MessageAgent = require('./agents/MessageAgent');
const CandidateRankingAgent = require('./agents/CandidateRankingAgent');
const SafetyController = require('./agents/SafetyController');
const HistoryManager = require('./agents/HistoryManager');
const ProfileVerificationAgent = require('./agents/ProfileVerificationAgent');
const OutreachAgent = require('./agents/OutreachAgent');
const WorkflowCoordinator = require('./agents/WorkflowCoordinator');
const path = require('path');
const fs = require('fs');

console.log('🧪 Starting LinkedIn Referral Outreach AI Agent Test Suite...\n');

// 1. MessageAgent Tests
console.log('--- Testing MessageAgent ---');
const msgAgent = new MessageAgent();

const name1 = msgAgent.extractFirstName('Dr. Sarah Williams (She/Her), PMP');
assert.strictEqual(name1, 'Sarah', `Expected 'Sarah' but got '${name1}'`);
console.log('✓ Extracted clean first name from "Dr. Sarah Williams (She/Her), PMP" ->', name1);

const name2 = msgAgent.extractFirstName('David Kumar, AWS Certified Solutions Architect');
assert.strictEqual(name2, 'David', `Expected 'David' but got '${name2}'`);
console.log('✓ Extracted clean first name from "David Kumar, AWS Certified Solutions Architect" ->', name2);

const name3 = msgAgent.extractFirstName('Prof. John-Paul Smith | AI Lead');
assert.strictEqual(name3, 'John-paul', `Expected 'John-paul' but got '${name3}'`);
console.log('✓ Extracted clean first name from "Prof. John-Paul Smith | AI Lead" ->', name3);

const template = "Hi [First Name], I'm currently exploring software opportunities at [Company]. I came across your profile and would really appreciate connecting.";
const generated = msgAgent.generateMessage(template, { personName: 'Sarah Williams' }, 'Microsoft');
assert.strictEqual(generated.message.includes('Hi,'), true);
assert.strictEqual(generated.message.includes('at Microsoft.'), true);
assert.strictEqual(generated.isOverLimit, false);
console.log('✓ Generated personalized message:', generated.message);

// 2. CandidateRankingAgent Tests
console.log('\n--- Testing CandidateRankingAgent ---');
const rankingAgent = new CandidateRankingAgent('mutuals_alumni_first');

// Test Exclusions (Sales & Finance now excluded)
const salesRole = rankingAgent.scoreCandidate({ personName: 'Bob Sales', jobTitle: 'Enterprise Account Executive' });
assert.strictEqual(salesRole.isExcluded, true);
console.log('✓ Excluded pure sales role:', salesRole.jobTitle);

const financeRole = rankingAgent.scoreCandidate({ personName: 'Alice Finance', jobTitle: 'Finance & Payroll Specialist' });
assert.strictEqual(financeRole.isExcluded, true);
console.log('✓ Excluded finance role:', financeRole.jobTitle);

// Test HR / Talent Acquisition
const hrRecruiter = rankingAgent.scoreCandidate({ personName: 'Sarah Recruiter', jobTitle: 'Senior Technical Recruiter' });
assert.strictEqual(hrRecruiter.isExcluded, false);
assert.strictEqual(hrRecruiter.department, 'HR / Talent');
console.log('✓ Included & classified HR/Talent role:', hrRecruiter.jobTitle, '(Score:', hrRecruiter.score, ')');

// Test Mutuals & Alumni Priority
const alumniDev = { personName: 'Alumni Alex', jobTitle: 'Software Engineer', isAlumni: true, profileUrl: 'https://linkedin.com/in/alumnialex' };
const mutualHr = { personName: 'Mutual Mary', jobTitle: 'Talent Acquisition Partner', isMutual: true, profileUrl: 'https://linkedin.com/in/mutualmary' };
const regularSwe = { personName: 'Clark Kent', jobTitle: 'Senior Software Engineer', profileUrl: 'https://linkedin.com/in/clarkkent' };
const regularRecruiter = { personName: 'Diana Prince', jobTitle: 'Technical Recruiter', profileUrl: 'https://linkedin.com/in/dianaprince' };

const ranked = rankingAgent.rankCandidates([regularSwe, regularRecruiter, alumniDev, mutualHr], null, 'Virtusa');
const alumniOutsideHrIt = rankingAgent.rankCandidates([{
  personName: 'Alumni Pat',
  jobTitle: 'Operations Manager',
  isAlumni: true,
  profileUrl: 'https://linkedin.com/in/alumnipat'
}], null, 'Virtusa');
assert.strictEqual(alumniOutsideHrIt.length, 1, 'Alumni discovered through the company People page should qualify even outside HR/IT roles');
console.log('✓ Ranked Candidates Priority Order:');
ranked.forEach(c => {
  console.log(`   #${c.priorityRank} [${c.department}] ${c.personName} - ${c.jobTitle} (Score: ${c.score}/100) ${c.isMutual ? '🤝 Mutual' : ''} ${c.isAlumni ? '🎓 Alumni' : ''}`);
});

// Rank #1 and #2 must be the mutual and alumni candidates
assert.strictEqual(ranked[0].isMutual || ranked[0].isAlumni, true, 'Mutuals & Alumni must be top priority');
assert.strictEqual(ranked[1].isMutual || ranked[1].isAlumni, true, 'Mutuals & Alumni must be top priority');

// 3. SafetyController Tests
console.log('\n--- Testing SafetyController ---');
const safety = new SafetyController({ maxRequestsPerCompany: 2, maxRequestsPerSession: 3 });
safety.setCompany('Acme Corp');

assert.strictEqual(safety.canSendRequest().allowed, true);
safety.recordRequestSent();
assert.strictEqual(safety.canSendRequest().allowed, true);
safety.recordRequestSent();
assert.strictEqual(safety.canSendRequest().allowed, false);
console.log('✓ Enforced max requests per company limit (2)');

// 4. HistoryManager Tests
console.log('\n--- Testing HistoryManager ---');
const testDataDir = path.join(__dirname, 'test_data');
const history = new HistoryManager(testDataDir);
history.currentCampaignId = 'test-campaign';

const rec = history.record({
  company: 'Microsoft',
  personName: 'Satya Nadella',
  profileUrl: 'https://www.linkedin.com/in/satyanadella/',
  jobTitle: 'Chairman and CEO',
  department: 'Executive',
  status: 'Sent',
  message: 'Hi Satya, ...'
});

assert.strictEqual(history.isDuplicate('https://www.linkedin.com/in/satyanadella/'), true);
assert.strictEqual(typeof rec.sentAt, 'string');
assert.strictEqual(Number.isNaN(new Date(rec.sentAt).getTime()), false, 'Confirmed sends should have a timestamp');
console.log('✓ Successfully detected duplicate contact across calls');
assert.strictEqual(
  history.isDuplicate('https://www.linkedin.com/in/another-satya-nadella/', 'Microsoft', 'Satya Nadella'),
  false,
  'Matching names must not make a different LinkedIn profile a duplicate'
);
console.log('✓ Duplicate protection is tied to the exact LinkedIn profile URL');

history.record({
  company: 'Microsoft',
  personName: 'Unconfirmed Candidate',
  profileUrl: 'https://www.linkedin.com/in/unconfirmed-candidate/',
  status: 'Unconfirmed',
  attemptedAt: new Date().toISOString(),
  message: 'Hi, ...',
  result: 'Send was clicked, but LinkedIn confirmation was not detected'
});
assert.strictEqual(history.isDuplicate('https://www.linkedin.com/in/unconfirmed-candidate/'), true);
assert.strictEqual(history.getStats('Microsoft').sent, 1);
assert.strictEqual(history.getStats('Microsoft').failed, 0);
assert.strictEqual(history.getStats('Microsoft').unconfirmed, 1);
console.log('✓ Unconfirmed requests are not counted as sent and are protected from duplicate attempts');

const csv = history.exportCSV();
assert.strictEqual(csv.includes('Satya Nadella'), true);
assert.strictEqual(csv.includes('Sent At'), true);
assert.strictEqual(csv.includes('Attempted At'), true);
console.log('✓ CSV export generated correctly');
history.saveLastCampaign({
  campaignId: 'test-campaign',
  companies: ['Microsoft'],
  targetPerCompany: 1,
  targetTotal: 1,
  approvalMode: 'Automatic',
  startedAt: new Date().toISOString(),
  finishedAt: new Date().toISOString(),
  status: 'completed',
  stats: { sent: 1, skipped: 0, pending: 0, unconfirmed: 1, failed: 0 }
});
assert.strictEqual(new HistoryManager(testDataDir).lastCampaign.stats.sent, 1, 'Last campaign details should persist across reloads');
assert.strictEqual(new HistoryManager(testDataDir).lastCampaign.stats.unconfirmed, 1, 'Unconfirmed attempts should be distinct in the saved campaign');
console.log('✓ Last campaign summary persists across reloads');

const legacyDataDir = path.join(__dirname, 'test_legacy_data');
fs.mkdirSync(legacyDataDir, { recursive: true });
fs.writeFileSync(path.join(legacyDataDir, 'history.json'), JSON.stringify([{
  company: 'Cohere Health',
  personName: 'Unconfirmed Legacy Candidate',
  profileUrl: 'https://www.linkedin.com/in/legacy-candidate/',
  date: '2026-10-12T13:34:00.000Z',
  status: 'Unconfirmed'
}]));
fs.writeFileSync(path.join(legacyDataDir, 'last-campaign.json'), JSON.stringify({
  companies: ['Cohere Health'],
  startedAt: '2026-10-12T13:33:17.396Z',
  finishedAt: '2026-10-12T13:34:35.260Z',
  status: 'completed',
  stats: { sent: 0, skipped: 0, pending: 0, failed: 1 }
}));
const migratedHistory = new HistoryManager(legacyDataDir);
assert.strictEqual(migratedHistory.lastCampaign.status, 'review_required');
assert.strictEqual(migratedHistory.lastCampaign.stats.unconfirmed, 1);
assert.strictEqual(migratedHistory.lastCampaign.stats.failed, 0);
assert.strictEqual(migratedHistory.records[0].attemptedAt, '2026-10-12T13:34:00.000Z');
assert.strictEqual(migratedHistory.records[0].campaignId, migratedHistory.lastCampaign.campaignId);
console.log('✓ Legacy campaign history migrates uncertain sends to review-required with attempt times');

// Cleanup test data
for (const dataDir of [testDataDir, legacyDataDir]) {
  if (fs.existsSync(dataDir)) fs.rmSync(dataDir, { recursive: true, force: true });
}

// 5. BrowserController Cross-Platform Compatibility Tests
console.log('\n--- Testing BrowserController Cross-Platform Compatibility ---');
const BrowserController = require('./agents/BrowserController');
const browserCtrl = new BrowserController();
assert.ok(browserCtrl.executablePath, 'Executable path should be defined');
if (fs.existsSync(browserCtrl.executablePath)) {
  console.log('✓ Found local Chrome executable for current OS:', browserCtrl.executablePath);
} else {
  console.log('ℹ Chrome executable path calculated for current OS:', browserCtrl.executablePath);
}
browserCtrl.cleanStaleLocks();
console.log('✓ cleanStaleLocks executed safely without OS-specific errors');

async function testOutreachRequiresStrictProfileVerification() {
  const verificationResult = {
    verifiedName: '',
    headline: 'Software Engineer at Cohere Health',
    currentCompanyFound: false,
    verifiedTitle: 'Software Engineer'
  };
  const page = {
    goto: async () => {},
    waitForFunction: async () => {},
    evaluate: async () => verificationResult,
    url: () => 'https://www.linkedin.com/in/candidate-example/'
  };
  const safety = {
    humanDelay: async () => {},
    checkSecurityChallenge: async () => false
  };
  const verifier = new ProfileVerificationAgent({ page }, safety, () => {});
  const candidate = {
    personName: 'Candidate Example',
    profileUrl: 'https://www.linkedin.com/in/candidate-example/',
    headline: 'Software Engineer',
    jobTitle: 'Software Engineer',
    department: 'IT / Engineering',
    discoveredAtCompany: 'Cohere Health'
  };

  const listedCandidate = await verifier.verifyCandidateProfile(candidate, 'Cohere Health');
  assert.strictEqual(listedCandidate.isValid, true, 'A candidate discovered on the target company People page should not require name or current-employer revalidation');
  assert.strictEqual(listedCandidate.verifiedName, candidate.personName);

  page.evaluate = async () => ({
    ...verificationResult,
    verifiedName: 'Candidate Example',
    currentCompanyFound: true
  });
  const verifiedCandidate = await verifier.verifyCandidateProfile({ ...candidate, discoveredAtCompany: '' }, 'Cohere Health');
  assert.strictEqual(verifiedCandidate.isValid, true);
  assert.strictEqual(verifiedCandidate.verifiedProfileUrl, candidate.profileUrl.replace(/\/$/, ''));

  page.evaluate = async () => ({ ...verificationResult, isPending: true });
  const pendingCandidate = await verifier.verifyCandidateProfile(candidate, 'Cohere Health');
  assert.strictEqual(pendingCandidate.isPending, true, 'Pending invitations should be recognized before other outreach checks');

  page.evaluate = async () => ({ ...verificationResult, verifiedName: 'Someone Else', currentCompanyFound: true });
  const wrongIdentity = await verifier.verifyCandidateProfile({ ...candidate, discoveredAtCompany: '' }, 'Cohere Health');
  assert.strictEqual(wrongIdentity.isValid, false, 'A different profile identity must be rejected');

  page.evaluate = async () => { throw new Error('profile failed to render'); };
  const verificationError = await verifier.verifyCandidateProfile(candidate, 'Cohere Health');
  assert.strictEqual(verificationError.isValid, false, 'Verification errors must fail closed');

  let pageTouched = false;
  const outreach = new OutreachAgent(
    { page: { locator: () => { pageTouched = true; } } },
    { canSendRequest: () => ({ allowed: true }) },
    { record: () => {} },
    msgAgent,
    () => {}
  );
  const unverifiedSend = await outreach.sendConnectionRequest({
    candidate,
    companyName: 'Cohere Health',
    referralTemplate: 'Hi, [Company]',
    approvalMode: false
  });
  assert.strictEqual(unverifiedSend.status, 'Failed');
  assert.strictEqual(pageTouched, false, 'Outreach must not touch LinkedIn without verification evidence');
}

async function testThreeDotMenuConnectPath() {
  let menuOpened = false;
  let connectSelectedFromMenu = false;
  let directConnectChecked = false;
  let noteValue = '';
  let sendClicked = false;
  const makeLocator = (selector, options = {}) => ({
    first() { return this; },
    nth() { return this; },
    async count() {
      if (selector.includes('More actions')) return 1;
      if (selector.includes('[role="menu"]')) return menuOpened ? 1 : 0;
      if (selector === 'textarea') return 1;
      if (selector === 'send-button') return 1;
      if (selector.includes('/preload/custom-invite/')
        || selector.includes('aria-label="Connect"')
        || selector.includes('aria-label^="Invite"')) {
        directConnectChecked = true;
        return 0;
      }
      return 0;
    },
    async isVisible() {
      if (selector.includes('More actions')) return true;
      if (selector.includes('[role="menu"]')) return menuOpened;
      if (selector === 'textarea') return true;
      if (selector === 'send-button') return true;
      if (selector === 'invitation-sent-toast') return sendClicked;
      return false;
    },
    async isEnabled() { return true; },
    async click() {
      if (selector.includes('More actions')) menuOpened = true;
      if (selector.includes('[role="menu"]')) connectSelectedFromMenu = true;
      if (selector === 'send-button') sendClicked = true;
    },
    locator(childSelector) {
      return makeLocator(childSelector);
    },
    async inputValue() { return noteValue; },
    async fill(value) { noteValue = value; },
    async evaluate(fn) { return fn({ value: noteValue }); },
    async waitFor() {}
  });
  const dialog = makeLocator('dialog');
  dialog.locator = selector => makeLocator(selector);
  const page = {
    locator: selector => makeLocator(selector),
    getByRole: (role, options) => {
      if (role === 'dialog') return dialog;
      if (role === 'button' && options?.name instanceof RegExp) {
        if (options.name.source === '^send$') return makeLocator('send-button');
        if (options.name.source === '^send invitation$') return makeLocator('send-invitation-button');
      }
      return makeLocator(role);
    },
    getByText: () => makeLocator('invitation-sent-toast'),
    waitForLoadState: async () => {},
    waitForTimeout: async () => {}
  };
  const history = { record: () => {} };
  const safety = {
    canSendRequest: () => ({ allowed: true }),
    checkSecurityChallenge: async () => false,
    recordRequestSent: () => {},
    humanDelay: async () => {}
  };
  const outreach = new OutreachAgent(
    { page },
    safety,
    history,
    { generateMessage: () => ({ message: 'Hi, I would appreciate a referral.', charCount: 34 }) },
    () => {}
  );
  const result = await outreach.sendConnectionRequest({
    candidate: {
      personName: 'Candidate Example',
      profileUrl: 'https://www.linkedin.com/in/candidate-example/',
      jobTitle: 'Software Engineer',
      department: 'IT / Engineering'
    },
    companyName: 'Cohere Health',
    verification: {
      isValid: true,
      verifiedProfileUrl: 'https://www.linkedin.com/in/candidate-example/',
      verifiedCompany: 'Cohere Health'
    },
    referralTemplate: 'Hi, [Company]',
    approvalMode: false
  });

  assert.strictEqual(connectSelectedFromMenu, true, 'Connect should be selected from the three-dot menu');
  assert.strictEqual(directConnectChecked, false, 'Do not fall back to direct Connect if the three-dot path succeeds');
  assert.strictEqual(noteValue, 'Hi, I would appreciate a referral.', 'Fill the visible note field even when it is outside the dialog role');
  assert.strictEqual(sendClicked, true, 'Click the exact Send button after verifying the note');
  assert.strictEqual(result.status, 'Sent', 'Only report Sent after LinkedIn confirmation');
}

async function testPendingProfileConfirmsSuccessfulSend() {
  let menuOpened = false;
  let sendClicked = false;
  let recordedEntry;
  let requestCount = 0;
  const makeLocator = selector => ({
    first() { return this; },
    nth() { return this; },
    async count() {
      if (selector.includes('More actions')) return 1;
      if (selector.includes('[role="menu"]')) return menuOpened ? 1 : 0;
      if (selector === 'textarea' || selector === 'send-button') return 1;
      return 0;
    },
    async isVisible() {
      if (selector.includes('More actions') || selector === 'textarea' || selector === 'send-button') return true;
      if (selector.includes('[role="menu"]')) return menuOpened;
      if (selector.includes('Pending')) return sendClicked;
      return false;
    },
    async isEnabled() { return true; },
    async click() {
      if (selector.includes('More actions')) menuOpened = true;
      if (selector.includes('[role="menu"]')) menuOpened = false;
      if (selector === 'send-button') sendClicked = true;
    },
    locator(childSelector) { return makeLocator(childSelector); },
    async inputValue() { return 'Hi, I would appreciate a referral.'; },
    async fill() {},
    async evaluate(fn) { return fn({ value: 'Hi, I would appreciate a referral.' }); },
    async waitFor() {
      if (selector === 'invitation-sent-toast') throw new Error('No invitation toast');
      if (selector.includes('Pending') && !sendClicked) throw new Error('Pending state not yet visible');
    }
  });
  const page = {
    locator: selector => makeLocator(selector),
    getByRole: (role, options) => {
      if (role === 'dialog') return makeLocator('dialog');
      if (role === 'button' && options?.name instanceof RegExp) {
        if (options.name.source === '^send$') return makeLocator('send-button');
        if (options.name.source === '^send invitation$') return makeLocator('send-invitation-button');
      }
      return makeLocator(role);
    },
    getByText: () => makeLocator('invitation-sent-toast'),
    waitForLoadState: async () => {},
    waitForTimeout: async () => {}
  };
  const outreach = new OutreachAgent(
    { page },
    {
      canSendRequest: () => ({ allowed: true }),
      checkSecurityChallenge: async () => false,
      recordRequestSent: () => { requestCount++; },
      humanDelay: async () => {}
    },
    { record: entry => { recordedEntry = entry; } },
    { generateMessage: () => ({ message: 'Hi, I would appreciate a referral.', charCount: 34 }) },
    () => {}
  );
  const result = await outreach.sendConnectionRequest({
    candidate: {
      personName: 'Pending Confirmation Candidate',
      profileUrl: 'https://www.linkedin.com/in/pending-confirmation/',
      jobTitle: 'Talent Acquisition Partner',
      department: 'HR / Talent',
      score: 80,
      priorityRank: 1
    },
    companyName: 'Cohere Health',
    verification: {
      isValid: true,
      isPending: false,
      isAlreadyConnected: false,
      verifiedProfileUrl: 'https://www.linkedin.com/in/pending-confirmation/',
      verifiedCompany: 'Cohere Health'
    },
    referralTemplate: 'Hi, [Company]',
    approvalMode: false
  });

  assert.strictEqual(sendClicked, true, `Send button should be clicked before checking the Pending state (result: ${JSON.stringify(result)})`);
  assert.strictEqual(result.status, 'Sent', 'A visible Pending profile action confirms a successful invitation');
  assert.strictEqual(requestCount, 1, 'Pending confirmation counts toward the successful-send target');
  assert.strictEqual(recordedEntry.status, 'Sent');
  assert.match(recordedEntry.result, /pending/i);
  assert.ok(recordedEntry.sentAt, 'Pending-confirmed request should have a sent timestamp');
}

async function testCampaignTargetAndAutomaticMode() {
  const coordinator = Object.create(WorkflowCoordinator.prototype);
  let approvalModePassed;
  let sends = 0;
  const candidates = [1, 2].map(index => ({
    personName: `Candidate ${index}`,
    profileUrl: `https://www.linkedin.com/in/candidate-${index}/`,
    jobTitle: 'Software Engineer',
    department: 'IT / Engineering',
    score: 90,
    priorityRank: index
  }));
  coordinator.isRunning = true;
  coordinator.currentCampaign = {
    referralMessage: 'Hi, [Company]',
    approvalMode: false,
    results: []
  };
  coordinator.safety = {
    requestsThisCompany: 0,
    requestsThisSession: 0,
    maxRequestsPerCompany: 1,
    maxRequestsPerSession: 1,
    recordRequestSent() {
      this.requestsThisCompany++;
      this.requestsThisSession++;
    }
  };
  coordinator.companyAgent = {
    findOfficialCompanyPage: async () => ({ officialUrl: 'https://www.linkedin.com/company/example/' })
  };
  coordinator.peopleAgent = { discoverPeople: async () => candidates };
  coordinator.rankingAgent = { rankCandidates: items => items };
  coordinator.history = {
    isDuplicate: () => false,
    record: () => {},
    getStats: () => ({})
  };
  coordinator.verificationAgent = {
    verifyCandidateProfile: async candidate => ({
      isValid: true,
      isPending: false,
      isAlreadyConnected: false,
      verifiedProfileUrl: candidate.profileUrl,
      verifiedCompany: 'Example'
    })
  };
  coordinator.outreachAgent = {
    sendConnectionRequest: async options => {
      sends++;
      approvalModePassed = options.approvalMode;
      coordinator.safety.recordRequestSent();
      return { status: 'Sent', message: 'Hi' };
    }
  };
  coordinator.broadcast = () => {};
  coordinator.log = () => {};
  coordinator.updateStats = () => {};

  await coordinator.processCompany('Example');
  assert.strictEqual(approvalModePassed, false, 'Automatic mode must not force a human approval step');
  assert.strictEqual(sends, 1, 'A target of one successful send must stop before another candidate is processed');
}

async function testCampaignStopsOnUnconfirmedSend() {
  const coordinator = Object.create(WorkflowCoordinator.prototype);
  const candidates = [1, 2].map(index => ({
    personName: `Candidate ${index}`,
    profileUrl: `https://www.linkedin.com/in/uncertain-${index}/`,
    jobTitle: 'Software Engineer',
    department: 'IT / Engineering',
    score: 90,
    priorityRank: index
  }));
  let verifications = 0;
  coordinator.isRunning = true;
  coordinator.currentCampaign = {
    referralMessage: 'Hi, [Company]',
    approvalMode: false,
    results: []
  };
  coordinator.safety = {
    requestsThisCompany: 0,
    requestsThisSession: 0,
    maxRequestsPerCompany: 1,
    maxRequestsPerSession: 1,
    setCompany() {}
  };
  coordinator.companyAgent = {
    findOfficialCompanyPage: async () => ({ officialUrl: 'https://www.linkedin.com/company/example/' })
  };
  coordinator.peopleAgent = { discoverPeople: async () => candidates };
  coordinator.rankingAgent = { rankCandidates: items => items };
  coordinator.history = {
    isDuplicate: () => false,
    record: () => {},
    getStats: () => ({}),
    getAll: () => []
  };
  coordinator.verificationAgent = {
    verifyCandidateProfile: async candidate => {
      verifications++;
      return {
        isValid: true,
        isPending: false,
        isAlreadyConnected: false,
        verifiedProfileUrl: candidate.profileUrl,
        verifiedCompany: 'Example'
      };
    }
  };
  coordinator.outreachAgent = {
    sendConnectionRequest: async () => ({ status: 'Unconfirmed' })
  };
  coordinator.broadcast = () => {};
  coordinator.log = () => {};
  coordinator.updateStats = () => {};

  const originalSetTimeout = global.setTimeout;
  global.setTimeout = (callback, delay, ...args) => originalSetTimeout(callback, Math.min(delay, 0), ...args);
  try {
    await coordinator.processCompany('Example');
  } finally {
    global.setTimeout = originalSetTimeout;
  }

  assert.strictEqual(verifications, 1, 'Do not open or verify another profile after an uncertain Send attempt');
  assert.strictEqual(coordinator.isRunning, false, 'An uncertain send must halt campaign processing');
  assert.strictEqual(coordinator.currentCampaign.outcome, 'review_required', 'An uncertain send requires user review');
}

function testCampaignProgressBroadcast() {
  const coordinator = Object.create(WorkflowCoordinator.prototype);
  const events = [];
  coordinator.currentCampaign = { maxSession: 3 };
  coordinator.safety = { requestsThisSession: 1 };
  coordinator.broadcast = event => events.push(event);

  coordinator.updateStats({ sent: 1 });

  assert.deepStrictEqual(events, [
    { type: 'STATS_UPDATE', stats: { sent: 1 } },
    { type: 'CAMPAIGN_PROGRESS', sent: 1, target: 3 }
  ]);
}

testOutreachRequiresStrictProfileVerification()
  .then(() => testThreeDotMenuConnectPath())
  .then(() => testPendingProfileConfirmsSuccessfulSend())
  .then(() => testCampaignTargetAndAutomaticMode())
  .then(() => testCampaignStopsOnUnconfirmedSend())
  .then(() => testCampaignProgressBroadcast())
  .then(() => console.log('✓ Automatic mode honors selected approval setting and successful-send target'))
  .then(() => console.log('✓ Three-dot Connect path fills the note and clicks Send only after validating it'))
  .then(() => console.log('✓ Strict identity/company verification and fail-closed outreach enforced'))
  .then(() => console.log('\n✨ ALL TESTS PASSED SUCCESSFULLY! ✨\n'))
  .catch(err => {
    console.error('\n❌ TEST FAILURE:', err);
    process.exitCode = 1;
  });
