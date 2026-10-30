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
          <span className="section-tag">[ STAGE 01 // DISCOVERY &amp; OFFICIAL PAGE VERIFIED ]</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-success">
              <ShieldCheck size={13} /> OFFICIAL PAGE VERIFIED
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>READY FOR OUTREACH</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={24} color="var(--text-primary)" />
            <span>{companySummary.companyName}</span>
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
            {companySummary.officialUrl && (
              <a
                href={companySummary.officialUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--text-primary)', textDecoration: 'underline', textUnderlineOffset: '3px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
              >
                LinkedIn Page <ExternalLink size={11} />
              </a>
            )}
            {companySummary.website && (
              <a
                href={companySummary.website}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
              >
                <Globe size={12} /> Website <ExternalLink size={11} />
              </a>
            )}
            <span>Industry: <strong style={{ color: 'var(--text-primary)' }}>{companySummary.industry || 'Technology'}</strong></span>
            <span>Location: <strong style={{ color: 'var(--text-primary)' }}>{companySummary.location || 'Global'}</strong></span>
            {companySummary.followers > 0 && (
              <span>Followers: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{companySummary.followers.toLocaleString()}</strong></span>
            )}
            {companySummary.locationFilter && (
              <span className="badge badge-tech" style={{ fontSize: '11px' }}>
                📍 {companySummary.locationFilter}
              </span>
            )}
            {companySummary.genderFilter && companySummary.genderFilter !== 'all' && (
              <span className="badge badge-talent" style={{ fontSize: '11px' }}>
                👤 {companySummary.genderFilter.toUpperCase()}
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
        <div style={{ backgroundColor: 'var(--surface-secondary)', borderRadius: 'var(--radius-card-sm)', padding: '14px 16px', border: '1px solid var(--border-divider)' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
            <Users size={14} color="var(--text-muted)" /> POOL FOUND
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', fontFamily: 'var(--font-mono)', marginTop: '6px', color: 'var(--text-primary)', lineHeight: 1 }}>
            {companySummary.peopleFound}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--surface-secondary)', borderRadius: 'var(--radius-card-sm)', padding: '14px 16px', border: '1px solid var(--border-divider)' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--accent-lavender)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
            <Users size={14} /> HR / RECRUITERS
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', fontFamily: 'var(--font-mono)', marginTop: '6px', color: 'var(--accent-lavender)', lineHeight: 1 }}>
            {companySummary.hrCandidates || 0}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--surface-secondary)', borderRadius: 'var(--radius-card-sm)', padding: '14px 16px', border: '1px solid var(--border-divider)' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
            <Code size={14} /> ENGINEERING
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', fontFamily: 'var(--font-mono)', marginTop: '6px', color: 'var(--text-primary)', lineHeight: 1 }}>
            {companySummary.itCandidates || 0}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--surface-secondary)', borderRadius: 'var(--radius-card-sm)', padding: '14px 16px', border: '1px solid var(--border-divider)' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--warning-amber)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
            <CheckCircle2 size={14} /> MUTUALS / ALUMNI
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', fontFamily: 'var(--font-mono)', marginTop: '6px', color: 'var(--warning-amber)', lineHeight: 1 }}>
            {companySummary.mutualAlumniCandidates || 0}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--success-bg)', borderRadius: 'var(--radius-card-sm)', padding: '14px 16px', border: '1px solid var(--success-border)' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--success-green)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
            <Target size={14} /> TARGET QUOTA
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', fontFamily: 'var(--font-mono)', marginTop: '6px', color: 'var(--success-green)', lineHeight: 1 }}>
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
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', paddingTop: '18px', borderTop: '1px solid var(--border-divider)' }}>
        <button
          onClick={() => onDecision({ action: 'cancel' })}
          className="btn btn-secondary"
          style={{ padding: '8px 16px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}
        >
          CANCEL
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
          style={{ padding: '8px 16px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}
        >
          <Edit3 size={13} />
          <span>{isEditingMessage ? 'SAVE NOTE' : 'CUSTOMIZE NOTE'}</span>
        </button>

        <button
          onClick={() => onDecision({ action: 'start' })}
          className="btn btn-primary"
          style={{ padding: '8px 22px', fontSize: '13.5px', fontWeight: '700', fontFamily: 'var(--font-mono)' }}
        >
          <span>START OUTREACH</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
