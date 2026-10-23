import React, { useState } from 'react';
import { 
  Building2, 
  Globe, 
  Users, 
  Code, 
  CheckCircle2, 
  Edit3, 
  ArrowRight, 
  ExternalLink, 
  ShieldCheck, 
  Target 
} from 'lucide-react';

export default function CompanyVerification({ companySummary, onDecision }) {
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [editedMessage, setEditedMessage] = useState('');

  if (!companySummary) return null;

  return (
    <div className="card" style={{ padding: '28px', marginBottom: '22px', backgroundColor: 'var(--surface-main)' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-success">
              <ShieldCheck size={13} /> Official Page Verified
            </span>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Discovery Stage Complete</span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={24} color="var(--action-blue)" />
            <span>{companySummary.companyName}</span>
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
            {companySummary.officialUrl && (
              <a
                href={companySummary.officialUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--action-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}
              >
                LinkedIn Page <ExternalLink size={12} />
              </a>
            )}
            {companySummary.website && (
              <a
                href={companySummary.website}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Globe size={13} /> Website <ExternalLink size={11} />
              </a>
            )}
            <span>Industry: <strong style={{ color: 'var(--text-primary)' }}>{companySummary.industry || 'Technology'}</strong></span>
            <span>Location: <strong style={{ color: 'var(--text-primary)' }}>{companySummary.location || 'Global'}</strong></span>
            {companySummary.followers > 0 && (
              <span>Followers: <strong style={{ color: 'var(--text-primary)' }}>{companySummary.followers.toLocaleString()}</strong></span>
            )}
            {companySummary.locationFilter && (
              <span className="badge badge-tech" style={{ fontSize: '12px' }}>
                📍 Filter: {companySummary.locationFilter}
              </span>
            )}
            {companySummary.genderFilter && companySummary.genderFilter !== 'all' && (
              <span className="badge badge-talent" style={{ fontSize: '12px' }}>
                👤 Gender: {companySummary.genderFilter.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Discovery Breakdown Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px',
        marginBottom: '22px'
      }}>
        <div style={{ backgroundColor: 'var(--surface-secondary)', borderRadius: '10px', padding: '14px 16px', border: '1px solid var(--border-divider)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
            <Users size={14} color="var(--text-secondary)" /> People Found
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', marginTop: '6px', color: 'var(--text-primary)', lineHeight: 1 }}>
            {companySummary.peopleFound}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--surface-secondary)', borderRadius: '10px', padding: '14px 16px', border: '1px solid var(--border-divider)' }}>
          <div style={{ fontSize: '12px', color: 'var(--accent-lavender)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
            <Users size={14} /> HR / Talent
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', marginTop: '6px', color: 'var(--accent-lavender)', lineHeight: 1 }}>
            {companySummary.hrCandidates || 0}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--surface-secondary)', borderRadius: '10px', padding: '14px 16px', border: '1px solid var(--border-divider)' }}>
          <div style={{ fontSize: '12px', color: 'var(--action-blue)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
            <Code size={14} /> IT &amp; Engineering
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', marginTop: '6px', color: 'var(--action-blue)', lineHeight: 1 }}>
            {companySummary.itCandidates || 0}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--surface-secondary)', borderRadius: '10px', padding: '14px 16px', border: '1px solid var(--border-divider)' }}>
          <div style={{ fontSize: '12px', color: 'var(--warning-amber)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
            <CheckCircle2 size={14} /> Mutuals &amp; Alumni
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', marginTop: '6px', color: 'var(--warning-amber)', lineHeight: 1 }}>
            {companySummary.mutualAlumniCandidates || 0}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--success-bg)', borderRadius: '10px', padding: '14px 16px', border: '1px solid var(--success-border)' }}>
          <div style={{ fontSize: '12px', color: 'var(--success-green)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
            <Target size={14} /> Target Quota
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', marginTop: '6px', color: 'var(--success-green)', lineHeight: 1 }}>
            {companySummary.recommendedTargets}
          </div>
        </div>
      </div>

      {/* Message Editing Drawer */}
      {isEditingMessage && (
        <div style={{ marginBottom: '20px', backgroundColor: 'var(--surface-secondary)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-divider)' }}>
          <label style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '6px', display: 'block', fontWeight: '500' }}>
            Update Referral Message for {companySummary.companyName}:
          </label>
          <textarea
            className="textarea"
            defaultValue={editedMessage}
            onChange={(e) => setEditedMessage(e.target.value)}
            rows={3}
            placeholder="Edit message..."
          />
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--border-divider)' }}>
        <button
          onClick={() => onDecision({ action: 'cancel' })}
          className="btn btn-secondary"
          style={{ padding: '8px 16px', fontSize: '13.5px' }}
        >
          Cancel
        </button>

        <button
          onClick={() => {
            if (isEditingMessage && editedMessage.trim()) {
              onDecision({ action: 'change_message', newMessage: editedMessage });
            } else {
              setIsEditingMessage(!isEditingMessage);
            }
          }}
          className="btn btn-secondary"
          style={{ padding: '8px 16px', fontSize: '13.5px' }}
        >
          <Edit3 size={14} />
          <span>{isEditingMessage ? 'Save Updated Note' : 'Customize Note'}</span>
        </button>

        <button
          onClick={() => onDecision({ action: 'start' })}
          className="btn btn-primary"
          style={{ padding: '8px 22px', fontSize: '14px', fontWeight: '600' }}
        >
          <span>Start Outreach</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
