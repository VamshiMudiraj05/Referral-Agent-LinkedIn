const assert = require('assert');
const MessageAgent = require('./agents/MessageAgent');
const CandidateRankingAgent = require('./agents/CandidateRankingAgent');
const SafetyController = require('./agents/SafetyController');
const HistoryManager = require('./agents/HistoryManager');
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
console.log('✓ Successfully detected duplicate contact across calls');

const csv = history.exportCSV();
assert.strictEqual(csv.includes('Satya Nadella'), true);
console.log('✓ CSV export generated correctly');

// Cleanup test data
if (fs.existsSync(testDataDir)) {
  fs.rmSync(testDataDir, { recursive: true, force: true });
}

console.log('\n✨ ALL TESTS PASSED SUCCESSFULLY! ✨\n');
