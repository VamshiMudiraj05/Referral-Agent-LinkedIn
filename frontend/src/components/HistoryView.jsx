import React, { useState } from 'react';
import { 
  History, 
  Download, 
  Search, 
  ExternalLink 
} from 'lucide-react';

export default function HistoryView({ history = [], lastCampaign = null }) {
  const [search, setSearch] = useState('');
  const [filterCompany, setFilterCompany] = useState('ALL');

  const companies = Array.from(new Set(history.map(h => h.company).filter(Boolean)));

  const filtered = history.filter(item => {
    const matchesSearch = 
      (item.personName || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.jobTitle || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.company || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesCompany = filterCompany === 'ALL' || item.company?.toLowerCase() === filterCompany.toLowerCase();

    return matchesSearch && matchesCompany;
  });

  const downloadAllCSV = () => {
    window.location.href = '/api/history/csv';
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'sent') {
      return <span className="badge badge-success">Sent</span>;
    }
    if (s === 'pending') {
      return <span className="badge badge-tech">Pending</span>;
    }
    if (s === 'skipped') {
      return <span className="badge badge-neutral">Skipped</span>;
    }
    if (s === 'unconfirmed') {
      return <span className="badge badge-error">Unconfirmed</span>;
    }
    if (s === 'failed' || s.includes('block') || s.includes('error')) {
      return <span className="badge badge-error">Failed</span>;
    }
    return <span className="badge badge-neutral">{status || 'Recorded'}</span>;
  };

  const formatDate = (isoOrTime) => {
    if (!isoOrTime) return '—';
    try {
      const d = new Date(isoOrTime);
      if (isNaN(d.getTime())) return isoOrTime;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return isoOrTime;
    }
  };

  const formatDateTime = (isoOrTime) => {
    if (!isoOrTime) return '—';
    const date = new Date(isoOrTime);
    if (Number.isNaN(date.getTime())) return isoOrTime;
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatCompanies = companies => Array.isArray(companies) ? companies.join(', ') : '—';

  return (
    <div className="card" style={{ padding: '28px', backgroundColor: 'var(--surface-main)' }}>
      {/* Last Campaign Summary Panel */}
      {lastCampaign && (
        <section
          aria-label="Last campaign details"
          className="scroll-reveal hover-lift"
          style={{
            padding: '18px 20px',
            marginBottom: '24px',
            border: '1px solid var(--border-divider)',
            borderRadius: 'var(--radius-card-sm)',
            backgroundColor: 'var(--surface-secondary)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>Last Campaign Details</h3>
            <span className={`badge ${lastCampaign.status === 'completed' ? 'badge-success' : lastCampaign.status === 'review_required' ? 'badge-error' : 'badge-neutral'}`}>
              {(lastCampaign.status || 'finished').replace(/_/g, ' ').replace(/^\w/, value => value.toUpperCase())}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: '12px', marginTop: '14px', fontSize: '13.5px' }}>
            <div><strong style={{ color: 'var(--text-primary)' }}>Companies:</strong> <span style={{ color: 'var(--text-secondary)' }}>{formatCompanies(lastCampaign.companies)}</span></div>
            <div><strong style={{ color: 'var(--text-primary)' }}>Successful target:</strong> <span style={{ color: 'var(--text-secondary)' }}>{lastCampaign.targetTotal ?? '—'} total / {lastCampaign.targetPerCompany ?? '—'} per company</span></div>
            <div><strong style={{ color: 'var(--text-primary)' }}>Mode:</strong> <span style={{ color: 'var(--text-secondary)' }}>{lastCampaign.approvalMode || '—'}</span></div>
            <div><strong style={{ color: 'var(--text-primary)' }}>Started:</strong> <span style={{ color: 'var(--text-secondary)' }}>{formatDateTime(lastCampaign.startedAt)}</span></div>
            <div><strong style={{ color: 'var(--text-primary)' }}>Finished:</strong> <span style={{ color: 'var(--text-secondary)' }}>{formatDateTime(lastCampaign.finishedAt)}</span></div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '14px', color: 'var(--text-secondary)', fontSize: '13px' }}>
            <span>Sent: <strong style={{ color: 'var(--success-green)' }}>{lastCampaign.stats?.sent ?? 0}</strong></span>
            <span>Skipped: <strong style={{ color: 'var(--text-primary)' }}>{lastCampaign.stats?.skipped ?? 0}</strong></span>
            <span>Pending: <strong style={{ color: 'var(--warning-amber)' }}>{lastCampaign.stats?.pending ?? 0}</strong></span>
            <span>Unconfirmed: <strong style={{ color: 'var(--error-rose)' }}>{lastCampaign.stats?.unconfirmed ?? 0}</strong></span>
            <span>Failed: <strong style={{ color: 'var(--error-rose)' }}>{lastCampaign.stats?.failed ?? 0}</strong></span>
          </div>
          {lastCampaign.stats?.unconfirmed > 0 && (
            <p role="alert" style={{ color: 'var(--error-rose)', fontSize: '12.5px', marginTop: '12px' }}>
              LinkedIn did not confirm these send attempts. Check the profiles directly before retrying; they may already have received invitations.
            </p>
          )}
        </section>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '22px',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <span className="section-tag">[ AUDIT // {history.length} EVALUATED PROFILES ]</span>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={20} color="var(--text-primary)" />
            <span>Outreach History &amp; Audit Log</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '2px' }}>
            Persistent log of all contacted and evaluated professionals across sessions to prevent duplicate outreach.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={downloadAllCSV}
            className="btn btn-secondary"
            style={{ padding: '7px 16px', fontSize: '12.5px', fontFamily: 'var(--font-mono)' }}
          >
            <Download size={13} />
            <span>DOWNLOAD CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            className="input-text"
            placeholder="Search candidate name, role, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '34px', fontSize: '13.5px' }}
          />
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        <select
          className="select-input"
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value)}
          style={{ width: 'auto', minWidth: '170px', fontSize: '13.5px', backgroundColor: 'var(--surface-input)' }}
        >
          <option value="ALL">All Companies ({history.length})</option>
          {companies.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '52px 20px', color: 'var(--text-muted)' }}>
          <History size={36} strokeWidth={1.5} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
          <div style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: '500' }}>
            No outreach history matching criteria.
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Completed candidate interactions will be logged here automatically.
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid var(--border-divider)', borderRadius: '12px' }}>
          <table className="pro-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Person</th>
                <th>Role</th>
                <th>Department</th>
                <th>Date / Sent time</th>
                <th>Status</th>
                <th>Message Note</th>
                <th style={{ textAlign: 'right' }}>Profile</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    {item.company}
                  </td>
                  <td style={{ fontWeight: '500' }}>
                    {item.personName}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.jobTitle || '—'}
                  </td>
                  <td>
                    <span className="badge badge-neutral" style={{ fontSize: '11.5px' }}>
                      {item.department || 'N/A'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>
                    {item.status === 'Sent' || item.status === 'Unconfirmed'
                      ? formatDateTime(item.sentAt || item.attemptedAt || item.date)
                      : formatDate(item.timestamp || item.date)}
                  </td>
                  <td>
                    {getStatusBadge(item.status)}
                  </td>
                  <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {item.message ? `"${item.message}"` : '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {item.profileUrl && (
                      <a
                        href={item.profileUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--action-blue)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '13px', fontWeight: '500' }}
                      >
                        Profile <ExternalLink size={12} />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
