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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="section-tag" style={{ margin: 0 }}>[ 00 ] // CAMPAIGN ORCHESTRATOR</span>
            <span className="badge" style={{ backgroundColor: 'var(--accent-banana-subtle)', color: 'var(--accent-banana-dark)', border: '1px solid var(--accent-banana-border)', fontSize: '10.5px' }}>
              AUTONOMOUS
            </span>
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
            Create Referral Campaign
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', marginTop: '6px', lineHeight: 1.5 }}>
            Discover verified employees at target companies, rank by affinity signals, and automate personalized referral connection requests.
          </p>
        </div>

        <form onSubmit={handleStart}>
          {/* SECTION 1: TARGET COMPANY */}
          <div style={{ marginBottom: '28px' }}>
            <span className="section-tag">[ 01 ] // TARGET COMPANY</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Building2 size={16} color="var(--text-primary)" />
                <span>{multiCompanyMode ? 'Target Companies (Sequential Queue)' : 'Target Company Name'}</span>
              </label>
              <button
                type="button"
                onClick={() => setMultiCompanyMode(!multiCompanyMode)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px'
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
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '5px', display: 'block', fontFamily: 'var(--font-mono)' }}>
                  // The agent will process each company sequentially without mixing candidate pools.
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
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: '600' }}>RECENT:</span>
                  {recentCompanyNames.length > 0 ? recentCompanyNames.map(comp => {
                    const isSelected = companyName === comp;
                    return (
                      <button
                        key={comp}
                        type="button"
                        onClick={() => setCompanyName(comp)}
                        style={{
                          backgroundColor: isSelected ? 'var(--text-primary)' : 'var(--surface-secondary)',
                          border: '1px solid ' + (isSelected ? 'var(--text-primary)' : 'var(--border-divider)'),
                          borderRadius: 'var(--radius-pill)',
                          padding: '3px 11px',
                          color: isSelected ? '#FFFBF2' : 'var(--text-primary)',
                          fontSize: '12px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: isSelected ? '600' : '500',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        $ {comp}
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
            <span className="section-tag">[ 02 ] // CONNECTION REQUEST NOTE</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <MessageSquare size={16} color="var(--text-primary)" />
                <span>Personalized Connection Note</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => insertTag('[Company]')}
                  className="btn btn-secondary"
                  style={{ padding: '3px 10px', fontSize: '11.5px', fontFamily: 'var(--font-mono)', borderRadius: '6px' }}
                  title="Insert [Company] dynamic token into message"
                >
                  + [Company] token
                </button>
                <span style={{
                  fontSize: '11.5px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: isOverLimit ? 'var(--error-bg)' : charCount > 260 ? 'var(--warning-bg)' : 'var(--surface-secondary)',
                  color: isOverLimit ? 'var(--error-rose)' : charCount > 260 ? 'var(--warning-amber)' : 'var(--text-secondary)',
                  border: `1px solid ${isOverLimit ? 'var(--error-border)' : charCount > 260 ? 'var(--warning-border)' : 'var(--border-divider)'}`
                }}>
                  {charCount} / 300 CHARS
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
                lineHeight: 1.55,
                fontFamily: 'var(--font-sans)'
              }}
            />
            <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
              // Dynamically replaced with the candidate's verified company during outreach.
            </span>

            {isOverLimit && (
              <div style={{ color: 'var(--error-rose)', fontSize: '13px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={15} /> Message exceeds LinkedIn's 300 character connection note limit.
              </div>
            )}
          </div>

          {/* SECTION 3: TARGETING STRATEGY */}
          <div style={{ marginBottom: '28px' }}>
            <span className="section-tag">[ 03 ] // TARGET GROUP PRIORITY</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Users size={16} color="var(--text-primary)" />
                <span>Target Group Priority</span>
              </label>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Determines candidate discovery ranking
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px'
            }}>
              {[
                {
                  id: 'mutuals_alumni_first',
                  title: 'Mutuals & Alumni First',
                  tag: 'HIGHEST CONVERSION',
                  desc: 'Mutuals & Alumni first, then Tech Engineers, and HR last'
                },
                {
                  id: 'hr_first',
                  title: 'HR & Talent Partners',
                  tag: 'SOURCERS',
                  desc: 'Recruiters, Talent Acquisition & Hiring Sourcers'
                },
                {
                  id: 'it_first',
                  title: 'Engineering & Tech',
                  tag: 'PEER DEV',
                  desc: 'Software Engineers, Architects & Tech Leads'
                }
              ].map(item => {
                const isSelected = strategy === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setStrategy(item.id)}
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-card-sm)',
                      border: isSelected ? '2px solid var(--text-primary)' : '1px solid var(--border-divider)',
                      backgroundColor: isSelected ? 'var(--surface-secondary)' : 'var(--surface-main)',
                      cursor: 'pointer',
                      transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: isSelected ? '0 2px 8px rgba(18, 16, 14, 0.08)' : 'none',
                      transform: isSelected ? 'translateY(-1px)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{
                        fontSize: '13.5px',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.01em'
                      }}>
                        {item.title}
                      </span>
                      {isSelected ? (
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFBF2'
                        }}>
                          <Check size={13} strokeWidth={3} />
                        </div>
                      ) : (
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: '1.5px solid var(--border-divider)'
                        }} />
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      {item.desc}
                    </div>
                    <div style={{ marginTop: '10px' }}>
                      <span className="badge" style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        backgroundColor: isSelected ? 'var(--accent-banana-subtle)' : 'var(--surface-input)',
                        color: isSelected ? 'var(--accent-banana-dark)' : 'var(--text-muted)',
                        border: '1px solid ' + (isSelected ? 'var(--accent-banana-border)' : 'var(--border-divider)')
                      }}>
                        {item.tag}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: CANDIDATE FILTERS */}
          <div style={{ marginBottom: '28px' }}>
            <span className="section-tag">[ 04 ] // CANDIDATE FILTERS</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Sliders size={16} color="var(--text-primary)" />
                <span>Location &amp; Gender Heuristics</span>
              </label>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Optional • Standard pipeline if untouched
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '14px'
            }}>
              {/* Location Filter */}
              <div style={{
                padding: '18px',
                borderRadius: 'var(--radius-card-sm)',
                border: '1px solid var(--border-divider)',
                backgroundColor: 'var(--surface-secondary)'
              }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <MapPin size={15} color="var(--text-primary)" />
                  <span>LOCATION FILTER</span>
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
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: '600' }}>PRESETS:</span>
                  {['All', 'Hyderabad', 'Bengaluru', 'India', 'United States', 'Bay Area'].map((loc) => {
                    const isSelected = (loc === 'All' && !locationFilter) || (locationFilter.toLowerCase() === loc.toLowerCase());
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setLocationFilter(loc === 'All' ? '' : loc)}
                        style={{
                          backgroundColor: isSelected ? 'var(--text-primary)' : 'var(--surface-input)',
                          border: '1px solid ' + (isSelected ? 'var(--text-primary)' : 'var(--border-divider)'),
                          borderRadius: 'var(--radius-pill)',
                          padding: '2px 9px',
                          color: isSelected ? '#FFFBF2' : 'var(--text-primary)',
                          fontSize: '11.5px',
                          fontFamily: 'var(--font-mono)',
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
                padding: '18px',
                borderRadius: 'var(--radius-card-sm)',
                border: '1px solid var(--border-divider)',
                backgroundColor: 'var(--surface-secondary)'
              }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Users size={15} color="var(--text-primary)" />
                  <span>AFFINITY GENDER TARGETING</span>
                </label>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  Filter by inferred profile identity &amp; pronouns.
                </p>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { id: 'all', label: 'All / Any', desc: 'Standard pipeline' },
                    { id: 'female', label: '♀ Female', desc: 'Women in Tech' },
                    { id: 'male', label: '♂ Male', desc: 'Men' }
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
                          borderRadius: 'var(--radius-control)',
                          border: isSelected ? '2px solid var(--text-primary)' : '1px solid var(--border-divider)',
                          backgroundColor: isSelected ? 'var(--surface-main)' : 'var(--surface-input)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 1px 3px rgba(18, 16, 14, 0.08)' : 'none'
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: isSelected ? '700' : '500' }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
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
              padding: '18px',
              borderRadius: 'var(--radius-card-sm)',
              border: '1px solid var(--border-divider)',
              backgroundColor: 'var(--surface-secondary)'
            }}>
              <span className="section-tag">[ 05A ] // QUOTA TARGET</span>
              <label style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <Users size={15} color="var(--text-primary)" />
                <span>CONFIRMED CONNECTION SENDS</span>
              </label>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Target successful sends. Skipped, pending, or unconfirmed profiles do not count (max: 25).
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--surface-input)',
                  border: '1.5px solid var(--border-divider)',
                  borderRadius: 'var(--radius-control)',
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
                      color: 'var(--text-primary)'
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
                      fontWeight: '700',
                      fontFamily: 'var(--font-mono)',
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
                      color: 'var(--text-primary)'
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>PEOPLE</span>

                <div style={{ display: 'flex', gap: '5px', marginLeft: 'auto' }}>
                  {[2, 5, 10, 25].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setMaxPerCompany(n)}
                      style={{
                        backgroundColor: maxPerCompany === n ? 'var(--text-primary)' : 'var(--surface-input)',
                        border: '1px solid ' + (maxPerCompany === n ? 'var(--text-primary)' : 'var(--border-divider)'),
                        borderRadius: '6px',
                        padding: '5px 10px',
                        color: maxPerCompany === n ? '#FFFBF2' : 'var(--text-primary)',
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
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
              padding: '18px',
              borderRadius: 'var(--radius-card-sm)',
              border: '1px solid var(--border-divider)',
              backgroundColor: 'var(--surface-secondary)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <span className="section-tag">[ 05B ] // EXECUTION SUPERVISION</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    HUMAN APPROVAL GATE
                  </span>
                  <span className={`badge ${approvalMode ? 'badge-tech' : 'badge-neutral'}`} style={{ fontSize: '10.5px' }}>
                    {approvalMode ? 'MANUAL REVIEW' : 'AUTOPILOT'}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Review each candidate card and verify note before sending.
                </p>
              </div>

              <div style={{
                display: 'flex',
                backgroundColor: 'var(--surface-input)',
                borderRadius: 'var(--radius-control)',
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
                    backgroundColor: !approvalMode ? 'var(--text-primary)' : 'transparent',
                    color: !approvalMode ? '#FFFBF2' : 'var(--text-secondary)',
                    fontSize: '12.5px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: !approvalMode ? '600' : '500',
                    cursor: 'pointer',
                    boxShadow: !approvalMode ? '0 1px 3px rgba(18, 16, 14, 0.15)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  AUTONOMOUS
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalMode(true)}
                  style={{
                    flex: 1,
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: approvalMode ? 'var(--text-primary)' : 'transparent',
                    color: approvalMode ? '#FFFBF2' : 'var(--text-secondary)',
                    fontSize: '12.5px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: approvalMode ? '600' : '500',
                    cursor: 'pointer',
                    boxShadow: approvalMode ? '0 1px 3px rgba(18, 16, 14, 0.15)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  HUMAN REVIEW
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 6: BROWSER WINDOW SETTINGS */}
          <div style={{ marginBottom: '28px' }}>
            <span className="section-tag">[ 06 ] // RUNTIME OPTIONS</span>
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 0'
                }}
              >
                <Settings size={14} />
                <span>$ chrome --runtime-options</span>
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showAdvanced && (
                <div style={{
                  marginTop: '10px',
                  padding: '16px 18px',
                  backgroundColor: 'var(--surface-secondary)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-divider)',
                  maxWidth: '440px'
                }}>
                  <label style={{ fontSize: '12.5px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                    CHROME VISIBILITY MODE:
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
          </div>

          {/* SECTION 7: CAMPAIGN ACTIONS */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingTop: '22px', borderTop: '1px solid var(--border-divider)' }}>
            <button
              type="submit"
              disabled={isRunning || isOverLimit}
              className="btn btn-primary"
              style={{
                padding: '12px 28px',
                fontSize: '14px',
                fontWeight: '700',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.02em'
              }}
            >
              <Send size={15} />
              <span>{isRunning ? 'EXECUTION IN PROGRESS...' : `START CAMPAIGN (${maxPerCompany} CANDIDATES) →`}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCompanyName('');
                setCompanyList('');
              }}
              className="btn btn-secondary"
              style={{ padding: '12px 20px', fontSize: '13.5px', fontFamily: 'var(--font-mono)' }}
            >
              CLEAR
            </button>
          </div>
        </form>
      </div>

      {/* Right-Side Information & Live Preview Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Dynamic Outreach Note Preview Card */}
        <div className="card" style={{ padding: '22px', backgroundColor: 'var(--surface-main)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span className="section-tag" style={{ margin: 0 }}>
              [ LIVE NOTE PREVIEW ]
            </span>
            <span className="badge badge-tech" style={{ fontSize: '10.5px' }}>
              LINKEDIN NOTE
            </span>
          </div>

          <div style={{
            backgroundColor: 'var(--surface-secondary)',
            borderRadius: 'var(--radius-card-sm)',
            border: '1px solid var(--border-divider)',
            padding: '16px',
            fontSize: '13.5px',
            lineHeight: 1.55,
            color: 'var(--text-primary)',
            minHeight: '90px',
            wordBreak: 'break-word',
            fontStyle: 'italic'
          }}>
            "{renderedPreviewNote}"
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <span>TARGET: <strong style={{ color: 'var(--text-primary)' }}>{previewCompanyName}</strong></span>
            <span>{charCount} / 300 CHARS</span>
          </div>
        </div>

        {/* Campaign Configuration Snapshot */}
        <div className="card" style={{ padding: '22px', backgroundColor: 'var(--surface-main)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span className="section-tag" style={{ margin: 0 }}>
              [ CAMPAIGN MANIFEST ]
            </span>
            <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
              CONFIG
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>STRATEGY:</span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)', textAlign: 'right' }}>
                {strategy === 'mutuals_alumni_first' ? 'Mutuals & Alumni' : strategy === 'hr_first' ? 'HR / Recruiters' : 'Engineering / Tech'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>TARGET QUOTA:</span>
              <span style={{ fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--success-green)' }}>
                {maxPerCompany} connections
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>SUPERVISION:</span>
              <span className={`badge ${approvalMode ? 'badge-tech' : 'badge-neutral'}`} style={{ fontSize: '10.5px' }}>
                {approvalMode ? 'MANUAL APPROVAL' : 'AUTOPILOT'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>LOCATION:</span>
              <span style={{ fontWeight: '500', color: locationFilter ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {locationFilter || 'Any Location'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>GENDER:</span>
              <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                {genderFilter === 'all' ? 'All Genders' : genderFilter === 'female' ? 'Women in Tech' : 'Men'}
              </span>
            </div>
          </div>
        </div>

        {/* Safety & Compliance Assurance */}
        <div className="card" style={{ padding: '18px 20px', backgroundColor: 'var(--surface-main)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                RATE-LIMIT COMPLIANT
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.45 }}>
                Human-like delays, anti-duplicate tracking, and automated pausing if LinkedIn requests challenge verification.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
