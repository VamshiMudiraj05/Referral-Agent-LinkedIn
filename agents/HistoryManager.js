const fs = require('fs');
const path = require('path');

class HistoryManager {
  constructor(dataDir = path.join(__dirname, '..', 'data')) {
    this.dataDir = dataDir;
    this.filePath = path.join(this.dataDir, 'history.json');
    this.records = [];
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
      } else {
        this.records = [];
        fs.writeFileSync(this.filePath, JSON.stringify(this.records, null, 2), 'utf-8');
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

  isDuplicate(profileUrl, company = '', name = '') {
    const cleanUrl = this.normalizeUrl(profileUrl);
    return this.records.some(r => {
      const matchUrl = cleanUrl && this.normalizeUrl(r.profileUrl) === cleanUrl;
      const matchName = name && r.personName && 
        r.personName.toLowerCase().trim() === name.toLowerCase().trim();
      const matchNameCompany = name && company && 
        r.company?.toLowerCase().trim() === company.toLowerCase().trim() &&
        r.personName?.toLowerCase().trim() === name.toLowerCase().trim();
      return (matchUrl || matchNameCompany || matchName) && (r.status === 'Sent' || r.status === 'Pending' || r.status === 'Already Connected');
    });
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
      date: entry.date || new Date().toISOString(),
      status: entry.status || 'Pending', // Sent, Skipped, Already Connected, Pending, Not Relevant, Failed, Note Unavailable, Profile Unavailable
      message: entry.message || '',
      result: entry.result || '',
      notes: entry.notes || ''
    };

    // Update if already exists with same profile URL, else append
    const existingIndex = this.records.findIndex(r => this.normalizeUrl(r.profileUrl) === record.profileUrl);
    if (existingIndex >= 0) {
      this.records[existingIndex] = { ...this.records[existingIndex], ...record };
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
      failed: target.filter(r => r.status === 'Failed' || r.status === 'Note Unavailable').length,
      salesSent: target.filter(r => r.status === 'Sent' && (r.department === 'Sales' || r.department === 'HR / Talent' || r.department === 'HR')).length,
      itSent: target.filter(r => r.status === 'Sent' && (r.department === 'IT' || r.department === 'Engineering' || r.department === 'IT / Engineering')).length
    };
  }

  exportCSV(company = null) {
    const records = company 
      ? this.records.filter(r => r.company.toLowerCase().trim() === company.toLowerCase().trim())
      : this.records;

    const headers = ['Company', 'Name', 'Job Title', 'Department', 'Score', 'Status', 'Date', 'Profile URL', 'Message Used', 'Result Notes'];
    const rows = records.map(r => [
      `"${(r.company || '').replace(/"/g, '""')}"`,
      `"${(r.personName || '').replace(/"/g, '""')}"`,
      `"${(r.jobTitle || '').replace(/"/g, '""')}"`,
      `"${(r.department || '').replace(/"/g, '""')}"`,
      r.score || 0,
      `"${(r.status || '').replace(/"/g, '""')}"`,
      `"${(r.date || '').replace(/"/g, '""')}"`,
      `"${(r.profileUrl || '').replace(/"/g, '""')}"`,
      `"${(r.message || '').replace(/"/g, '""')}"`,
      `"${(r.result || r.notes || '').replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}

module.exports = HistoryManager;
