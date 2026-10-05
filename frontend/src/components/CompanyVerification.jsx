import React, { useState } from 'react';
import { 
  Building2, 
  Globe, 
  Users, 
  Briefcase, 
  Code, 
  CheckCircle2, 
  X, 
  Edit3, 
  ArrowRight,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function CompanyVerification({ companySummary, onDecision }) {
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [editedMessage, setEditedMessage] = useState('');

  if (!companySummary) return null;

  return (
    <div className="card" style={{ padding: '24px', marginBottom: '20px', backgroundColor: '#FFFFFF', borderTop: '3px solid #0A66C2' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-success">
              <ShieldCheck size={13} /> Official Page Verified
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Discovery Stage Complete</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '600', color: '#1D2226', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={22} color="#0A66C2" />
            {companySummary.companyName}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
            {companySummary.officialUrl && (
              <a
                href={companySummary.officialUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#0A66C2', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                LinkedIn Page <ExternalLink size={12} />
              </a>
            )}
            {companySummary.website && (
              <a
                href={companySummary.website}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                <Globe size={13} /> Website <ExternalLink size={11} />
              </a>
            )}
            <span>Industry: <strong style={{ color: '#1D2226' }}>{companySummary.industry || 'Technology'}</strong></span>
            <span>Location: <strong style={{ color: '#1D2226' }}>{companySummary.location || 'Global'}</strong></span>
            {companySummary.followers > 0 && (
              <span>Followers: <strong style={{ color: '#1D2226' }}>{companySummary.followers.toLocaleString()}</strong></span>
            )}
          </div>
        </div>
      </div>

      {/* Discovery Breakdown Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '10px',
        marginBottom: '20px'
      }}>
        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '6px', padding: '12px 14px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Users size={14} color="#56687A" /> People Found
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: '700', marginTop: '4px', color: '#1D2226' }}>
            {companySummary.peopleFound}
          </div>
        </div>

        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '6px', padding: '12px 14px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: '#6B21A8', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Users size={14} /> HR / Talent Acquisition
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: '700', marginTop: '4px', color: '#6B21A8' }}>
            {companySummary.hrCandidates || 0}
          </div>
        </div>

        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '6px', padding: '12px 14px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: '#0A66C2', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Code size={14} /> IT & Engineering
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: '700', marginTop: '4px', color: '#0A66C2' }}>
            {companySummary.itCandidates || 0}
          </div>
        </div>

        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '6px', padding: '12px 14px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: '#8A5B00', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CheckCircle2 size={14} /> Mutuals & Alumni
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: '700', marginTop: '4px', color: '#8A5B00' }}>
            {companySummary.mutualAlumniCandidates || 0}
          </div>
        </div>

        <div style={{ backgroundColor: '#E6F4EA', borderRadius: '6px', padding: '12px 14px', border: '1px solid #CEEAD6' }}>
          <div style={{ fontSize: '0.75rem', color: '#057642', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}>
            <CheckCircle2 size={14} /> Target Quota
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: '700', marginTop: '4px', color: '#057642' }}>
            {companySummary.recommendedTargets}
          </div>
        </div>
      </div>

      {/* Message Editing Drawer */}
      {isEditingMessage && (
        <div style={{ marginBottom: '18px', backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block', fontWeight: '500' }}>
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
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={() => onDecision({ action: 'cancel' })}
          className="btn btn-secondary"
          style={{ padding: '8px 14px', fontSize: '0.84rem' }}
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
          style={{ padding: '8px 14px', fontSize: '0.84rem' }}
        >
          <Edit3 size={14} />
          <span>{isEditingMessage ? 'Save Updated Note' : 'Customize Note'}</span>
        </button>

        <button
          onClick={() => onDecision({ action: 'start' })}
          className="btn btn-primary"
          style={{ padding: '8px 20px', fontSize: '0.88rem' }}
        >
          <span>Start Outreach</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
