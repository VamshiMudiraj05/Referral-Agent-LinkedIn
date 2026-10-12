import React, { useState } from 'react';
import { 
  Building2, 
  Send, 
  Users, 
  Layers, 
  Sliders, 
  Check, 
  MessageSquare, 
  AlertCircle, 
  Settings, 
  Minus, 
  Plus, 
  Eye, 
  Monitor,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const RECENT_COMPANIES_KEY = 'referpilot.recentCompanies';
const REFERRAL_MESSAGE_KEY = 'referpilot.referralMessage';
const DEFAULT_REFERRAL_MESSAGE = 'Hi, I came across Associate Software Engineer role at [Company] which matches my skill set.Would you be able to refer me for this position? You can check my work here [https://vamshionweb.vercel.app/] Thanks!';

function loadRecentCompanies() {
  try {
    const savedCompanies = JSON.parse(localStorage.getItem(RECENT_COMPANIES_KEY) || '[]');
    return Array.isArray(savedCompanies)
      ? savedCompanies.filter(company => typeof company === 'string' && company.trim())
      : [];
  } catch (error) {
    console.warn('Could not load recent companies:', error);
    return [];
  }
}

function loadReferralMessage() {
  try {
    return localStorage.getItem(REFERRAL_MESSAGE_KEY) ?? DEFAULT_REFERRAL_MESSAGE;
  } catch (error) {
    console.warn('Could not load saved connection note:', error);
    return DEFAULT_REFERRAL_MESSAGE;
  }
}

export default function CampaignSetup({ onStartCampaign, isRunning, recentCompanies = [] }) {
  const [companyName, setCompanyName] = useState('');
  const [multiCompanyMode, setMultiCompanyMode] = useState(false);
  const [companyList, setCompanyList] = useState('');
  const [savedRecentCompanies, setSavedRecentCompanies] = useState(loadRecentCompanies);
  const [referralMessage, setReferralMessage] = useState(loadReferralMessage);

  const [strategy, setStrategy] = useState('mutuals_alumni_first'); // 'mutuals_alumni_first' | 'hr_first' | 'it_first'
  const [maxPerCompany, setMaxPerCompany] = useState(5);
  const [approvalMode, setApprovalMode] = useState(false); // false = auto, true = manual approval
  const [headless, setHeadless] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const charCount = referralMessage.length;
  const isOverLimit = charCount > 300;
  const recentCompanyNames = Array.from(new Set([
    ...savedRecentCompanies,
    ...recentCompanies.filter(company => typeof company === 'string' && company.trim())
  ])).slice(0, 6);

  const updateReferralMessage = (message) => {
    setReferralMessage(message);
    try {
      localStorage.setItem(REFERRAL_MESSAGE_KEY, message);
    } catch (error) {
      console.warn('Could not save connection note:', error);
    }
  };

  const insertTag = (tag) => {
    updateReferralMessage(`${referralMessage} ${tag}`);
  };

  const incrementLimit = () => {
    setMaxPerCompany(prev => Math.min(25, (parseInt(prev, 10) || 1) + 1));
  };

  const decrementLimit = () => {
    setMaxPerCompany(prev => Math.max(1, (parseInt(prev, 10) || 1) - 1));
  };

  const handleStart = (e) => {
    e.preventDefault();
    if (isOverLimit) {
      alert('Your referral message exceeds LinkedIn’s 300 character limit. Please shorten it before launching.');
      return;
    }

    const companies = multiCompanyMode 
      ? companyList.split('\n').map(c => c.trim()).filter(c => c.length > 0)
      : [companyName.trim()];

    if (companies.length === 0 || !companies[0]) {
      alert('Please enter a target company name.');
      return;
    }

    const updatedRecentCompanies = Array.from(new Set([
      ...companies.slice().reverse(),
      ...savedRecentCompanies
    ])).slice(0, 10);
    setSavedRecentCompanies(updatedRecentCompanies);
    try {
      localStorage.setItem(RECENT_COMPANIES_KEY, JSON.stringify(updatedRecentCompanies));
    } catch (error) {
      console.warn('Could not save recent companies:', error);
    }

    const rawLimit = parseInt(maxPerCompany, 10) || 5;
    const limitNum = Math.min(25, Math.max(1, rawLimit));

    onStartCampaign({
      companyName: companies[0],
      companies,
      referralMessage,
      strategy,
      maxPerCompany: limitNum,
      maxSession: limitNum,
      approvalMode,
      headless
    });
  };

  return (
    <div className="card" style={{ padding: '28px 32px', backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', paddingBottom: '18px', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: '1.45rem', fontWeight: '600', color: '#1D2226', letterSpacing: '-0.01em' }}>
          Create a new referral campaign
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>
          Find relevant employees at a target company and prepare personalized referral outreach.
        </p>
      </div>

      <form onSubmit={handleStart}>
        {/* TARGET COMPANY */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: '600', color: '#1D2226', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={16} color="#0A66C2" />
              {multiCompanyMode ? 'Target Companies (Sequential Queue)' : 'Company Name'}
            </label>
            <button
              type="button"
              onClick={() => setMultiCompanyMode(!multiCompanyMode)}
              style={{
                background: 'none',
                border: 'none',
                color: '#0A66C2',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}
            >
              {multiCompanyMode ? '← Switch to Single Company' : '+ Multi-Company Queue'}
            </button>
          </div>

          {multiCompanyMode ? (
            <div>
              <textarea
                className="textarea"
                value={companyList}
                onChange={(e) => setCompanyList(e.target.value)}
                rows={3}
                placeholder="Enter one company per line (e.g. Microsoft&#10;Google&#10;Amazon)"
                required
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                The agent will process each company sequentially without mixing candidates.
              </span>
            </div>
          ) : (
            <div>
              <input
                type="text"
                className="input-text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Microsoft, Google, Amazon..."
                required
              />
              {/* Recent company chips */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recent:</span>
                {recentCompanyNames.length > 0 ? recentCompanyNames.map(comp => (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => setCompanyName(comp)}
                    style={{
                      backgroundColor: companyName === comp ? '#EBF4FD' : '#F8FAFC',
                      border: '1px solid ' + (companyName === comp ? '#0A66C2' : 'var(--border)'),
                      borderRadius: '16px',
                      padding: '3px 10px',
                      color: companyName === comp ? '#0A66C2' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: companyName === comp ? '600' : '400',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {comp}
                  </button>
                )) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Companies from your campaigns will appear here.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* REFERRAL MESSAGE */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: '600', color: '#1D2226', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={16} color="#0A66C2" />
              Connection note
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => insertTag('[Company]')}
                className="btn btn-secondary"
                style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px' }}
                title="Insert [Company] token into message"
              >
                + Insert [Company]
              </button>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: '600',
                color: isOverLimit ? '#CC1016' : charCount > 260 ? '#915907' : '#057642'
              }}>
                {charCount} / 300 chars
              </span>
            </div>
          </div>

          <textarea
            className="textarea"
            value={referralMessage}
            onChange={(e) => updateReferralMessage(e.target.value)}
            rows={4}
            placeholder="Hi, I came across opportunities at [Company]..."
            required
            style={{ borderColor: isOverLimit ? '#CC1016' : undefined }}
          />
          <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '5px' }}>
            Your edited note is saved automatically and will be used as the default for future campaigns.
          </span>

          {isOverLimit && (
            <div style={{ color: '#CC1016', fontSize: '0.8rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={14} /> Message exceeds LinkedIn's 300 character note limit.
            </div>
          )}
        </div>

        {/* TARGETING & STRATEGY */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '0.88rem', fontWeight: '600', color: '#1D2226', display: 'block', marginBottom: '6px' }}>
            Target priority
          </label>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Select which candidate group the AI agent should prioritize first.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '10px'
          }}>
            {[
              {
                id: 'mutuals_alumni_first',
                title: 'Mutuals & Alumni First',
                desc: 'Highest referral affinity (shared connections & college)'
              },
              {
                id: 'hr_first',
                title: 'HR / Talent Acquisition First',
                desc: 'Recruiters, Sourcers & Talent Partners actively hiring'
              },
              {
                id: 'it_first',
                title: 'IT & Software Engineering First',
                desc: 'Engineers, Tech Leads, Architects & Dev Managers'
              }
            ].map(item => {
              const isSelected = strategy === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setStrategy(item.id)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid ' + (isSelected ? '#0A66C2' : 'var(--border)'),
                    backgroundColor: isSelected ? '#EBF4FD' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontSize: '0.86rem', fontWeight: '600', color: isSelected ? '#0A66C2' : '#1D2226' }}>
                      {item.title}
                    </span>
                    {isSelected && <Check size={16} color="#0A66C2" strokeWidth={2.5} />}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    {item.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TWO-COLUMN GRID: PEOPLE LIMIT & APPROVAL MODE */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* People Limit */}
          <div style={{
            padding: '16px 18px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: '#F8FAFC'
          }}>
            <label style={{ fontSize: '0.88rem', fontWeight: '600', color: '#1D2226', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={16} color="#0A66C2" /> Successful connection requests
            </label>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', marginBottom: '12px' }}>
              Target successful sends. Skipped, pending, or unconfirmed profiles do not count (max: 25).
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <button
                  type="button"
                  onClick={decrementLimit}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={maxPerCompany}
                  onChange={(e) => {
                    const raw = parseInt(e.target.value, 10);
                    const val = isNaN(raw) ? '' : Math.min(25, Math.max(1, raw));
                    setMaxPerCompany(val);
                  }}
                  style={{
                    width: '50px',
                    textAlign: 'center',
                    border: 'none',
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: '#1D2226',
                    outline: 'none',
                    padding: '6px 0'
                  }}
                />
                <button
                  type="button"
                  onClick={incrementLimit}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>

              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>people</span>

              <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                {[2, 5, 10, 25].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMaxPerCompany(n)}
                    style={{
                      backgroundColor: maxPerCompany === n ? '#0A66C2' : '#FFFFFF',
                      border: '1px solid ' + (maxPerCompany === n ? '#0A66C2' : 'var(--border)'),
                      borderRadius: '6px',
                      padding: '4px 8px',
                      color: maxPerCompany === n ? '#FFFFFF' : 'var(--text-secondary)',
                      fontSize: '0.76rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Human Approval Mode */}
          <div style={{
            padding: '16px 18px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: '600', color: '#1D2226' }}>
                  Human approval
                </span>
                <span className={`badge ${approvalMode ? 'badge-tech' : 'badge-neutral'}`}>
                  {approvalMode ? 'Manual Review' : 'Automatic'}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Review each connection request card and note before sending.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setApprovalMode(false)}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: '1px solid ' + (!approvalMode ? '#0A66C2' : 'var(--border)'),
                  backgroundColor: !approvalMode ? '#EBF4FD' : '#FFFFFF',
                  color: !approvalMode ? '#0A66C2' : 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  fontWeight: !approvalMode ? '600' : '400',
                  cursor: 'pointer'
                }}
              >
                Automatic Mode
              </button>
              <button
                type="button"
                onClick={() => setApprovalMode(true)}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: '1px solid ' + (approvalMode ? '#0A66C2' : 'var(--border)'),
                  backgroundColor: approvalMode ? '#EBF4FD' : '#FFFFFF',
                  color: approvalMode ? '#0A66C2' : 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  fontWeight: approvalMode ? '600' : '400',
                  cursor: 'pointer'
                }}
              >
                Review Each Request
              </button>
            </div>
          </div>
        </div>

        {/* BROWSER SETTINGS (COLLAPSIBLE) */}
        <div style={{ marginBottom: '26px' }}>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Settings size={14} />
            <span>Browser Window Options</span>
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showAdvanced && (
            <div style={{
              marginTop: '10px',
              padding: '14px 16px',
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              maxWidth: '380px'
            }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Chrome Visibility:
              </label>
              <select
                className="select-input"
                value={headless ? 'headless' : 'visible'}
                onChange={(e) => setHeadless(e.target.value === 'headless')}
              >
                <option value="visible">Visible Chrome (Recommended for live supervision)</option>
                <option value="headless">Background Headless</option>
              </select>
            </div>
          )}
        </div>

        {/* CAMPAIGN ACTIONS */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <button
            type="submit"
            disabled={isRunning || isOverLimit}
            className="btn btn-primary"
            style={{ padding: '10px 24px', fontSize: '0.92rem' }}
          >
            <Send size={15} />
            {isRunning ? 'Campaign in progress...' : `Start Campaign (${maxPerCompany} Candidates)`}
          </button>

          <button
            type="button"
            onClick={() => {
              setCompanyName('');
              setCompanyList('');
            }}
            className="btn btn-secondary"
            style={{ padding: '10px 18px', fontSize: '0.88rem' }}
          >
            Clear Fields
          </button>
        </div>
      </form>
    </div>
  );
}
