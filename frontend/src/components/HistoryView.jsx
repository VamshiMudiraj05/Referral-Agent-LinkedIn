import React, { useState } from 'react';
import { 
  History, 
  Download, 
  Search, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

export default function HistoryView({ history = [] }) {
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

  return (
    <div className="card" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1D2226', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={20} color="#0A66C2" /> Outreach History
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '2px' }}>
            Permanent record of all contacted and evaluated professionals across sessions to prevent duplicate outreach.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={downloadAllCSV}
            className="btn btn-secondary"
            style={{ padding: '7px 14px', fontSize: '0.82rem' }}
          >
            <Download size={14} /> Download CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            className="input-text"
            placeholder="Search by candidate name, role, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '34px', fontSize: '0.84rem', padding: '8px 12px 8px 34px' }}
          />
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        <select
          className="select-input"
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value)}
          style={{ width: 'auto', minWidth: '160px', fontSize: '0.84rem', padding: '8px 12px' }}
        >
          <option value="ALL">All Companies ({history.length})</option>
          {companies.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          <History size={32} strokeWidth={1.5} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            No outreach history matching criteria.
          </div>
          <div style={{ fontSize: '0.8rem', marginTop: '2px' }}>
            Completed candidate interactions will be logged here automatically.
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <table className="pro-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Person</th>
                <th>Role</th>
                <th>Department</th>
                <th>Date</th>
                <th>Status</th>
                <th>Message Note</th>
                <th style={{ textAlign: 'right' }}>Profile</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td style={{ fontWeight: '600', color: '#1D2226' }}>
                    {item.company}
                  </td>
                  <td style={{ fontWeight: '500' }}>
                    {item.personName}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.jobTitle || '—'}
                  </td>
                  <td>
                    <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                      {item.department || 'N/A'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {formatDate(item.timestamp || item.date)}
                  </td>
                  <td>
                    {getStatusBadge(item.status)}
                  </td>
                  <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {item.message ? `"${item.message}"` : '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {item.profileUrl && (
                      <a
                        href={item.profileUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#0A66C2', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.78rem' }}
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
