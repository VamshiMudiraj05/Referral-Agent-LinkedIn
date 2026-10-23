import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function SafetyBanner({ isPaused, pauseReason, onResume }) {
  if (!isPaused && !pauseReason) return null;

  return (
    <div style={{
      backgroundColor: 'var(--warning-bg)',
      border: '1px solid var(--warning-border)',
      borderRadius: 'var(--radius-card-sm)',
      padding: '18px 22px',
      marginBottom: '22px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '18px',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        <div style={{
          backgroundColor: '#FDE68A',
          borderRadius: '50%',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '2px',
          color: 'var(--warning-amber)'
        }}>
          <AlertTriangle size={18} />
        </div>
        <div>
          <h4 style={{ color: 'var(--warning-amber)', fontSize: '15px', fontWeight: '600', marginBottom: '2px' }}>
            LinkedIn Requires Manual Verification
          </h4>
          <p style={{ color: '#92400E', fontSize: '13.5px', lineHeight: '1.45' }}>
            {pauseReason || 'The agent has paused automation to protect your account. Please complete login or security verification in the browser window.'}
          </p>
          <div style={{ fontSize: '12.5px', color: '#B45309', marginTop: '4px' }}>
            • Never bypass security challenges automatically. Once solved in Chrome, click resume below to continue your campaign safely.
          </div>
        </div>
      </div>

      <button
        onClick={onResume}
        className="btn btn-success"
        style={{ whiteSpace: 'nowrap', padding: '9px 18px', fontSize: '13.5px', fontWeight: '500', flexShrink: 0 }}
      >
        <CheckCircle2 size={16} />
        <span>Verification Solved, Resume</span>
      </button>
    </div>
  );
}
