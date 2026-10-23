import React, { useState } from 'react';
import { 
  Building2, 
  Send, 
  Users, 
  Sliders, 
  Check, 
  MessageSquare, 
  AlertCircle, 
  Settings, 
  Minus, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  ShieldCheck 
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
  const [locationFilter, setLocationFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('all'); // 'all' | 'female' | 'male'
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
      locationFilter: locationFilter.trim(),
      genderFilter,
      maxPerCompany: limitNum,
      maxSession: limitNum,
      approvalMode,
      headless
    });
  };

  // Live preview message generator
  const previewCompanyName = companyName.trim() || (multiCompanyMode && companyList.split('\n')[0]?.trim()) || 'Target Company';
  const renderedPreviewNote = referralMessage.replace(/\[Company\]/g, previewCompanyName);

  return (
    <div className="campaign-workspace-layout">
      {/* Primary Form Workspace Card */}
      <div className="card" style={{ padding: '32px 36px', backgroundColor: 'var(--surface-main)' }}>
        {/* Workspace Title & Intro */}
        <div style={{ marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid var(--border-divider)' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Create Referral Campaign
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '6px', lineHeight: 1.5 }}>
            Discover verified employees at target companies, rank by affinity signals, and automate personalized referral connection requests.
          </p>
        </div>

        <form onSubmit={handleStart}>
          {/* SECTION 1: TARGET COMPANY */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Building2 size={16} color="var(--action-blue)" />
                <span>{multiCompanyMode ? 'Target Companies (Sequential Queue)' : 'Target Company Name'}</span>
              </label>
              <button
                type="button"
                onClick={() => setMultiCompanyMode(!multiCompanyMode)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--action-blue)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}
              >
                {multiCompanyMode ? '← Single Company' : '+ Multi-Company Queue'}
              </button>
            </div>

            {multiCompanyMode ? (
              <div>
                <textarea
                  className="textarea"
                  value={companyList}
                  onChange={(e) => setCompanyList(e.target.value)}
                  rows={4}
                  placeholder="Enter one company per line (e.g.&#10;Microsoft&#10;Google&#10;Amazon)"
                  required
                />
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '5px', display: 'block' }}>
                  The agent will process each company sequentially without mixing candidate pools.
                </span>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  className="input-text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Microsoft, Google, Amazon, Stripe..."
                  required
                />
                {/* Recent company chips */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>Recent:</span>
                  {recentCompanyNames.length > 0 ? recentCompanyNames.map(comp => {
                    const isSelected = companyName === comp;
                    return (
                      <button
                        key={comp}
                        type="button"
                        onClick={() => setCompanyName(comp)}
                        style={{
                          backgroundColor: isSelected ? 'var(--action-blue-subtle)' : 'var(--surface-secondary)',
                          border: '1px solid ' + (isSelected ? 'var(--action-blue)' : 'var(--border-divider)'),
                          borderRadius: 'var(--radius-pill)',
                          padding: '3px 11px',
                          color: isSelected ? 'var(--action-blue)' : 'var(--text-primary)',
                          fontSize: '12px',
                          fontWeight: isSelected ? '600' : '500',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {comp}
                      </button>
                    );
                  }) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Previous companies will appear here for fast re-use.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: REFERRAL MESSAGE */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <MessageSquare size={16} color="var(--action-blue)" />
                <span>Connection Request Note</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => insertTag('[Company]')}
                  className="btn btn-secondary"
                  style={{ padding: '3px 9px', fontSize: '12px', borderRadius: '6px' }}
                  title="Insert [Company] dynamic token into message"
                >
                  + Insert [Company]
                </button>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: isOverLimit ? 'var(--error-bg)' : charCount > 260 ? 'var(--warning-bg)' : 'var(--success-bg)',
                  color: isOverLimit ? 'var(--error-rose)' : charCount > 260 ? 'var(--warning-amber)' : 'var(--success-green)',
                  border: `1px solid ${isOverLimit ? 'var(--error-border)' : charCount > 260 ? 'var(--warning-border)' : 'var(--success-border)'}`
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
              style={{
                borderColor: isOverLimit ? 'var(--error-rose)' : undefined,
                lineHeight: 1.55
              }}
            />
            <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginTop: '6px' }}>
              Saved automatically to local storage and dynamically populated with each company name.
            </span>

            {isOverLimit && (
              <div style={{ color: 'var(--error-rose)', fontSize: '13px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={15} /> Message exceeds LinkedIn's 300 character connection note limit.
              </div>
            )}
          </div>

          {/* SECTION 3: TARGETING STRATEGY */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Target Group Priority
              </label>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Determines candidate discovery ranking
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '10px'
            }}>
              {[
                {
                  id: 'mutuals_alumni_first',
                  title: 'Mutuals & Alumni First',
                  desc: 'Highest referral response (shared connections & college)'
                },
                {
                  id: 'hr_first',
                  title: 'HR & Talent Partners',
                  desc: 'Recruiters, Talent Acquisition & Hiring Sourcers'
                },
                {
                  id: 'it_first',
                  title: 'Engineering & Tech',
                  desc: 'Software Engineers, Architects & Tech Leads'
                }
              ].map(item => {
                const isSelected = strategy === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setStrategy(item.id)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '10px',
                      border: '1.5px solid ' + (isSelected ? 'var(--action-blue)' : 'var(--border-divider)'),
                      backgroundColor: isSelected ? 'var(--action-blue-subtle)' : 'var(--surface-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: '600', color: isSelected ? 'var(--action-blue)' : 'var(--text-primary)' }}>
                        {item.title}
                      </span>
                      {isSelected ? (
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--action-blue)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF'
                        }}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                      ) : (
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: '1.5px solid var(--border-divider)'
                        }} />
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {item.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: CANDIDATE FILTERS */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Sliders size={16} color="var(--action-blue)" />
                <span>Candidate Filters (Location &amp; Gender)</span>
              </label>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Optional &bull; Flow remains standard if unselected
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '14px'
            }}>
              {/* Location Filter */}
              <div style={{
                padding: '16px 18px',
                borderRadius: '12px',
                border: '1px solid var(--border-divider)',
                backgroundColor: 'var(--surface-secondary)'
              }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <MapPin size={15} color="var(--action-blue)" />
                  <span>Location filter</span>
                </label>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  Filter employees by city, region, or country (leave blank for Any).
                </p>

                <input
                  type="text"
                  className="input-text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="e.g. Hyderabad, Bengaluru, San Francisco, India..."
                  style={{ fontSize: '13.5px' }}
                />

                {/* Location Presets */}
                <div style={{ display: 'flex', gap: '5px', marginTop: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: '500' }}>Quick:</span>
                  {['All', 'Hyderabad', 'Bengaluru', 'India', 'United States', 'Bay Area'].map((loc) => {
                    const isSelected = (loc === 'All' && !locationFilter) || (locationFilter.toLowerCase() === loc.toLowerCase());
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setLocationFilter(loc === 'All' ? '' : loc)}
                        style={{
                          backgroundColor: isSelected ? 'var(--action-blue-subtle)' : 'var(--surface-input)',
                          border: '1px solid ' + (isSelected ? 'var(--action-blue)' : 'var(--border-divider)'),
                          borderRadius: 'var(--radius-pill)',
                          padding: '2px 9px',
                          color: isSelected ? 'var(--action-blue)' : 'var(--text-primary)',
                          fontSize: '11.5px',
                          fontWeight: isSelected ? '600' : '400',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {loc}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gender Filter */}
              <div style={{
                padding: '16px 18px',
                borderRadius: '12px',
                border: '1px solid var(--border-divider)',
                backgroundColor: 'var(--surface-secondary)'
              }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Users size={15} color="var(--action-blue)" />
                  <span>Target gender</span>
                </label>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  Filter by inferred profile identity &amp; pronouns.
                </p>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { id: 'all', label: 'All / Any', desc: 'No restriction' },
                    { id: 'female', label: 'Female', desc: 'Women in Tech' },
                    { id: 'male', label: 'Male', desc: 'Men' }
                  ].map((item) => {
                    const isSelected = genderFilter === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setGenderFilter(item.id)}
                        style={{
                          flex: 1,
                          padding: '10px 8px',
                          borderRadius: '8px',
                          border: '1.5px solid ' + (isSelected ? 'var(--action-blue)' : 'var(--border-divider)'),
                          backgroundColor: isSelected ? 'var(--action-blue-subtle)' : 'var(--surface-input)',
                          color: isSelected ? 'var(--action-blue)' : 'var(--text-primary)',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: isSelected ? '600' : '500' }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: '11px', color: isSelected ? 'var(--action-blue)' : 'var(--text-secondary)', marginTop: '2px' }}>
                          {item.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: CONNECTION LIMITS & APPROVAL MODE */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '14px',
            marginBottom: '28px'
          }}>
            {/* Limit Selector */}
            <div style={{
              padding: '16px 18px',
              borderRadius: '12px',
              border: '1px solid var(--border-divider)',
              backgroundColor: 'var(--surface-secondary)'
            }}>
              <label style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={15} color="var(--action-blue)" />
                <span>Successful connection requests</span>
              </label>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', marginBottom: '12px' }}>
                Target successful sends. Skipped, pending, or unconfirmed profiles do not count (max: 25).
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--surface-input)',
                  border: '1px solid var(--border-divider)',
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
                      width: '46px',
                      textAlign: 'center',
                      border: 'none',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      backgroundColor: 'transparent',
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

                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>people</span>

                <div style={{ display: 'flex', gap: '5px', marginLeft: 'auto' }}>
                  {[2, 5, 10, 25].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setMaxPerCompany(n)}
                      style={{
                        backgroundColor: maxPerCompany === n ? 'var(--action-blue)' : 'var(--surface-input)',
                        border: '1px solid ' + (maxPerCompany === n ? 'var(--action-blue)' : 'var(--border-divider)'),
                        borderRadius: '6px',
                        padding: '5px 9px',
                        color: maxPerCompany === n ? '#FFFFFF' : 'var(--text-secondary)',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
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
              borderRadius: '12px',
              border: '1px solid var(--border-divider)',
              backgroundColor: 'var(--surface-secondary)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    Human Approval Mode
                  </span>
                  <span className={`badge ${approvalMode ? 'badge-tech' : 'badge-neutral'}`}>
                    {approvalMode ? 'Manual Review' : 'Automatic'}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Review each connection request card and customize notes before sending.
                </p>
              </div>

              <div style={{
                display: 'flex',
                backgroundColor: 'var(--surface-input)',
                borderRadius: '8px',
                border: '1px solid var(--border-divider)',
                padding: '3px',
                gap: '2px',
                marginTop: '12px'
              }}>
                <button
                  type="button"
                  onClick={() => setApprovalMode(false)}
                  style={{
                    flex: 1,
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: !approvalMode ? 'var(--surface-main)' : 'transparent',
                    color: !approvalMode ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: !approvalMode ? '600' : '400',
                    cursor: 'pointer',
                    boxShadow: !approvalMode ? '0 1px 2px rgba(23, 25, 29, 0.05)' : 'none',
                    transition: 'all 0.15s ease'
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
                    border: 'none',
                    backgroundColor: approvalMode ? 'var(--surface-main)' : 'transparent',
                    color: approvalMode ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: approvalMode ? '600' : '400',
                    cursor: 'pointer',
                    boxShadow: approvalMode ? '0 1px 2px rgba(23, 25, 29, 0.05)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Review Each Request
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 6: BROWSER WINDOW SETTINGS */}
          <div style={{ marginBottom: '28px' }}>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 0'
              }}
            >
              <Settings size={14} />
              <span>Browser Window Options</span>
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showAdvanced && (
              <div style={{
                marginTop: '10px',
                padding: '16px 18px',
                backgroundColor: 'var(--surface-secondary)',
                borderRadius: '10px',
                border: '1px solid var(--border-divider)',
                maxWidth: '420px'
              }}>
                <label style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500', display: 'block', marginBottom: '6px' }}>
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

          {/* SECTION 7: CAMPAIGN ACTIONS */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid var(--border-divider)' }}>
            <button
              type="submit"
              disabled={isRunning || isOverLimit}
              className="btn btn-primary"
              style={{ padding: '11px 26px', fontSize: '14px', fontWeight: '600' }}
            >
              <Send size={15} />
              <span>{isRunning ? 'Campaign in progress...' : `Start Campaign (${maxPerCompany} Candidates)`}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCompanyName('');
                setCompanyList('');
              }}
              className="btn btn-secondary"
              style={{ padding: '11px 20px', fontSize: '14px' }}
            >
              Clear Fields
            </button>
          </div>
        </form>
      </div>

      {/* Right-Side Information & Live Preview Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Dynamic Outreach Note Preview Card */}
        <div className="card" style={{ padding: '20px', backgroundColor: 'var(--surface-main)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '600', color: 'var(--text-secondary)' }}>
              Live Message Preview
            </span>
            <span className="badge badge-tech" style={{ fontSize: '11px' }}>
              LinkedIn Note
            </span>
          </div>

          <div style={{
            backgroundColor: 'var(--surface-secondary)',
            borderRadius: '10px',
            border: '1px solid var(--border-divider)',
            padding: '14px 16px',
            fontSize: '13.5px',
            lineHeight: 1.5,
            color: 'var(--text-primary)',
            minHeight: '90px',
            wordBreak: 'break-word'
          }}>
            "{renderedPreviewNote}"
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>Target: <strong style={{ color: 'var(--text-primary)' }}>{previewCompanyName}</strong></span>
            <span>{charCount} / 300 chars</span>
          </div>
        </div>

        {/* Campaign Configuration Snapshot */}
        <div className="card" style={{ padding: '20px', backgroundColor: 'var(--surface-main)' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Campaign Preset
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Strategy:</span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)', textAlign: 'right' }}>
                {strategy === 'mutuals_alumni_first' ? 'Mutuals & Alumni' : strategy === 'hr_first' ? 'HR / Recruiters' : 'Engineering / Tech'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Target Quota:</span>
              <span style={{ fontWeight: '600', color: 'var(--success-green)' }}>
                {maxPerCompany} connections
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Review Mode:</span>
              <span className={`badge ${approvalMode ? 'badge-tech' : 'badge-neutral'}`} style={{ fontSize: '11.5px' }}>
                {approvalMode ? 'Manual Approval' : 'Automatic'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Location Filter:</span>
              <span style={{ fontWeight: '500', color: locationFilter ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {locationFilter || 'Any Location'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Gender Targeting:</span>
              <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                {genderFilter === 'all' ? 'All Genders' : genderFilter === 'female' ? 'Women in Tech' : 'Men'}
              </span>
            </div>
          </div>
        </div>

        {/* Safety & Compliance Assurance */}
        <div className="card" style={{ padding: '16px 18px', backgroundColor: 'var(--surface-main)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShieldCheck size={16} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Rate-Limit Protected
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                Human-like delays, anti-duplicate tracking, and automated pausing if LinkedIn requests challenge verification.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
