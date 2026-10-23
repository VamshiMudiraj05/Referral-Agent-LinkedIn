const BrowserController = require('./BrowserController');
const SafetyController = require('./SafetyController');
const HistoryManager = require('./HistoryManager');
const CandidateRankingAgent = require('./CandidateRankingAgent');
const CompanyDiscoveryAgent = require('./CompanyDiscoveryAgent');
const PeopleDiscoveryAgent = require('./PeopleDiscoveryAgent');
const ProfileVerificationAgent = require('./ProfileVerificationAgent');
const MessageAgent = require('./MessageAgent');
const OutreachAgent = require('./OutreachAgent');

class WorkflowCoordinator {
  constructor(ioOrWsBroadcast, options = {}) {
    this.broadcast = ioOrWsBroadcast || (() => {});
    this.history = new HistoryManager();
    this.rankingAgent = new CandidateRankingAgent();
    this.messageAgent = new MessageAgent();
    this.safety = new SafetyController(options.safety || {});
    
    this.browser = new BrowserController({
      headless: options.headless !== undefined ? options.headless : false,
      logger: (msg, type = 'info') => this.log(msg, type)
    });

    this.companyAgent = new CompanyDiscoveryAgent(this.browser, this.safety, (msg, type) => this.log(msg, type));
    this.peopleAgent = new PeopleDiscoveryAgent(this.browser, this.safety, (msg, type) => this.log(msg, type));
    this.verificationAgent = new ProfileVerificationAgent(this.browser, this.safety, (msg, type) => this.log(msg, type));
    this.outreachAgent = new OutreachAgent(this.browser, this.safety, this.history, this.messageAgent, (msg, type) => this.log(msg, type));

    this.isRunning = false;
    this.isPaused = false;
    this.currentCampaign = null;
    this.companyVerificationResolver = null;

    // Connect safety alert
    this.safety.onSecurityAlert = (reason) => {
      this.log(`🚨 SAFETY RESTRICTION TRIGGERED: ${reason}`, 'alert');
      this.broadcast({
        type: 'SECURITY_ALERT',
        reason,
        timestamp: new Date().toISOString()
      });
    };
  }

  log(message, type = 'info', extra = {}) {
    const logItem = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      message,
      type, // 'info', 'success', 'warning', 'error', 'alert'
      timestamp: new Date().toLocaleTimeString(),
      ...extra
    };
    console.log(`[${logItem.timestamp}] [${type.toUpperCase()}] ${message}`);
    this.broadcast({ type: 'LOG', log: logItem });
  }

  updateStats(stats) {
    this.broadcast({ type: 'STATS_UPDATE', stats });
    if (this.currentCampaign) {
      this.broadcast({
        type: 'CAMPAIGN_PROGRESS',
        sent: this.safety.requestsThisSession,
        target: this.currentCampaign.maxSession
      });
    }
  }

  async startCampaign(config) {
    if (this.isRunning) {
      throw new Error('A campaign is already currently running');
    }

    this.isRunning = true;
    this.isPaused = false;
    const maxPerCompany = Math.min(25, Math.max(1, parseInt(config.maxPerCompany, 10) || 10));
    const campaignId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const locationFilter = (config.locationFilter || '').trim();
    const genderFilter = (config.genderFilter || 'all').toLowerCase().trim();

    this.currentCampaign = {
      id: campaignId,
      companies: config.companies || [config.companyName],
      referralMessage: config.referralMessage,
      strategy: config.strategy || 'sales_then_it',
      locationFilter,
      genderFilter,
      maxPerCompany,
      maxSession: Math.min(25, Math.max(1, parseInt(config.maxSession, 10) || maxPerCompany)),
      approvalMode: config.approvalMode !== false,
      headless: config.headless || false,
      startedAt: new Date().toISOString(),
      results: []
    };

    // Configure agents
    this.history.currentCampaignId = campaignId;
    this.safety.requestsThisCompany = 0;
    this.safety.requestsThisSession = 0;
    this.safety.currentCompany = '';
    this.safety.maxRequestsPerCompany = this.currentCampaign.maxPerCompany;
    this.safety.maxRequestsPerSession = this.currentCampaign.maxSession;
    this.rankingAgent.setStrategy(this.currentCampaign.strategy);
    this.rankingAgent.setLocationFilter(this.currentCampaign.locationFilter);
    this.rankingAgent.setGenderFilter(this.currentCampaign.genderFilter);
    this.browser.setHeadless(this.currentCampaign.headless);

    this.log(`🚀 Starting LinkedIn Referral Outreach Agent Campaign`);
    this.log(`Target Companies: ${this.currentCampaign.companies.join(', ')}`);
    this.log(`Mode: ${this.currentCampaign.approvalMode ? 'Human Approval Required' : 'Automatic Outreach'}`);
    this.log(`Priority Strategy: ${this.currentCampaign.strategy.replace(/_/g, ' ').toUpperCase()}`);
    if (this.currentCampaign.locationFilter) {
      this.log(`📍 Location Filter: "${this.currentCampaign.locationFilter}"`);
    }
    if (this.currentCampaign.genderFilter && this.currentCampaign.genderFilter !== 'all') {
      this.log(`👤 Gender Filter: "${this.currentCampaign.genderFilter.toUpperCase()}"`);
    }
    this.broadcast({
      type: 'CAMPAIGN_PROGRESS',
      sent: 0,
      target: this.currentCampaign.maxSession
    });

    try {
      // 1. Initialize Browser
      await this.browser.init();

      // 2. Check LinkedIn Login
      const loginCheck = await this.browser.checkLoginStatus();
      if (!loginCheck.loggedIn) {
        this.log('LinkedIn login required. Please sign in manually in the browser window.', 'alert');
        this.broadcast({
          type: 'REQUIRE_LOGIN',
          message: 'Please log in to LinkedIn in the browser window. The agent will pause until you log in.'
        });

        // Wait for user to log in manually (up to 3 minutes)
        await this.browser.waitForManualLogin();
        this.broadcast({ type: 'LOGIN_CONFIRMED' });
      }

      // 3. Process each company sequentially
      for (let i = 0; i < this.currentCampaign.companies.length; i++) {
        if (!this.isRunning) break;
        if (this.safety.requestsThisSession >= this.safety.maxRequestsPerSession) {
          this.log(`✓ Reached the campaign target of ${this.safety.maxRequestsPerSession} successful requests.`, 'success');
          break;
        }
        const companyName = this.currentCampaign.companies[i].trim();
        if (!companyName) continue;

        this.safety.setCompany(companyName);
        this.log(`\n========================================`);
        this.log(`🏢 Processing Company [${i + 1}/${this.currentCampaign.companies.length}]: "${companyName}"`);
        this.log(`========================================`);

        await this.processCompany(companyName);
      }

      const campaignStatus = this.currentCampaign.outcome
        || (this.currentCampaign.stopped
          ? 'stopped'
          : this.safety.requestsThisSession >= this.safety.maxRequestsPerSession
            ? 'completed'
            : 'incomplete');
      this.log(`Campaign ${campaignStatus.replace(/_/g, ' ')}; generating final summary report...`, campaignStatus === 'completed' ? 'success' : 'warning');
      this.finalizeCampaign(campaignStatus);
      const finalReport = this.generateFinalReport();
      this.broadcast({ type: 'CAMPAIGN_FINISHED', report: finalReport });

    } catch (err) {
      this.log(`Campaign execution encountered an issue: ${err.message}`, 'error');
      this.finalizeCampaign('failed');
      this.broadcast({ type: 'CAMPAIGN_ERROR', error: err.message });
    } finally {
      this.isRunning = false;
    }
  }

  async processCompany(companyName) {
    // 1. Discover and verify official company page
    this.log(`Step 1: Finding official LinkedIn page for "${companyName}"...`);
    const officialCompany = await this.companyAgent.findOfficialCompanyPage(companyName);

    // 2. Discover People from the People tab
    this.log(`Step 2: Accessing official People section...`);
    const rawCandidates = await this.peopleAgent.discoverPeople(
      officialCompany.officialUrl,
      undefined,
      80,
      this.currentCampaign.locationFilter
    );
    const candidatesWithCompanyEvidence = rawCandidates.map(candidate => ({
      ...candidate,
      discoveredAtCompany: companyName
    }));

    // 3. Score and rank candidates
    this.log(`Step 3: Ranking candidates (Top Priority: Mutual Connections & Same College Alumni, then HR/Talent & IT/Engineering)...`);
    const rankedCandidates = this.rankingAgent.rankCandidates(candidatesWithCompanyEvidence, this.history, companyName);

    const hrCount = rankedCandidates.filter(c => c.department === 'HR / Talent').length;
    const itCount = rankedCandidates.filter(c => c.department === 'IT / Engineering').length;
    const mutualAlumniCount = rankedCandidates.filter(c => c.isMutual || c.isAlumni).length;
    const femaleCount = rankedCandidates.filter(c => c.gender === 'female').length;
    const maleCount = rankedCandidates.filter(c => c.gender === 'male').length;
    const alreadyConnectedCount = rankedCandidates.filter(c => c.isAlreadyConnected).length;
    const pendingCount = rankedCandidates.filter(c => c.isPending).length;

    let filterMsg = '';
    if (this.currentCampaign.locationFilter) {
      filterMsg += ` [Location: ${this.currentCampaign.locationFilter}]`;
    }
    if (this.currentCampaign.genderFilter && this.currentCampaign.genderFilter !== 'all') {
      filterMsg += ` [Gender: ${this.currentCampaign.genderFilter.toUpperCase()}]`;
    }

    this.log(`✓ Analysis Complete for ${companyName}: ${rawCandidates.length} discovered | ${rankedCandidates.length} relevant (${mutualAlumniCount} Mutuals/Alumni, ${hrCount} HR/Talent, ${itCount} IT/Tech, ${femaleCount} Female, ${maleCount} Male)${filterMsg}`);

    // Target Company Verification Card state
    const companySummary = {
      companyName,
      officialUrl: officialCompany.officialUrl,
      website: officialCompany.website,
      industry: officialCompany.industry,
      location: officialCompany.location,
      followers: officialCompany.followers,
      peopleFound: rawCandidates.length,
      mutualAlumniCandidates: mutualAlumniCount,
      hrCandidates: hrCount,
      itCandidates: itCount,
      femaleCandidates: femaleCount,
      maleCandidates: maleCount,
      locationFilter: this.currentCampaign.locationFilter || null,
      genderFilter: this.currentCampaign.genderFilter || 'all',
      alreadyConnected: alreadyConnectedCount,
      pending: pendingCount,
      recommendedTargets: Math.min(rankedCandidates.filter(c => !c.isAlreadyConnected && !c.isPending).length, this.safety.maxRequestsPerCompany)
    };

    // Broadcast Target Verification Step to user
    this.broadcast({
      type: 'COMPANY_VERIFICATION_REQUIRED',
      companySummary,
      candidates: rankedCandidates
    });

    this.log(`📋 Target Company Verified! Please review the card above and click [Start Outreach] to proceed.`);

    // If automatic mode is enabled without manual approval, auto-advance after 3 seconds
    let verificationDecision;
    if (!this.currentCampaign.approvalMode) {
      this.log(`Automatic mode active: Starting outreach in 3 seconds...`);
      await new Promise(r => setTimeout(r, 3000));
      verificationDecision = { action: 'start' };
      this.broadcast({ type: 'COMPANY_VERIFIED_AUTO' });
    } else {
      // Wait for user to verify & click [Start Outreach]
      verificationDecision = await new Promise(resolve => {
        this.companyVerificationResolver = resolve;
      });
      this.companyVerificationResolver = null;
    }

    if (verificationDecision.action === 'cancel') {
      this.log(`Outreach cancelled for ${companyName} by user.`);
      return;
    }
    if (verificationDecision.action === 'change_message' && verificationDecision.newMessage) {
      this.currentCampaign.referralMessage = verificationDecision.newMessage;
      this.log('Updated referral message per user request.');
    }

    // 4. Outreach Loop
    const candidatesToReview = rankedCandidates;
    const sentAtCompanyStart = this.safety.requestsThisCompany;
    const requestedForCompany = Math.max(0, this.safety.maxRequestsPerCompany - sentAtCompanyStart);

    this.log(`Reviewing up to ${candidatesToReview.length} ranked candidates until ${requestedForCompany} successful requests are confirmed. Already-connected, pending, skipped, and unconfirmed profiles do not count.`);

    for (let cIdx = 0; cIdx < candidatesToReview.length; cIdx++) {
      if (!this.isRunning) break;
      if (this.safety.requestsThisCompany >= this.safety.maxRequestsPerCompany) {
        this.log(`✓ Reached the successful connection request target of ${this.safety.maxRequestsPerCompany} for ${companyName}.`, 'success');
        break;
      }
      if (this.safety.requestsThisSession >= this.safety.maxRequestsPerSession) {
        this.log(`Session successful-request limit reached (${this.safety.maxRequestsPerSession}); stopping outreach.`, 'warning');
        break;
      }

      const candidate = candidatesToReview[cIdx];
      const successfulForCompany = this.safety.requestsThisCompany - sentAtCompanyStart;
      this.log(`\n→ Reviewing candidate ${cIdx + 1}/${candidatesToReview.length} (${successfulForCompany}/${requestedForCompany} successful): ${candidate.personName} (${candidate.jobTitle}) - Score: ${candidate.score}/100`);

      // 4a. Duplicate protection check
      if (this.history.isDuplicate(candidate.profileUrl, companyName, candidate.personName)) {
        this.log(`Skipping ${candidate.personName}: Already sent invitation in a previous session (Duplicate Protection).`, 'info');
        continue;
      }

      // 4b. Profile validation
      this.log(`Verifying current employment on profile...`);
      const verification = await this.verificationAgent.verifyCandidateProfile(
        candidate,
        companyName,
        this.currentCampaign.locationFilter
      );

      if (!verification.isValid) {
        if (!this.currentCampaign.approvalMode) {
          this.log(`Skipping ${candidate.personName}: ${verification.reason}. Automatic mode will not pause for approval on an unverified profile.`, 'warning');
          this.history.record({
            company: companyName,
            personName: candidate.personName,
            profileUrl: candidate.profileUrl,
            jobTitle: candidate.jobTitle,
            department: candidate.department,
            priorityRank: candidate.priorityRank,
            score: candidate.score,
            status: 'Skipped',
            message: '',
            result: `Automatic mode skipped unverified profile: ${verification.reason}`
          });
          continue;
        }

        this.log(`🚨 ${candidate.personName}: ${verification.reason}. Pausing on this profile for your decision; sending is disabled because verification failed.`, 'alert');
        const decision = await new Promise(resolve => {
          this.outreachAgent.approvalResolver = resolve;
          this.broadcast({
            type: 'REQUIRE_APPROVAL',
            data: {
              candidate,
              companyName,
              score: candidate.score,
              priorityRank: candidate.priorityRank,
              canSend: false,
              verificationReason: verification.reason
            }
          });
        });
        this.outreachAgent.approvalResolver = null;

        if (decision.action === 'stop' || (decision.action !== 'skip' && decision.action !== 'approve')) {
          this.isRunning = false;
          break;
        }

        this.history.record({
          company: companyName,
          personName: candidate.personName,
          profileUrl: candidate.profileUrl,
          jobTitle: candidate.jobTitle,
          department: candidate.department,
          priorityRank: candidate.priorityRank,
          score: candidate.score,
          status: 'Skipped',
          message: '',
          result: `Verification failed; user chose to skip: ${verification.reason}`
        });
        continue;
      }

      if (verification.isAlreadyConnected || verification.isPending) {
        const status = verification.isPending ? 'Pending' : 'Already Connected';
        const result = verification.isPending
          ? 'LinkedIn profile shows an existing pending invitation'
          : 'LinkedIn profile shows a first-degree connection';
        this.log(`🚨 ${candidate.personName}: ${result}. Skipping this profile and moving to the next candidate without sending.`, 'warning');
        this.history.record({
          company: companyName,
          personName: candidate.personName,
          profileUrl: candidate.profileUrl,
          jobTitle: candidate.jobTitle,
          department: candidate.department,
          priorityRank: candidate.priorityRank,
          score: candidate.score,
          status,
          message: '',
          result
        });
        continue;
      }

      if (this.currentCampaign.approvalMode) {
        this.log(`🚨 Profile verified and no pending invitation is visible for ${candidate.personName}. Pausing here for your review; no invitation will be sent and no next profile will open until you choose an action.`, 'alert');
      } else {
        this.log(`Automatic mode: proceeding with the verified profile for ${candidate.personName}.`, 'info');
      }

      const outreachResult = await this.outreachAgent.sendConnectionRequest({
        candidate,
        companyName,
        verification,
        referralTemplate: this.currentCampaign.referralMessage,
        approvalMode: this.currentCampaign.approvalMode,
        onRequireApproval: (approvalData) => {
          this.broadcast({
            type: 'REQUIRE_APPROVAL',
            data: approvalData
          });
        }
      });

      // Update and broadcast stats
      const liveStats = this.history.getStats(companyName);
      this.updateStats(liveStats);

      if (outreachResult.status === 'Sent') {
        this.currentCampaign.results.push({
          company: companyName,
          personName: candidate.personName,
          profileUrl: candidate.profileUrl,
          message: outreachResult.message,
          status: 'Sent'
        });
        this.log(`Confirmed successful request ${this.safety.requestsThisCompany - sentAtCompanyStart}/${requestedForCompany} for ${companyName}: ${candidate.personName}.`, 'success');
        if (this.safety.requestsThisCompany >= this.safety.maxRequestsPerCompany
          || this.safety.requestsThisSession >= this.safety.maxRequestsPerSession) {
          this.log(`✓ Successful request target reached; no additional candidate profiles will be opened.`, 'success');
          break;
        }
      }

      if (outreachResult.status === 'Unconfirmed') {
        this.currentCampaign.outcome = 'review_required';
        this.isRunning = false;
        this.log(`🛑 Send status for ${candidate.personName} is unconfirmed. Stopping the campaign so you can check LinkedIn before any further requests are attempted.`, 'alert');
        this.updateStats(this.history.getStats());
        break;
      }

      if (outreachResult.status === 'Stopped') {
        this.isRunning = false;
        this.currentCampaign.stopped = true;
        break;
      }

    }

    const successfulForCompany = this.safety.requestsThisCompany - sentAtCompanyStart;
    if (successfulForCompany < requestedForCompany && this.isRunning) {
      this.log(`Outreach ended with ${successfulForCompany}/${requestedForCompany} successful requests for ${companyName}; no more eligible profiles or request capacity were available.`, 'warning');
    }
  }

  confirmCompanyVerification(decision) {
    if (this.companyVerificationResolver) {
      this.companyVerificationResolver(decision);
    }
  }

  handleApprovalDecision(decision) {
    this.outreachAgent.handleApprovalResponse(decision);
  }

  resumeSecurityPause() {
    this.safety.resume();
    this.log('Resumed automation after manual intervention confirmation.', 'success');
    this.broadcast({ type: 'SECURITY_ALERT_RESOLVED' });
  }

  stopCampaign() {
    this.isRunning = false;
    if (this.currentCampaign) this.currentCampaign.stopped = true;
    this.log('User requested campaign stop.', 'warning');
    if (this.companyVerificationResolver) {
      this.companyVerificationResolver({ action: 'cancel' });
    }
    if (this.outreachAgent.approvalResolver) {
      this.outreachAgent.approvalResolver({ action: 'stop' });
    }
  }

  generateFinalReport() {
    const allRecords = this.history.getAll();
    const stats = this.history.getStats();
    return {
      stats,
      records: allRecords,
      lastCampaign: this.history.lastCampaign,
      csv: this.history.exportCSV()
    };
  }

  finalizeCampaign(status) {
    if (!this.currentCampaign) return null;
    const finishedAt = new Date().toISOString();
    const campaignRecords = this.history.getAll().filter(record => record.campaignId === this.currentCampaign.id);
    const stats = {
      sent: campaignRecords.filter(record => record.status === 'Sent').length,
      skipped: campaignRecords.filter(record => record.status === 'Skipped').length,
      pending: campaignRecords.filter(record => record.status === 'Pending').length,
      unconfirmed: campaignRecords.filter(record => record.status === 'Unconfirmed').length,
      failed: campaignRecords.filter(record => ['Failed', 'Note Unavailable'].includes(record.status)).length
    };

    return this.history.saveLastCampaign({
      campaignId: this.currentCampaign.id,
      companies: this.currentCampaign.companies,
      targetPerCompany: this.currentCampaign.maxPerCompany,
      targetTotal: this.currentCampaign.maxSession,
      approvalMode: this.currentCampaign.approvalMode ? 'Manual approval' : 'Automatic',
      startedAt: this.currentCampaign.startedAt,
      finishedAt,
      status,
      stats
    });
  }
}

module.exports = WorkflowCoordinator;
