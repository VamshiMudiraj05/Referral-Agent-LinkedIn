async function findVisibleLocator(page, selectors, timeout = 750) {
  for (const selector of selectors) {
    const matches = page.locator(selector);
    const count = await matches.count().catch(() => 0);

    for (let index = 0; index < count; index++) {
      const match = matches.nth(index);
      if (await match.isVisible({ timeout }).catch(() => false)) {
        return match;
      }
    }
  }

  return null;
}

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
    verification,
    referralTemplate,
    approvalMode = true,
    onRequireApproval = null
  }) {
    const page = this.browser.page;
    if (!page) throw new Error('Browser page not available');

    const expectedProfileUrl = (candidate.profileUrl || '').split('?')[0].replace(/\/$/, '').toLowerCase();
    const verifiedProfileUrl = (verification?.verifiedProfileUrl || '').split('?')[0].replace(/\/$/, '').toLowerCase();
    if (
      verification?.isValid !== true
      || verifiedProfileUrl !== expectedProfileUrl
      || (verification.verifiedCompany || '').trim().toLowerCase() !== companyName.trim().toLowerCase()
    ) {
      const reason = 'Strict profile identity and current-company verification is required before outreach';
      this.logger(`Refusing to send to ${candidate.personName}: ${reason}.`, 'error');
      return { success: false, status: 'Failed', reason };
    }

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
      // SCENARIO 1: Use the profile's three-dot actions menu when available
      // =========================================================================
      this.logger(`Checking the three-dot profile actions menu for ${candidate.personName}...`);
      const moreButtonSelectors = [
        'main button[aria-label="More"]',
        'main button[aria-label*="More actions" i]',
        'main button[aria-label*="More options" i]',
        'main button[aria-label*="More" i]',
        'main button[aria-label*="Actions" i]',
        'main button[title*="More" i]',
        'main button[data-control-name*="overflow" i]',
        'main button:has([data-test-icon*="overflow" i])'
      ];
      const moreBtn = await findVisibleLocator(page, moreButtonSelectors);

      if (moreBtn) {
        await moreBtn.click({ timeout: 4000 });
        this.logger('Clicked the three-dot button; locating the exact Connect menu item...');
        await page.waitForTimeout(800);

        const menuConnectSelectors = [
          'div[role="menu"] [aria-label="Connect" i]',
          'div[role="menu"] a[role="menuitem"]:has-text("Connect")',
          'div[role="menu"] :is(a, button, [role="menuitem"]):has-text("Connect")',
          '.artdeco-dropdown__content :is(a, button, [role="menuitem"]):has-text("Connect")'
        ];
        const menuConnect = await findVisibleLocator(page, menuConnectSelectors);

        if (menuConnect) {
          await menuConnect.click({ timeout: 4000 });
          clickedConnect = true;
          this.logger('✓ Opened the invitation flow using Connect from the three-dot menu.');
        } else {
          this.logger(`Connect was not available in the opened three-dot menu for ${candidate.personName}.`, 'warning');
        }
      } else {
        this.logger(`Three-dot actions button was not visible for ${candidate.personName}.`, 'info');
      }

      // =========================================================================
      // SCENARIO 2: Fall back to an explicitly identified direct Connect control
      // =========================================================================
      if (!clickedConnect) {
        this.logger(`Checking for a direct Connect control for ${candidate.personName}...`);
        const directConnectSelectors = [
          'main a[href*="/preload/custom-invite/"]',
          'main button[aria-label="Connect" i]',
          'main button[aria-label^="Invite" i][aria-label*="connect" i]'
        ];
        const directConnect = await findVisibleLocator(page, directConnectSelectors);

        if (directConnect) {
          await directConnect.click({ timeout: 4000 });
          clickedConnect = true;
          this.logger('✓ Opened the invitation flow using the direct Connect control.');
        }
      }

      if (!clickedConnect) {
        this.logger(`Neither the three-dot menu nor a direct Connect control provided an invitation action for ${candidate.personName}. No request was sent.`, 'warning');
        this.history.record({
          company: companyName,
          personName: candidate.personName,
          profileUrl: candidate.profileUrl,
          jobTitle: candidate.jobTitle,
          department: candidate.department,
          priorityRank: candidate.priorityRank,
          score: candidate.score,
          status: 'Failed',
          message: msgObj.message,
          result: 'No Connect action found in the three-dot menu or direct profile controls'
        });
        return { success: false, status: 'Failed', reason: 'No Connect action found in the three-dot menu or direct profile controls' };
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

      // Look for "Add a note" button in the invitation flow
      const addNoteBtn = page.getByRole('button', { name: /add a note/i }).first();
      const addNoteVisible = await addNoteBtn.isVisible({ timeout: 3500 }).catch(() => false);

      if (addNoteVisible) {
        this.logger('Found "Add a note" button. Clicking to open note textarea...');
        await addNoteBtn.click();
        await page.waitForTimeout(400);
      } else {
        this.logger('Note textarea might already be visible or in direct composition view.');
      }

      // =========================================================================
      // STEP 4: Fill the note textarea
      // =========================================================================
      const noteFieldSelectors = [
        '[role="dialog"] textarea',
        '[role="dialog"] [contenteditable="true"][role="textbox"]',
        '[role="dialog"] [contenteditable="true"]',
        'textarea[aria-label*="note" i]',
        'textarea[placeholder*="note" i]',
        'textarea[name*="message" i]',
        'textarea',
        '[contenteditable="true"][role="textbox"]',
        '[contenteditable="true"]'
      ];
      let noteField = null;
      for (let attempt = 0; attempt < 6 && !noteField; attempt++) {
        noteField = await findVisibleLocator(page, noteFieldSelectors, 500);
        if (!noteField && attempt < 5) await page.waitForTimeout(500);
      }

      if (!noteField) {
        this.logger(`LinkedIn's invitation note field was not accessible for ${candidate.personName}. No request was sent.`, 'warning');
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
      await noteField.click();
      await page.waitForTimeout(200);
      await noteField.fill(msgObj.message);
      await page.waitForTimeout(800);

      // =========================================================================
      // STEP 5: Click "Send" button (ensure NOT "Send without a note")
      // =========================================================================
      const filledNote = await noteField.evaluate(element =>
        (element.value ?? element.innerText ?? element.textContent ?? '').trim()
      );
      if (filledNote !== msgObj.message || filledNote.length === 0 || filledNote.length > 300) {
        throw new Error('Invitation note did not match the prepared message or exceeded LinkedIn’s 300 character limit');
      }

      const sendLocators = [
        page.getByRole('button', { name: /^send$/i }),
        page.getByRole('button', { name: /^send invitation$/i })
      ];

      let sent = false;
      let sendAttemptedAt = '';
      for (const sLoc of sendLocators) {
        if (await sLoc.count() > 0
          && await sLoc.isVisible({ timeout: 2000 }).catch(() => false)
          && await sLoc.isEnabled().catch(() => false)) {
          sendAttemptedAt = new Date().toISOString();
          await sLoc.click({ timeout: 4000 });
          sent = true;
          break;
        }
      }

      if (sent) {
        const invitationSentToast = page.getByText(/invitation sent/i).first();
        const pendingStatus = page.locator([
          'main button:has-text("Pending")',
          'main [role="button"]:has-text("Pending")',
          'main [aria-label*="pending" i]',
          'main button:has-text("Invitation sent")',
          'main [role="button"]:has-text("Invitation sent")',
          'main button:has-text("Requested")',
          'main [role="button"]:has-text("Requested")'
        ].join(', ')).first();
        const waitForConfirmation = async locator => {
          try {
            await locator.waitFor({ state: 'visible', timeout: 5000 });
            return true;
          } catch {
            return locator.isVisible().catch(() => false);
          }
        };
        const confirmedByToast = await waitForConfirmation(invitationSentToast);
        const confirmedByPending = confirmedByToast
          ? false
          : await waitForConfirmation(pendingStatus);

        if (!confirmedByToast && !confirmedByPending) {
          this.logger(`LinkedIn did not confirm the invitation to ${candidate.personName}; recording it as unconfirmed and not counting it toward the target.`, 'warning');
          this.history.record({
            company: companyName,
            personName: candidate.personName,
            profileUrl: candidate.profileUrl,
            jobTitle: candidate.jobTitle,
            department: candidate.department,
            priorityRank: candidate.priorityRank,
            score: candidate.score,
            status: 'Unconfirmed',
            attemptedAt: sendAttemptedAt,
            message: msgObj.message,
            result: 'Send was clicked, but LinkedIn confirmation was not detected'
          });
          return { success: false, status: 'Unconfirmed', reason: 'LinkedIn confirmation was not detected' };
        }

        this.logger(`✓ LinkedIn confirmed the connection request with custom note for ${candidate.personName}.`, 'success');
        this.safety.recordRequestSent();
        const sentAt = sendAttemptedAt || new Date().toISOString();

        this.history.record({
          company: companyName,
          personName: candidate.personName,
          profileUrl: candidate.profileUrl,
          jobTitle: candidate.jobTitle,
          department: candidate.department,
          priorityRank: candidate.priorityRank,
          score: candidate.score,
          status: 'Sent',
          sentAt,
          message: msgObj.message,
          result: confirmedByToast
            ? 'LinkedIn confirmed invitation with custom note'
            : 'LinkedIn profile shows invitation pending with custom note'
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
