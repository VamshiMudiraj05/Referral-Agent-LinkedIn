import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function SafetyBanner({ isPaused, pauseReason, onResume }) {
  if (!isPaused && !pauseReason) return null;

  return (
    <div style={{
      backgroundColor: '#FEF3D6',
      border: '1px solid #FCE8B2',
      borderRadius: '8px',
      padding: '16px 20px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{
          backgroundColor: '#FDE68A',
          borderRadius: '50%',
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '2px'
        }}>
          <AlertTriangle size={18} color="#915907" />
        </div>
        <div>
          <h4 style={{ color: '#915907', fontSize: '0.92rem', fontWeight: '600', marginBottom: '2px' }}>
            LinkedIn Requires Manual Verification
          </h4>
          <p style={{ color: '#78350F', fontSize: '0.84rem', lineHeight: '1.4' }}>
            {pauseReason || 'The agent has paused automation to protect your account. Please complete login or security verification in the browser window.'}
          </p>
          <div style={{ fontSize: '0.76rem', color: '#92400E', marginTop: '4px' }}>
            • Never bypass security challenges automatically. Once you solve it in Chrome, click resume below.
          </div>
        </div>
      </div>

      <button
        onClick={onResume}
        className="btn btn-success"
        style={{ whiteSpace: 'nowrap', padding: '8px 16px', fontSize: '0.82rem', flexShrink: 0 }}
      >
        <CheckCircle2 size={15} />
        <span>Verification Solved, Resume</span>
      </button>
    </div>
  );
}
