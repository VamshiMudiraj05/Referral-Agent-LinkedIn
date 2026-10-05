import React, { useState } from 'react';
import { 
  Users, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  XCircle, 
  UserCheck, 
  GraduationCap,
  Briefcase,
  LayoutGrid,
  Table as TableIcon,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';

export default function CandidateTable({ candidates = [], currentCompany }) {
  const [filterDept, setFilterDept] = useState('ALL');
  const [sortBy, setSortBy] = useState('score'); // 'score' | 'rank' | 'name'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  const filtered = candidates.filter(c => {
    if (filterDept === 'ALL') return true;
    if (filterDept === 'MUTUAL_ALUMNI') return c.isMutual || c.isAlumni;
    if (filterDept === 'HR') return c.department === 'HR / Talent';
    if (filterDept === 'TECH') return c.department === 'IT / Engineering';
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'score') return (b.score || 0) - (a.score || 0);
    if (sortBy === 'rank') return (a.priorityRank || 99) - (b.priorityRank || 99);
    if (sortBy === 'name') return (a.personName || '').localeCompare(b.personName || '');
    return 0;
  });

  const getStatusBadge = (c) => {
    if (c.isAlreadyConnected) {
      return <span className="badge badge-neutral"><UserCheck size={12} /> Connected</span>;
    }
    if (c.isPending) {
      return <span className="badge badge-warning"><Clock size={12} /> Pending</span>;
    }
    if (c.status === 'Sent') {
      return <span className="badge badge-success"><CheckCircle size={12} /> Sent</span>;
    }
    if (c.status === 'Skipped') {
      return <span className="badge badge-neutral"><XCircle size={12} /> Skipped</span>;
    }
    return <span className="badge badge-neutral">Discovered</span>;
  };

  const getDeptBadge = (dept) => {
    if (dept === 'HR / Talent') {
      return <span className="badge badge-talent">HR / Talent</span>;
    }
    if (dept === 'IT / Engineering' || dept === 'Engineering' || dept === 'IT') {
      return <span className="badge badge-tech">Engineering</span>;
    }
    if (dept === 'Sales' || dept === 'Business Development') {
      return <span className="badge badge-sales">Sales / BD</span>;
    }
    return <span className="badge badge-neutral">{dept || 'Other'}</span>;
  };

  return (
    <div className="card" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
      {/* Header and Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1D2226', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="#0A66C2" /> Discovered Candidates
            {currentCompany && (
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '400' }}>
                at {currentCompany}
              </span>
            )}
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            AI-ranked employees based on Mutual Connections, Alumni affinity, and Department relevance.
          </p>
        </div>

        {/* Filter & View Switcher */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Department Filter Pills */}
          <div style={{
            display: 'flex',
            backgroundColor: '#F8FAFC',
            borderRadius: '6px',
            padding: '2px',
            border: '1px solid var(--border)'
          }}>
            {[
              { id: 'ALL', label: `All (${candidates.length})` },
              { id: 'MUTUAL_ALUMNI', label: 'Mutuals & Alumni' },
              { id: 'HR', label: 'HR / Talent' },
              { id: 'TECH', label: 'Engineering' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterDept(f.id)}
                style={{
                  background: filterDept === f.id ? '#FFFFFF' : 'transparent',
                  border: filterDept === f.id ? '1px solid var(--border)' : 'none',
                  color: filterDept === f.id ? '#0A66C2' : 'var(--text-secondary)',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  fontWeight: filterDept === f.id ? '600' : '500',
                  cursor: 'pointer',
                  boxShadow: filterDept === f.id ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <select
              className="select-input"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ padding: '5px 10px', fontSize: '0.78rem', width: 'auto', backgroundColor: '#F8FAFC' }}
            >
              <option value="score">Sort by Relevance</option>
              <option value="rank">Sort by Priority Rank</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                backgroundColor: viewMode === 'cards' ? '#EBF4FD' : '#FFFFFF',
                color: viewMode === 'cards' ? '#0A66C2' : 'var(--text-secondary)',
                border: 'none',
                padding: '6px 9px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Cards View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                backgroundColor: viewMode === 'table' ? '#EBF4FD' : '#FFFFFF',
                color: viewMode === 'table' ? '#0A66C2' : 'var(--text-secondary)',
                border: 'none',
                borderLeft: '1px solid var(--border)',
                padding: '6px 9px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Table View"
            >
              <TableIcon size={15} />
            </button>
          </div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          <Users size={36} strokeWidth={1.5} style={{ margin: '0 auto 12px', opacity: 0.6 }} />
          <div style={{ fontSize: '0.92rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
            No candidate profiles loaded yet.
          </div>
          <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>
            Launch a campaign to discover and rank employees from the target company.
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        /* Professional Profile Cards Grid */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '14px'
        }}>
          {sorted.map((c, idx) => (
            <div
              key={c.profileUrl || idx}
              className="card"
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}
            >
              {/* Card Top: Avatar, Name, Title, Badges */}
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {c.avatar ? (
                      <img
                        src={c.avatar}
                        alt={c.personName}
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1px solid var(--border)'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        backgroundColor: '#EBF4FD',
                        color: '#0A66C2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '1rem',
                        border: '1px solid #CBE2FB'
                      }}>
                        {c.personName ? c.personName.charAt(0) : 'U'}
                      </div>
                    )}

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1D2226' }}>
                          {c.personName}
                        </span>
                        {c.priorityRank && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            #{c.priorityRank}
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)',
                        marginTop: '1px',
                        lineHeight: '1.3',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {c.jobTitle || c.headline}
                      </div>
                    </div>
                  </div>

                  {getStatusBadge(c)}
                </div>

                {/* Company & Department Badges */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', margin: '8px 0 12px' }}>
                  {getDeptBadge(c.department)}
                  {c.isMutual && (
                    <span className="badge badge-mutual">🤝 Mutual Connection</span>
                  )}
                  {c.isAlumni && (
                    <span className="badge badge-alumni">🎓 College Alumni</span>
                  )}
                </div>
              </div>

              {/* Card Bottom: Relevance Score & Action */}
              <div style={{
                paddingTop: '12px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '32px',
                    height: '6px',
                    backgroundColor: '#E2E8F0',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${c.score || 0}%`,
                      height: '100%',
                      backgroundColor: (c.score || 0) >= 80 ? '#057642' : (c.score || 0) >= 60 ? '#0A66C2' : '#915907'
                    }} />
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#1D2226' }}>
                    {c.score || 0}% Relevant
                  </span>
                </div>

                {c.profileUrl && (
                  <a
                    href={c.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.76rem', textDecoration: 'none' }}
                  >
                    <span>View Profile</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Professional Compact Table View */
        <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <table className="pro-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>Rank</th>
                <th>Candidate</th>
                <th>Role & Title</th>
                <th>Department</th>
                <th>Affinity Signals</th>
                <th>Relevance</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Profile</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, idx) => (
                <tr key={c.profileUrl || idx}>
                  <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>
                    #{c.priorityRank || idx + 1}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {c.avatar ? (
                        <img
                          src={c.avatar}
                          alt={c.personName}
                          style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: '#EBF4FD',
                          color: '#0A66C2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '0.75rem'
                        }}>
                          {c.personName ? c.personName.charAt(0) : 'U'}
                        </div>
                      )}
                      <span style={{ fontWeight: '600', color: '#1D2226' }}>{c.personName}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.jobTitle || c.headline}
                  </td>
                  <td>{getDeptBadge(c.department)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {c.isMutual && <span className="badge badge-mutual">🤝 Mutual</span>}
                      {c.isAlumni && <span className="badge badge-alumni">🎓 Alumni</span>}
                      {!c.isMutual && !c.isAlumni && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: '600', color: '#1D2226', fontSize: '0.82rem' }}>
                        {c.score || 0}%
                      </span>
                    </div>
                  </td>
                  <td>{getStatusBadge(c)}</td>
                  <td style={{ textAlign: 'right' }}>
                    {c.profileUrl && (
                      <a
                        href={c.profileUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#0A66C2', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}
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
