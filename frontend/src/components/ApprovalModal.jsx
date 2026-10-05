import React, { useState } from 'react';
import { 
  Send, 
  SkipForward, 
  Square, 
  ExternalLink, 
  Edit2, 
  AlertCircle, 
  Briefcase, 
  Building2, 
  Check, 
  X,
  UserCheck
} from 'lucide-react';

export default function ApprovalModal({ data, onDecision }) {
  if (!data) return null;
  const { candidate, companyName, message, score, priorityRank } = data;
  const [currentMessage, setCurrentMessage] = useState(message || '');
  const [isEditing, setIsEditing] = useState(false);

  const charCount = currentMessage.length;
  const isOverLimit = charCount > 300;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '580px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#FFFFFF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="status-dot waiting" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#1D2226' }}>
              Human Approval Required
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="badge badge-neutral">Priority #{priorityRank || 1}</span>
            <span className="badge badge-tech" style={{ fontWeight: '600' }}>
              {score || 80}% Relevant
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px' }}>
          {/* Candidate Profile Card */}
          <div style={{
            backgroundColor: '#F8FAFC',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            padding: '16px',
            marginBottom: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              {candidate.avatar ? (
                <img
                  src={candidate.avatar}
                  alt={candidate.personName}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }}
                />
              ) : (
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#EBF4FD',
                  color: '#0A66C2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                  border: '1px solid #CBE2FB'
                }}>
                  {candidate.personName ? candidate.personName.charAt(0) : 'U'}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#1D2226' }}>
                    {candidate.personName}
                  </h4>
                  {candidate.profileUrl && (
                    <a
                      href={candidate.profileUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#0A66C2', display: 'flex', alignItems: 'center' }}
                      title="View Profile"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>

                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {candidate.verifiedTitle || candidate.jobTitle}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                  <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                    {companyName}
                  </span>
                  <span className="badge badge-tech" style={{ fontSize: '0.72rem' }}>
                    {candidate.department}
                  </span>
                  {candidate.isMutual && (
                    <span className="badge badge-mutual" style={{ fontSize: '0.72rem' }}>
                      🤝 Mutual Connection
                    </span>
                  )}
                  {candidate.isAlumni && (
                    <span className="badge badge-alumni" style={{ fontSize: '0.72rem' }}>
                      🎓 Alumni
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Score Breakdown factors */}
            {candidate.breakdown && (
              <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.74rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Score factors:</span>
                <span style={{ color: 'var(--text-secondary)' }}>Dept: +{candidate.breakdown.department}</span>
                <span style={{ color: 'var(--text-secondary)' }}>• Seniority: +{candidate.breakdown.seniority}</span>
                <span style={{ color: 'var(--text-secondary)' }}>• Technical: +{candidate.breakdown.technical}</span>
                <span style={{ color: 'var(--text-secondary)' }}>• Affinity: +{candidate.breakdown.connection}</span>
              </div>
            )}
          </div>

          {/* Connection Note Section */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#1D2226' }}>
                Connection note preview
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: isOverLimit ? '#CC1016' : charCount > 260 ? '#915907' : 'var(--text-muted)'
                }}>
                  {charCount} / 300 chars
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0A66C2',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                >
                  <Edit2 size={12} />
                  <span>{isEditing ? 'Done' : 'Edit Note'}</span>
                </button>
              </div>
            </div>

            {isEditing ? (
              <textarea
                className="textarea"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                rows={3}
                style={{ borderColor: isOverLimit ? '#CC1016' : undefined }}
              />
            ) : (
              <div style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '12px 14px',
                fontSize: '0.85rem',
                lineHeight: '1.5',
                color: '#1D2226',
                fontStyle: 'normal'
              }}>
                "{currentMessage}"
              </div>
            )}

            {isOverLimit && (
              <div style={{ color: '#CC1016', fontSize: '0.76rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={13} /> Note exceeds LinkedIn's 300 character limit! Please shorten before sending.
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border)',
          backgroundColor: '#F8FAFC',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px'
        }}>
          <button
            onClick={() => onDecision({ action: 'stop' })}
            className="btn btn-danger"
            style={{ padding: '7px 12px', fontSize: '0.82rem' }}
          >
            <Square size={13} fill="#CC1016" /> Stop Campaign
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onDecision({ action: 'skip' })}
              className="btn btn-secondary"
              style={{ padding: '7px 14px', fontSize: '0.82rem' }}
            >
              <SkipForward size={14} /> Skip Candidate
            </button>

            <button
              onClick={() => onDecision({ action: 'approve', editedMessage: currentMessage })}
              disabled={isOverLimit}
              className="btn btn-primary"
              style={{ padding: '7px 18px', fontSize: '0.84rem' }}
            >
              <Send size={14} /> Approve & Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
