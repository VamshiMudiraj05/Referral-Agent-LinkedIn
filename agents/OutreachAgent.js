class OutreachAgent {
  constructor(browserController, safetyController, historyManager, messageAgent, logger = console.log) {
    this.browser = browserController;
    this.safety = safetyController;
    this.history = historyManager;
    this.messageAgent = messageAgent;
    this.logger = logger;
    this.approvalResolver = null;
  }

  async sendConnectionRequest({
    candidate,
    companyName,
    referralTemplate,
    approvalMode = true,
    onRequireApproval = null
  }) {
    const page = this.browser.page;
    if (!page) throw new Error('Browser page not available');

    // 1. Generate note without candidate name (seniority-safe greeting: "Hi," or "Hello,")
    const msgObj = this.messageAgent.generateMessage(referralTemplate, candidate, companyName);
    const finalMessage = msgObj.message;

    this.logger(`Prepared note for ${candidate.personName}: "${finalMessage.substring(0, 70)}..."`);

    // 2. Human approval mode check
    if (approvalMode && onRequireApproval) {
      this.logger(`Awaiting user approval for ${candidate.personName}...`);
      
      const approvalDecision = await new Promise((resolve) => {
        this.approvalResolver = resolve;
        onRequireApproval({
          candidate,
          companyName,
          message: finalMessage,
          score: candidate.score,
          priorityRank: candidate.priorityRank
        });
      });

      this.approvalResolver = null;

      if (approvalDecision.action === 'stop') {
        this.logger('Campaign stopped by user during approval review.');
        return { success: false, status: 'Stopped', reason: 'User cancelled campaign' };
      }

      if (approvalDecision.action === 'skip') {
        this.logger(`Candidate ${candidate.personName} skipped by user.`);
        this.history.record({
          company: companyName,
          personName: candidate.personName,
          profileUrl: candidate.profileUrl,
          jobTitle: candidate.jobTitle,
          department: candidate.department,
          priorityRank: candidate.priorityRank,
          score: candidate.score,
          status: 'Skipped',
          message: finalMessage,
          result: 'User chose to skip'
        });
        return { success: false, status: 'Skipped', reason: 'Skipped by user' };
      }

      // If user customized message in the approval card
      if (approvalDecision.editedMessage) {
        msgObj.message = approvalDecision.editedMessage;
      }
    }

    // Safety checks before sending
    const canSend = this.safety.canSendRequest();
    if (!canSend.allowed) {
      throw new Error(canSend.reason);
    }

    if (await this.safety.checkSecurityChallenge(page)) {
      throw new Error(this.safety.pauseReason);
    }

    this.logger(`Initiating Connect workflow for ${candidate.personName}...`);

    try {
      // Ensure page is ready at top (no scrolling!)
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      await page.waitForTimeout(1500);

      // Check if already pending invitation on LinkedIn
      const pendingBtn = page.locator('main button:has-text("Pending"), main [aria-label*="Pending" i], main :is(a, button):has-text("Pending")').first();
      if (await pendingBtn.isVisible({ timeout: 800 }).catch(() => false)) {
        this.logger(`Candidate ${candidate.personName} already has a pending connection request on LinkedIn. Skipping.`, 'info');
        this.history.record({
          company: companyName,
          personName: candidate.personName,
          profileUrl: candidate.profileUrl,
          jobTitle: candidate.jobTitle,
          department: candidate.department,
          priorityRank: candidate.priorityRank,
          score: candidate.score,
          status: 'Pending',
          message: '',
          result: 'Already pending invitation on LinkedIn'
        });
        return { success: false, status: 'Pending', reason: 'Already pending invitation' };
      }

      let clickedConnect = false;

      // =========================================================================
      // SCENARIO 2: Check for DIRECT "Connect" button/link right below profile header
      // =========================================================================
      this.logger(`Checking for direct Connect button in header for ${candidate.personName}...`);

      // In LinkedIn, the direct Connect button in the top action row is an <a> or <button>
      // e.g. <a href*="/preload/custom-invite/"> or <a aria-label="Invite ... to connect">
      const directConnect = page.locator('main a[href*="/preload/custom-invite/"], main :is(a, button)[aria-label*="to connect" i]').first();
      const directVisible = await directConnect.isVisible({ timeout: 1500 }).catch(() => false);

      if (directVisible) {
        this.logger(`✓ Found direct Connect button in header. Clicking directly...`);
        // Use dispatchEvent + click({force:true}) to bypass SVG pointer-events interceptors without scrolling
        await directConnect.dispatchEvent('click');
        await directConnect.click({ force: true }).catch(() => {});
        clickedConnect = true;
      }

      // =========================================================================
      // SCENARIO 1: Three dots ("...") button -> Connect inside menu
      // =========================================================================
      if (!clickedConnect) {
        this.logger(`Direct Connect not in top row. Clicking three dots ("...") button for ${candidate.personName}...`);

        const moreBtn = page.locator('main button[aria-label="More"], main button[aria-label="More actions"]').first();
        const moreVisible = await moreBtn.isVisible({ timeout: 2500 }).catch(() => false);

        if (moreVisible) {
          await moreBtn.click();
          this.logger('Clicked three dots button. Waiting for menu...');
          await page.waitForTimeout(800);

          // Find Connect in the opened menu (LinkedIn uses role="menu")
          const menuConnect = page.locator('div[role="menu"] [aria-label*="to connect" i], div[role="menu"] a[role="menuitem"]:has-text("Connect"), div[role="menu"] :is(a, div, span, button):has-text("Connect")').first();
          const menuConnectVisible = await menuConnect.isVisible({ timeout: 2500 }).catch(() => false);

          if (menuConnectVisible) {
            await menuConnect.click();
            clickedConnect = true;
            this.logger('✓ Clicked "Connect" inside three dots menu.');
          } else {
            this.logger(`Connect option was not found in three dots menu for ${candidate.personName}.`, 'warning');
          }
        } else {
          this.logger(`Three dots button not found on ${candidate.personName}'s profile.`, 'warning');
        }
      }

      if (!clickedConnect) {
        this.logger(`Connect option not accessible for ${candidate.personName} (may already be connected, pending, or restricted).`, 'warning');
        this.history.record({
          company: companyName,
          personName: candidate.personName,
          profileUrl: candidate.profileUrl,
          jobTitle: candidate.jobTitle,
          department: candidate.department,
          priorityRank: candidate.priorityRank,
          score: candidate.score,
          status: 'Note Unavailable',
          message: msgObj.message,
          result: 'Connect option not accessible'
        });
        return { success: false, status: 'Note Unavailable', reason: 'Connect option not accessible' };
      }

      // =========================================================================
      // STEP 3: Handle the Connection Modal Dialog ("Add a note to your invitation?")
      // =========================================================================
      this.logger('Waiting for invitation modal dialog...');
      await page.waitForTimeout(1500);

      // Check if email verification is requested
      const emailInput = page.locator('div[role="dialog"] input#email, input[name="email"]').first();
      if (await emailInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        this.logger(`Candidate requires email verification to connect. Skipping ${candidate.personName}.`, 'warning');
        const dismissBtn = page.locator('div[role="dialog"] button[aria-label="Dismiss"], button.artdeco-modal__dismiss').first();
        if (await dismissBtn.isVisible().catch(() => false)) {
          await dismissBtn.click().catch(() => {});
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
          message: msgObj.message,
          result: 'Recipient requires email verification'
        });
        return { success: false, status: 'Skipped', reason: 'Recipient requires email verification' };
      }

      // Look for "Add a note" button in the modal
      const addNoteBtn = page.locator('div[role="dialog"] button:has-text("Add a note"), button:has-text("Add a note")').first();
      const addNoteVisible = await addNoteBtn.isVisible({ timeout: 3500 }).catch(() => false);

      if (addNoteVisible) {
        this.logger('Found "Add a note" button. Clicking to open note textarea...');
        await addNoteBtn.click();
        await page.waitForTimeout(800);
      } else {
        this.logger('Note textarea might already be visible or in direct composition view.');
      }

      // =========================================================================
      // STEP 4: Fill the note textarea
      // =========================================================================
      const textareaLocator = page.locator('div[role="dialog"] textarea, textarea#custom-message, textarea[name="message"], textarea').first();
      const textareaVisible = await textareaLocator.isVisible({ timeout: 5000 }).catch(() => false);

      if (!textareaVisible) {
        this.logger(`"Add a note" textarea was not accessible for ${candidate.personName}. Skipping sending without note.`, 'warning');
        const dismissBtn = page.locator('div[role="dialog"] button[aria-label="Dismiss"], button:has-text("Cancel")').first();
        if (await dismissBtn.isVisible().catch(() => false)) {
          await dismissBtn.click().catch(() => {});
        }

        this.history.record({
          company: companyName,
          personName: candidate.personName,
          profileUrl: candidate.profileUrl,
          jobTitle: candidate.jobTitle,
          department: candidate.department,
          priorityRank: candidate.priorityRank,
          score: candidate.score,
          status: 'Note Unavailable',
          message: msgObj.message,
          result: 'Note textarea unavailable'
        });

        return { success: false, status: 'Note Unavailable', reason: 'Note textarea unavailable' };
      }

      this.logger(`Typing referral message into note textarea (${msgObj.charCount}/300 chars)...`);
      await textareaLocator.click();
      await page.waitForTimeout(200);
      await textareaLocator.fill(msgObj.message);
      await page.waitForTimeout(800);

      // =========================================================================
      // STEP 5: Click "Send" button (ensure NOT "Send without a note")
      // =========================================================================
      const sendLocators = [
        page.locator('div[role="dialog"] button:has-text("Send"):not(:has-text("without a note"))').first(),
        page.locator('div[role="dialog"] button:has-text("Send invitation")').first(),
        page.locator('button:has-text("Send"):not(:has-text("without a note"))').first(),
        page.locator('button:has-text("Send invitation")').first()
      ];

      let sent = false;
      for (const sLoc of sendLocators) {
        if (await sLoc.isVisible({ timeout: 2000 }).catch(() => false)) {
          await sLoc.click({ timeout: 4000 });
          sent = true;
          this.logger(`✓ Connection request with custom note successfully sent to ${candidate.personName}!`, 'success');
          break;
        }
      }

      if (sent) {
        await page.waitForTimeout(2000);
        this.safety.recordRequestSent();

        this.history.record({
          company: companyName,
          personName: candidate.personName,
          profileUrl: candidate.profileUrl,
          jobTitle: candidate.jobTitle,
          department: candidate.department,
          priorityRank: candidate.priorityRank,
          score: candidate.score,
          status: 'Sent',
          message: msgObj.message,
          result: 'Successfully sent with custom note'
        });

        // Natural delay between profile requests
        await this.safety.humanDelay(2.0);
        return { success: true, status: 'Sent', candidate, message: msgObj.message };
      } else {
        throw new Error('Send button could not be clicked in modal');
      }

    } catch (err) {
      this.logger(`Outreach error for ${candidate.personName}: ${err.message}`, 'error');
      const dismissBtn = page.locator('div[role="dialog"] button[aria-label="Dismiss"], button:has-text("Cancel")').first();
      if (await dismissBtn.isVisible().catch(() => false)) {
        await dismissBtn.click().catch(() => {});
      }

      return { success: false, status: 'Failed', reason: err.message };
    }
  }

  handleApprovalResponse(response) {
    if (this.approvalResolver) {
      this.approvalResolver(response);
    }
  }
}

module.exports = OutreachAgent;
