import React, { useState } from 'react';
import { 
  Users, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  XCircle, 
  UserCheck, 
  LayoutGrid, 
  Table as TableIcon, 
  MapPin, 
  Search 
} from 'lucide-react';

export default function CandidateTable({ candidates = [], currentCompany }) {
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterGender, setFilterGender] = useState('ALL'); // 'ALL' | 'FEMALE' | 'MALE'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('score'); // 'score' | 'rank' | 'name'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  const filtered = candidates.filter(c => {
    if (filterDept === 'MUTUAL_ALUMNI' && !c.isMutual && !c.isAlumni) return false;
    if (filterDept === 'HR' && c.department !== 'HR / Talent') return false;
    if (filterDept === 'TECH' && c.department !== 'IT / Engineering') return false;

    if (filterGender === 'FEMALE' && c.gender !== 'female') return false;
    if (filterGender === 'MALE' && c.gender !== 'male') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (c.personName || '').toLowerCase().includes(q);
      const matchTitle = (c.jobTitle || c.headline || '').toLowerCase().includes(q);
      const matchLoc = (c.location || '').toLowerCase().includes(q);
      if (!matchName && !matchTitle && !matchLoc) return false;
    }

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
    <div className="card" style={{ padding: '26px 28px', backgroundColor: 'var(--surface-main)' }}>
      {/* Header and Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '22px',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="var(--action-blue)" />
            <span>Discovered Candidates</span>
            {currentCompany && (
              <span style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: '400' }}>
                at {currentCompany}
              </span>
            )}
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            AI-ranked professionals scored on Mutual Connections, Alumni affinity, and Department relevance.
          </p>
        </div>

        {/* Filter & View Switcher */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Department Filter Segmented Control */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--surface-secondary)',
            borderRadius: '8px',
            padding: '2px',
            border: '1px solid var(--border-divider)'
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
                  background: filterDept === f.id ? 'var(--surface-main)' : 'transparent',
                  border: 'none',
                  color: filterDept === f.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  padding: '5px 11px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: filterDept === f.id ? '600' : '500',
                  cursor: 'pointer',
                  boxShadow: filterDept === f.id ? '0 1px 2px rgba(23, 25, 29, 0.05)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Gender Filter Segmented Control */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--surface-secondary)',
            borderRadius: '8px',
            padding: '2px',
            border: '1px solid var(--border-divider)'
          }}>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'FEMALE', label: '♀ Female' },
              { id: 'MALE', label: '♂ Male' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterGender(f.id)}
                style={{
                  background: filterGender === f.id ? 'var(--surface-main)' : 'transparent',
                  border: 'none',
                  color: filterGender === f.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  padding: '5px 9px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: filterGender === f.id ? '600' : '500',
                  cursor: 'pointer',
                  boxShadow: filterGender === f.id ? '0 1px 2px rgba(23, 25, 29, 0.05)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, role..."
              style={{
                padding: '6px 12px 6px 30px',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1px solid var(--border-divider)',
                backgroundColor: 'var(--surface-input)',
                color: 'var(--text-primary)',
                outline: 'none',
                width: '165px'
              }}
            />
            <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          {/* Sort Dropdown */}
          <select
            className="select-input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '6px 12px', fontSize: '13px', width: 'auto', backgroundColor: 'var(--surface-input)' }}
          >
            <option value="score">Sort by Relevance</option>
            <option value="rank">Sort by Priority Rank</option>
            <option value="name">Sort by Name</option>
          </select>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', border: '1px solid var(--border-divider)', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                backgroundColor: viewMode === 'cards' ? 'var(--action-blue-subtle)' : 'var(--surface-main)',
                color: viewMode === 'cards' ? 'var(--action-blue)' : 'var(--text-secondary)',
                border: 'none',
                padding: '6px 10px',
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
                backgroundColor: viewMode === 'table' ? 'var(--action-blue-subtle)' : 'var(--surface-main)',
                color: viewMode === 'table' ? 'var(--action-blue)' : 'var(--text-secondary)',
                border: 'none',
                borderLeft: '1px solid var(--border-divider)',
                padding: '6px 10px',
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
        <div style={{ textAlign: 'center', padding: '52px 20px', color: 'var(--text-muted)' }}>
          <Users size={38} strokeWidth={1.5} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <div style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)' }}>
            No candidate profiles loaded yet.
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Launch a campaign to discover, verify, and rank relevant employees.
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        /* Professional Profile Cards Grid */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '16px'
        }}>
          {sorted.map((c, idx) => (
            <div
              key={c.profileUrl || idx}
              style={{
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                backgroundColor: 'var(--surface-secondary)',
                borderRadius: 'var(--radius-card-sm)',
                border: '1px solid var(--border-divider)',
                transition: 'border-color 0.15s ease'
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
                          border: '1px solid var(--border-divider)'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--action-blue-subtle)',
                        color: 'var(--action-blue)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '16px',
                        border: '1px solid var(--action-blue-border)'
                      }}>
                        {c.personName ? c.personName.charAt(0) : 'U'}
                      </div>
                    )}

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {c.personName}
                        </span>
                        {c.priorityRank && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>
                            #{c.priorityRank}
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        marginTop: '2px',
                        lineHeight: '1.35',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {c.jobTitle || c.headline}
                      </div>

                      {c.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          <MapPin size={12} color="var(--action-blue)" />
                          <span>{c.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {getStatusBadge(c)}
                </div>

                {/* Company & Department Badges */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', margin: '10px 0 14px' }}>
                  {getDeptBadge(c.department)}
                  {c.gender === 'female' && (
                    <span className="badge" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-rose)', border: '1px solid var(--error-border)', fontSize: '11.5px' }}>
                      ♀ Female {c.pronouns ? `(${c.pronouns})` : ''}
                    </span>
                  )}
                  {c.gender === 'male' && (
                    <span className="badge" style={{ backgroundColor: 'var(--action-blue-subtle)', color: 'var(--action-blue)', border: '1px solid var(--action-blue-border)', fontSize: '11.5px' }}>
                      ♂ Male {c.pronouns ? `(${c.pronouns})` : ''}
                    </span>
                  )}
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
                borderTop: '1px solid var(--border-divider)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '36px',
                    height: '6px',
                    backgroundColor: 'var(--border-divider)',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${c.score || 0}%`,
                      height: '100%',
                      backgroundColor: (c.score || 0) >= 80 ? 'var(--success-green)' : (c.score || 0) >= 60 ? 'var(--action-blue)' : 'var(--warning-amber)'
                    }} />
                  </div>
                  <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {c.score || 0}% Relevant
                  </span>
                </div>

                {c.profileUrl && (
                  <a
                    href={c.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ padding: '4px 11px', fontSize: '12px', textDecoration: 'none' }}
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
        <div style={{ overflowX: 'auto', border: '1px solid var(--border-divider)', borderRadius: '12px' }}>
          <table className="pro-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>Rank</th>
                <th>Candidate</th>
                <th>Role &amp; Title</th>
                <th>Location</th>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {c.avatar ? (
                        <img
                          src={c.avatar}
                          alt={c.personName}
                          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--action-blue-subtle)',
                          color: 'var(--action-blue)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '13px'
                        }}>
                          {c.personName ? c.personName.charAt(0) : 'U'}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{c.personName}</div>
                        {c.gender === 'female' && (
                          <span style={{ fontSize: '11px', color: 'var(--error-rose)', fontWeight: '500' }}>
                            ♀ Female {c.pronouns ? `(${c.pronouns})` : ''}
                          </span>
                        )}
                        {c.gender === 'male' && (
                          <span style={{ fontSize: '11px', color: 'var(--action-blue)', fontWeight: '500' }}>
                            ♂ Male {c.pronouns ? `(${c.pronouns})` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.jobTitle || c.headline}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.location ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} color="var(--action-blue)" /> {c.location}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td>{getDeptBadge(c.department)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {c.isMutual && <span className="badge badge-mutual">🤝 Mutual</span>}
                      {c.isAlumni && <span className="badge badge-alumni">🎓 Alumni</span>}
                      {!c.isMutual && !c.isAlumni && <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '13px' }}>
                      {c.score || 0}%
                    </span>
                  </td>
                  <td>{getStatusBadge(c)}</td>
                  <td style={{ textAlign: 'right' }}>
                    {c.profileUrl && (
                      <a
                        href={c.profileUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--action-blue)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '500' }}
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
