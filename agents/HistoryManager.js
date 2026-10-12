const fs = require('fs');
const path = require('path');

class HistoryManager {
  constructor(dataDir = path.join(__dirname, '..', 'data')) {
    this.dataDir = dataDir;
    this.filePath = path.join(this.dataDir, 'history.json');
    this.lastCampaignPath = path.join(this.dataDir, 'last-campaign.json');
    this.records = [];
    this.lastCampaign = null;
    this.currentCampaignId = null;
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        this.records = JSON.parse(data);
        let migratedRecords = false;
        for (const record of this.records) {
          if (record.status === 'Unconfirmed' && !record.attemptedAt) {
            record.attemptedAt = record.date || '';
            migratedRecords = true;
          }
        }
        if (migratedRecords) this.save();
      } else {
        this.records = [];
        fs.writeFileSync(this.filePath, JSON.stringify(this.records, null, 2), 'utf-8');
      }
      if (fs.existsSync(this.lastCampaignPath)) {
        this.lastCampaign = JSON.parse(fs.readFileSync(this.lastCampaignPath, 'utf-8'));
        this.refreshLastCampaignSummary();
      }
    } catch (err) {
      console.error('HistoryManager init error:', err);
      this.records = [];
    }
  }

  save() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.records, null, 2), 'utf-8');
    } catch (err) {
      console.error('HistoryManager save error:', err);
    }
  }

  getAll() {
    return [...this.records];
  }

  saveLastCampaign(summary) {
    this.lastCampaign = summary;
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.lastCampaignPath, JSON.stringify(summary, null, 2), 'utf-8');
    } catch (err) {
      console.error('HistoryManager last campaign save error:', err);
    }
    return this.lastCampaign;
  }

  refreshLastCampaignSummary() {
    if (!this.lastCampaign) return;

    const companyNames = (this.lastCampaign.companies || []).map(company => company.toLowerCase().trim());
    const startedAt = new Date(this.lastCampaign.startedAt || 0).getTime();
    const finishedAt = new Date(this.lastCampaign.finishedAt || Date.now()).getTime();
    const campaignId = this.lastCampaign.campaignId || `legacy-${startedAt}`;
    const campaignRecords = this.records.filter(record => {
      if (record.campaignId) {
        return record.campaignId === campaignId;
      }
      const timestamp = new Date(record.date || 0).getTime();
      return Number.isFinite(timestamp)
        && timestamp >= startedAt
        && timestamp <= finishedAt
        && companyNames.includes((record.company || '').toLowerCase().trim());
    });
    let migratedRecords = false;
    for (const record of campaignRecords) {
      if (!record.campaignId) {
        record.campaignId = campaignId;
        migratedRecords = true;
      }
    }
    if (migratedRecords) this.save();
    const stats = {
      sent: campaignRecords.filter(record => record.status === 'Sent').length,
      skipped: campaignRecords.filter(record => record.status === 'Skipped').length,
      pending: campaignRecords.filter(record => record.status === 'Pending').length,
      unconfirmed: campaignRecords.filter(record => record.status === 'Unconfirmed').length,
      failed: campaignRecords.filter(record => ['Failed', 'Note Unavailable'].includes(record.status)).length
    };
    const status = stats.unconfirmed > 0 ? 'review_required' : this.lastCampaign.status;
    if (JSON.stringify(stats) !== JSON.stringify(this.lastCampaign.stats)
      || status !== this.lastCampaign.status
      || this.lastCampaign.campaignId !== campaignId) {
      this.saveLastCampaign({ ...this.lastCampaign, campaignId, stats, status });
    }
  }

  isDuplicate(profileUrl, company = '', name = '') {
    const cleanUrl = this.normalizeUrl(profileUrl);
    if (!cleanUrl) return false;
    return this.records.some(r =>
      this.normalizeUrl(r.profileUrl) === cleanUrl
      && ['Sent', 'Pending', 'Already Connected', 'Unconfirmed'].includes(r.status)
    );
  }

  normalizeUrl(url) {
    if (!url) return '';
    try {
      const u = new URL(url.startsWith('http') ? url : `https://www.linkedin.com${url}`);
      return `${u.origin}${u.pathname.replace(/\/$/, '')}`;
    } catch {
      return url.split('?')[0].replace(/\/$/, '');
    }
  }

  record(entry) {
    const record = {
      id: Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      company: entry.company || '',
      personName: entry.personName || 'Unknown',
      profileUrl: this.normalizeUrl(entry.profileUrl || ''),
      jobTitle: entry.jobTitle || '',
      department: entry.department || '',
      priorityRank: entry.priorityRank || null,
      score: entry.score || 0,
      campaignId: entry.campaignId || this.currentCampaignId || '',
      date: entry.date || new Date().toISOString(),
      sentAt: entry.sentAt || (entry.status === 'Sent' ? new Date().toISOString() : ''),
      attemptedAt: entry.attemptedAt || '',
      status: entry.status || 'Pending', // Sent, Skipped, Already Connected, Pending, Not Relevant, Failed, Note Unavailable, Profile Unavailable
      message: entry.message || '',
      result: entry.result || '',
      notes: entry.notes || ''
    };

    // Update if already exists with same profile URL, else append
    const existingIndex = this.records.findIndex(r => this.normalizeUrl(r.profileUrl) === record.profileUrl);
    if (existingIndex >= 0) {
      const previous = this.records[existingIndex];
      this.records[existingIndex] = {
        ...previous,
        ...record,
        sentAt: record.sentAt || previous.sentAt || '',
        attemptedAt: record.attemptedAt || previous.attemptedAt || ''
      };
    } else {
      this.records.unshift(record);
    }
    this.save();
    return record;
  }

  updateStatus(profileUrl, status, result = '') {
    const norm = this.normalizeUrl(profileUrl);
    const item = this.records.find(r => this.normalizeUrl(r.profileUrl) === norm);
    if (item) {
      item.status = status;
      if (result) item.result = result;
      this.save();
      return item;
    }
    return null;
  }

  getStats(company = null) {
    const target = company 
      ? this.records.filter(r => r.company.toLowerCase().trim() === company.toLowerCase().trim())
      : this.records;

    return {
      total: target.length,
      sent: target.filter(r => r.status === 'Sent').length,
      skipped: target.filter(r => r.status === 'Skipped').length,
      alreadyConnected: target.filter(r => r.status === 'Already Connected').length,
      pending: target.filter(r => r.status === 'Pending').length,
      unconfirmed: target.filter(r => r.status === 'Unconfirmed').length,
      failed: target.filter(r => r.status === 'Failed' || r.status === 'Note Unavailable').length,
      salesSent: target.filter(r => r.status === 'Sent' && (r.department === 'Sales' || r.department === 'HR / Talent' || r.department === 'HR')).length,
      itSent: target.filter(r => r.status === 'Sent' && (r.department === 'IT' || r.department === 'Engineering' || r.department === 'IT / Engineering')).length
    };
  }

  exportCSV(company = null) {
    const records = company 
      ? this.records.filter(r => r.company.toLowerCase().trim() === company.toLowerCase().trim())
      : this.records;

    const headers = ['Company', 'Name', 'Job Title', 'Department', 'Score', 'Status', 'Date', 'Sent At', 'Attempted At', 'Profile URL', 'Message Used', 'Result Notes'];
    const rows = records.map(r => [
      `"${(r.company || '').replace(/"/g, '""')}"`,
      `"${(r.personName || '').replace(/"/g, '""')}"`,
      `"${(r.jobTitle || '').replace(/"/g, '""')}"`,
      `"${(r.department || '').replace(/"/g, '""')}"`,
      r.score || 0,
      `"${(r.status || '').replace(/"/g, '""')}"`,
      `"${(r.date || '').replace(/"/g, '""')}"`,
      `"${(r.sentAt || '').replace(/"/g, '""')}"`,
      `"${(r.attemptedAt || '').replace(/"/g, '""')}"`,
      `"${(r.profileUrl || '').replace(/"/g, '""')}"`,
      `"${(r.message || '').replace(/"/g, '""')}"`,
      `"${(r.result || r.notes || '').replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}

module.exports = HistoryManager;
