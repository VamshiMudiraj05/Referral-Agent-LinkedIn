import React from 'react';
import { 
  Download, 
  CheckCircle, 
  XCircle, 
  Users, 
  ExternalLink, 
  RefreshCw, 
  Briefcase, 
  Code,
  FileText
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
    <div className="card" style={{ padding: '28px', backgroundColor: '#FFFFFF' }}>
      {/* Report Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px',
        paddingBottom: '20px',
        borderBottom: '1px solid var(--border)',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-success">Campaign Completed</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{currentDate}</span>
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: '600', color: '#1D2226' }}>
            Campaign Summary: {companyName || 'All Companies'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
            Final performance overview and evaluation summary of the referral outreach campaign.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={downloadCSV}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.84rem' }}
          >
            <Download size={14} /> Export as CSV
          </button>

          <button
            onClick={onNewCampaign}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.84rem' }}
          >
            <RefreshCw size={14} /> Start New Campaign
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="kpi-grid" style={{ marginBottom: '28px' }}>
        <div style={{ backgroundColor: '#F8FAFC', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Requests sent</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#057642', marginTop: '4px' }}>
            {stats?.sent || 0}
          </div>
        </div>

        <div style={{ backgroundColor: '#F8FAFC', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.74rem', color: '#6B21A8', fontWeight: '500' }}>HR / Talent outreach</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#6B21A8', marginTop: '4px' }}>
            {stats?.salesSent || 0}
          </div>
        </div>

        <div style={{ backgroundColor: '#F8FAFC', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.74rem', color: '#0A66C2', fontWeight: '500' }}>IT / Engineering outreach</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0A66C2', marginTop: '4px' }}>
            {stats?.itSent || 0}
          </div>
        </div>

        <div style={{ backgroundColor: '#F8FAFC', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Skipped candidates</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {stats?.skipped || 0}
          </div>
        </div>

        <div style={{ backgroundColor: '#F8FAFC', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Already connected</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {stats?.alreadyConnected || 0}
          </div>
        </div>

        <div style={{ backgroundColor: '#F8FAFC', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Failed / Blocked</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: (stats?.failed || 0) > 0 ? '#CC1016' : 'var(--text-muted)', marginTop: '4px' }}>
            {stats?.failed || 0}
          </div>
        </div>
      </div>

      {/* Evaluated Candidates Table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1D2226' }}>
            Evaluated Candidates
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {records.length} records in this campaign
          </span>
        </div>

        {records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No individual candidate actions recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
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
                    <td style={{ fontWeight: '600', color: '#1D2226' }}>
                      {r.personName}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.jobTitle || '—'}
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
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
                    <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {r.message ? `"${r.message}"` : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {r.profileUrl && (
                        <a
                          href={r.profileUrl}
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
    </div>
  );
}
