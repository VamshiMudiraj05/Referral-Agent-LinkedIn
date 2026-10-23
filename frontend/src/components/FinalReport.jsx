import React from 'react';
import { 
  Download, 
  RefreshCw, 
  ExternalLink 
} from 'lucide-react';

export default function FinalReport({ report, companyName, onNewCampaign }) {
  if (!report) return null;

  const { stats, records = [] } = report;
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const downloadCSV = () => {
    window.location.href = `/api/history/csv?company=${encodeURIComponent(companyName || '')}`;
  };

  return (
    <div className="card" style={{ padding: '32px', backgroundColor: 'var(--surface-main)' }}>
      {/* Report Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '26px',
        paddingBottom: '22px',
        borderBottom: '1px solid var(--border-divider)',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-success">Campaign Completed</span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{currentDate}</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Campaign Summary: {companyName || 'All Companies'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Final performance overview and evaluation summary of the referral outreach campaign.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={downloadCSV}
            className="btn btn-primary"
            style={{ padding: '8px 18px', fontSize: '13.5px', fontWeight: '500' }}
          >
            <Download size={14} />
            <span>Export as CSV</span>
          </button>

          <button
            onClick={onNewCampaign}
            className="btn btn-secondary"
            style={{ padding: '8px 18px', fontSize: '13.5px' }}
          >
            <RefreshCw size={14} />
            <span>Start New Campaign</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="kpi-grid" style={{ marginBottom: '30px' }}>
        <div className="kpi-card">
          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '500' }}>Requests sent</div>
          <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--success-green)', marginTop: '6px', lineHeight: 1 }}>
            {stats?.sent || 0}
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ fontSize: '12.5px', color: 'var(--accent-lavender)', fontWeight: '500' }}>HR / Talent outreach</div>
          <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--accent-lavender)', marginTop: '6px', lineHeight: 1 }}>
            {stats?.salesSent || 0}
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ fontSize: '12.5px', color: 'var(--action-blue)', fontWeight: '500' }}>IT / Engineering</div>
          <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--action-blue)', marginTop: '6px', lineHeight: 1 }}>
            {stats?.itSent || 0}
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '500' }}>Skipped candidates</div>
          <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1 }}>
            {stats?.skipped || 0}
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ fontSize: '12.5px', color: 'var(--warning-amber)', fontWeight: '500' }}>Already connected</div>
          <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--warning-amber)', marginTop: '6px', lineHeight: 1 }}>
            {stats?.alreadyConnected || 0}
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '500' }}>Failed / Blocked</div>
          <div style={{ fontSize: '28px', fontWeight: '600', color: (stats?.failed || 0) > 0 ? 'var(--error-rose)' : 'var(--text-muted)', marginTop: '6px', lineHeight: 1 }}>
            {stats?.failed || 0}
          </div>
        </div>
      </div>

      {/* Evaluated Candidates Table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Evaluated Candidates
          </h3>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {records.length} records in this campaign
          </span>
        </div>

        {records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
            No individual candidate actions recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-divider)', borderRadius: '12px' }}>
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Position</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Connection Note</th>
                  <th style={{ textAlign: 'right' }}>Profile</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => (
                  <tr key={r.id || idx}>
                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      {r.personName}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.jobTitle || '—'}
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ fontSize: '11.5px' }}>
                        {r.department || 'N/A'}
                      </span>
                    </td>
                    <td>
                      {r.status === 'Sent' ? (
                        <span className="badge badge-success">Sent</span>
                      ) : r.status === 'Skipped' ? (
                        <span className="badge badge-neutral">Skipped</span>
                      ) : (
                        <span className="badge badge-warning">{r.status || 'Processed'}</span>
                      )}
                    </td>
                    <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {r.message ? `"${r.message}"` : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {r.profileUrl && (
                        <a
                          href={r.profileUrl}
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
    </div>
  );
}
