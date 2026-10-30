import React, { useState } from 'react';
import { 
  Send, 
  SkipForward, 
  Square, 
  ExternalLink, 
  Edit2, 
  AlertCircle,
  MapPin
} from 'lucide-react';

export default function ApprovalModal({ data, onDecision }) {
  const [currentMessage, setCurrentMessage] = useState(data?.message || '');
  const [isEditing, setIsEditing] = useState(false);

  if (!data) return null;
  const { candidate, companyName, score, priorityRank, canSend = true, verificationReason } = data;

  const charCount = currentMessage.length;
  const isOverLimit = charCount > 300;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(23, 25, 29, 0.45)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '580px',
        width: '100%',
        backgroundColor: 'var(--surface-main)',
        borderRadius: 'var(--radius-card)',
        border: '1px solid var(--border-divider)',
        boxShadow: 'var(--shadow-modal)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid var(--border-divider)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--surface-main)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <span className="status-dot waiting" />
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              HUMAN APPROVAL GATE
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="badge badge-neutral" style={{ fontSize: '11px' }}>RANK #{priorityRank || 1}</span>
            <span className="badge badge-tech" style={{ fontWeight: '700', fontSize: '11px' }}>
              {score || 80}% MATCH
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '22px' }}>
          {/* Candidate Profile Card */}
          <div style={{
            backgroundColor: 'var(--surface-secondary)',
            borderRadius: 'var(--radius-card-sm)',
            border: '1px solid var(--border-divider)',
            padding: '18px',
            marginBottom: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              {candidate.avatar ? (
                <img
                  src={candidate.avatar}
                  alt={candidate.personName}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-divider)' }}
                />
              ) : (
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--action-blue-subtle)',
                  color: 'var(--action-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '17px',
                  border: '1px solid var(--action-blue-border)'
                }}>
                  {candidate.personName ? candidate.personName.charAt(0) : 'U'}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {candidate.personName}
                  </h4>
                  {candidate.profileUrl && (
                    <a
                      href={candidate.profileUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--action-blue)', display: 'flex', alignItems: 'center' }}
                      title="View Profile"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>

                <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.35 }}>
                  {candidate.verifiedTitle || candidate.jobTitle}
                </div>

                {(candidate.verifiedLocation || candidate.location) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    <MapPin size={12} color="var(--action-blue)" />
                    <span>{candidate.verifiedLocation || candidate.location}</span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <span className="badge badge-neutral" style={{ fontSize: '11.5px' }}>
                    {companyName}
                  </span>
                  <span className="badge badge-tech" style={{ fontSize: '11.5px' }}>
                    {candidate.department}
                  </span>
                  {candidate.gender === 'female' && (
                    <span className="badge" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-rose)', border: '1px solid var(--error-border)', fontSize: '11.5px' }}>
                      ♀ Female {candidate.pronouns ? `(${candidate.pronouns})` : ''}
                    </span>
                  )}
                  {candidate.gender === 'male' && (
                    <span className="badge" style={{ backgroundColor: 'var(--action-blue-subtle)', color: 'var(--action-blue)', border: '1px solid var(--action-blue-border)', fontSize: '11.5px' }}>
                      ♂ Male {candidate.pronouns ? `(${candidate.pronouns})` : ''}
                    </span>
                  )}
                  {candidate.isMutual && (
                    <span className="badge badge-mutual" style={{ fontSize: '11.5px' }}>
                      🤝 Mutual Connection
                    </span>
                  )}
                  {candidate.isAlumni && (
                    <span className="badge badge-alumni" style={{ fontSize: '11.5px' }}>
                      🎓 Alumni
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Score Breakdown factors */}
            {candidate.breakdown && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid var(--border-divider)', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Score factors:</span>
                <span style={{ color: 'var(--text-secondary)' }}>Dept: +{candidate.breakdown.department}</span>
                <span style={{ color: 'var(--text-secondary)' }}>• Seniority: +{candidate.breakdown.seniority}</span>
                <span style={{ color: 'var(--text-secondary)' }}>• Technical: +{candidate.breakdown.technical}</span>
                <span style={{ color: 'var(--text-secondary)' }}>• Affinity: +{candidate.breakdown.connection}</span>
              </div>
            )}
          </div>

          {!canSend ? (
            <div role="alert" style={{
              marginBottom: '18px',
              padding: '13px 15px',
              border: '1px solid var(--error-border)',
              borderRadius: '8px',
              backgroundColor: 'var(--error-bg)',
              color: 'var(--error-rose)',
              fontSize: '13.5px',
              lineHeight: '1.5'
            }}>
              Profile verification failed. Sending is disabled. {verificationReason}
            </div>
          ) : (
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Connection note preview
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: isOverLimit ? 'var(--error-rose)' : charCount > 260 ? 'var(--warning-amber)' : 'var(--text-secondary)'
                  }}>
                    {charCount} / 300 chars
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--action-blue)',
                      cursor: 'pointer',
                      fontSize: '12.5px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Edit2 size={12} />
                    <span>{isEditing ? 'Done Editing' : 'Edit Note'}</span>
                  </button>
                </div>
              </div>

              {isEditing ? (
                <textarea
                  className="textarea"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  rows={3}
                  style={{ borderColor: isOverLimit ? 'var(--error-rose)' : undefined }}
                />
              ) : (
                <div style={{
                  backgroundColor: 'var(--surface-secondary)',
                  border: '1px solid var(--border-divider)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontSize: '13.5px',
                  lineHeight: '1.5',
                  color: 'var(--text-primary)'
                }}>
                  "{currentMessage}"
                </div>
              )}

              {isOverLimit && (
                <div style={{ color: 'var(--error-rose)', fontSize: '12.5px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <AlertCircle size={14} /> Note exceeds LinkedIn's 300 character limit! Please shorten before sending.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div style={{
          padding: '16px 22px',
          borderTop: '1px solid var(--border-divider)',
          backgroundColor: 'var(--surface-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button
            onClick={() => onDecision({ action: 'stop' })}
            className="btn btn-danger"
            style={{ padding: '8px 14px', fontSize: '12.5px', fontFamily: 'var(--font-mono)' }}
          >
            <Square size={13} fill="currentColor" />
            <span>STOP CAMPAIGN</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onDecision({ action: 'skip' })}
              className="btn btn-secondary"
              style={{ padding: '8px 15px', fontSize: '12.5px', fontFamily: 'var(--font-mono)' }}
            >
              <SkipForward size={13} />
              <span>SKIP</span>
            </button>

            <button
              onClick={() => canSend && onDecision({ action: 'approve', editedMessage: currentMessage })}
              disabled={!canSend || isOverLimit}
              className="btn btn-primary"
              style={{ padding: '8px 18px', fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-mono)', opacity: !canSend ? 0.55 : 1 }}
            >
              <Send size={13} />
              <span>{canSend ? 'APPROVE & SEND →' : 'SENDING DISABLED'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
