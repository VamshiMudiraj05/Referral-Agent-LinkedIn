import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Users, 
  Layers, 
  Terminal, 
  History as HistoryIcon, 
  FileText, 
  Play, 
  Square, 
  Clock, 
  AlertTriangle,
  Compass,
  CheckCircle,
  XCircle,
  Briefcase
} from 'lucide-react';
import confetti from 'canvas-confetti';

import CampaignSetup from './components/CampaignSetup';
import CompanyVerification from './components/CompanyVerification';
import ApprovalModal from './components/ApprovalModal';
import LiveActivityLog from './components/LiveActivityLog';
import CandidateTable from './components/CandidateTable';
import FinalReport from './components/FinalReport';
import HistoryView from './components/HistoryView';
import SafetyBanner from './components/SafetyBanner';

export default function App() {
  const [activeTab, setActiveTab] = useState('setup'); // 'setup' | 'live' | 'candidates' | 'history' | 'report'
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    skipped: 0,
    alreadyConnected: 0,
    pending: 0,
    failed: 0,
    salesSent: 0,
    itSent: 0
  });
  const [campaignProgress, setCampaignProgress] = useState({ sent: 0, target: 0 });

  const [candidates, setCandidates] = useState([]);
  const [history, setHistory] = useState([]);
  const [lastCampaign, setLastCampaign] = useState(null);
  const [approvalRequest, setApprovalRequest] = useState(null);
  const [companyVerification, setCompanyVerification] = useState(null);
  const [finalReport, setFinalReport] = useState(null);

  const wsRef = useRef(null);

  // Setup WebSocket connection with auto-reconnect
  useEffect(() => {
    let ws;
    let reconnectTimer;

    const connectWs = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.hostname}:3001`;

      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to Agent WebSocket');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWsMessage(data);
        } catch (err) {
          console.error('Error handling WS event:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket closed, attempting reconnect in 3s...');
        reconnectTimer = setTimeout(connectWs, 3000);
      };

      ws.onerror = (err) => {
        console.warn('WS error:', err);
        ws.close();
      };
    };

    connectWs();

    // Fetch initial history
    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        if (data.records) setHistory(data.records);
        if (data.stats) setStats(data.stats);
        if (data.lastCampaign) setLastCampaign(data.lastCampaign);
      })
      .catch(() => {});

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, []);

  const handleWsMessage = (msg) => {
    switch (msg.type) {
      case 'INIT_STATE':
        setIsRunning(msg.isRunning);
        if (msg.history) setHistory(msg.history);
        if (msg.stats) setStats(msg.stats);
        if (msg.lastCampaign) setLastCampaign(msg.lastCampaign);
        break;

      case 'LOG':
        setLogs(prev => [...prev, msg.log]);
        break;

      case 'STATS_UPDATE':
        setStats(prev => ({ ...prev, ...msg.stats }));
        break;

      case 'CAMPAIGN_PROGRESS':
        setCampaignProgress({
          sent: Math.max(0, Number(msg.sent) || 0),
          target: Math.max(0, Number(msg.target) || 0)
        });
        break;

      case 'REQUIRE_LOGIN':
        setIsPaused(true);
        setPauseReason(msg.message);
        break;

      case 'LOGIN_CONFIRMED':
        setIsPaused(false);
        setPauseReason('');
        break;

      case 'SECURITY_ALERT':
        setIsPaused(true);
        setPauseReason(msg.reason);
        break;

      case 'SECURITY_ALERT_RESOLVED':
        setIsPaused(false);
        setPauseReason('');
        break;

      case 'COMPANY_VERIFICATION_REQUIRED':
        setCompanyVerification(msg.companySummary);
        if (msg.candidates) setCandidates(msg.candidates);
        setActiveTab('live');
        break;

      case 'COMPANY_VERIFIED_AUTO':
        setCompanyVerification(null);
        break;

      case 'REQUIRE_APPROVAL':
        setApprovalRequest(msg.data);
        break;

      case 'CAMPAIGN_FINISHED':
        setIsRunning(false);
        setFinalReport(msg.report);
        if (msg.report?.lastCampaign) {
          setCampaignProgress({
            sent: msg.report.lastCampaign.stats?.sent || 0,
            target: msg.report.lastCampaign.targetTotal || 0
          });
        }
        if (msg.report?.records) setHistory(msg.report.records);
        if (msg.report?.lastCampaign) setLastCampaign(msg.report.lastCampaign);
        setActiveTab('report');
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } catch (e) {}
        break;

      case 'CAMPAIGN_ERROR':
        setIsRunning(false);
        alert(`Campaign Error: ${msg.error}`);
        break;

      default:
        break;
    }
  };

  const handleStartCampaign = async (config) => {
    setCurrentCompany(config.companyName);
    setCurrentMessage(config.referralMessage);
    setCampaignProgress({ sent: 0, target: Math.max(0, Number(config.maxSession) || Number(config.maxPerCompany) || 0) });
    setIsRunning(true);
    setFinalReport(null);
    setCompanyVerification(null);
    setActiveTab('live');

    try {
      const res = await fetch('/api/campaign/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start campaign');
      }
    } catch (err) {
      setIsRunning(false);
      alert(`Error starting campaign: ${err.message}`);
    }
  };

  const handleStopCampaign = async () => {
    try {
      await fetch('/api/campaign/stop', { method: 'POST' });
      setIsRunning(false);
      setApprovalRequest(null);
      setCompanyVerification(null);
    } catch (err) {
      console.error('Stop campaign error:', err);
    }
  };

  const handleCompanyVerificationDecision = async (decision) => {
    setCompanyVerification(null);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'COMPANY_VERIFICATION_DECISION',
        data: decision
      }));
    } else {
      await fetch('/api/campaign/verify-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(decision)
      });
    }
  };

  const handleApprovalDecision = async (decision) => {
    setApprovalRequest(null);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'APPROVAL_DECISION',
        data: decision
      }));
    } else {
      await fetch('/api/campaign/approval-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(decision)
      });
    }
  };

  const handleResumeSafety = async () => {
    setIsPaused(false);
    setPauseReason('');
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'RESUME_SAFETY' }));
    } else {
      await fetch('/api/campaign/resume-safety', { method: 'POST' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)' }}>
      {/* Top Zentra-Inspired Navigation Bar */}
      <header style={{
        backgroundColor: 'var(--surface-main)',
        borderBottom: '1px solid var(--border-divider)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: '1260px',
          margin: '0 auto',
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          {/* Brand Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              backgroundColor: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFBF2',
              boxShadow: '0 2px 6px rgba(18, 16, 14, 0.2)'
            }}>
              <Compass size={19} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  ReferPilot
                </span>
                <span className="badge" style={{
                  fontSize: '10.5px',
                  fontWeight: '700',
                  padding: '2px 7px',
                  backgroundColor: 'var(--accent-banana)',
                  color: '#12100E',
                  borderRadius: 'var(--radius-pill)',
                  letterSpacing: '0.04em'
                }}>
                  v2.4
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.1, marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                autonomous outreach agent
              </div>
            </div>
          </div>

          {/* Terminal Status Pill */}
          <div className="terminal-pill" style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span className={`status-dot ${isRunning ? 'active' : isPaused ? 'waiting' : 'idle'}`} style={{ width: '6px', height: '6px' }} />
            <span>$ referpilot {isRunning ? '--active' : isPaused ? '--paused' : '--idle'}</span>
          </div>

          {/* Navigation Segmented Controls */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--surface-secondary)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid var(--border-divider)',
            gap: '2px',
            overflowX: 'auto'
          }}>
            {[
              { id: 'setup', label: 'Campaigns', icon: <Layers size={15} /> },
              { id: 'live', label: 'Live Activity', icon: <Terminal size={15} />, hasDot: isRunning },
              { id: 'candidates', label: `Candidates (${candidates.length})`, icon: <Users size={15} /> },
              { id: 'history', label: `History (${history.length})`, icon: <HistoryIcon size={15} /> },
              { id: 'report', label: 'Reports', icon: <FileText size={15} /> }
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    background: isActive ? 'var(--surface-main)' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? '600' : '500',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: isActive ? '0 1px 3px rgba(23, 25, 29, 0.06)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <span style={{ color: isActive ? 'var(--action-blue)' : 'inherit', display: 'flex' }}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  {tab.hasDot && (
                    <span className="status-dot active" style={{ width: '6px', height: '6px' }} />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Top Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isRunning ? (
              <button
                onClick={handleStopCampaign}
                className="btn btn-danger"
                style={{ padding: '7px 15px', fontSize: '13.5px' }}
              >
                <Square size={13} fill="currentColor" />
                <span>Stop Campaign</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('setup')}
                className="btn btn-primary"
                style={{ padding: '7px 16px', fontSize: '13.5px' }}
              >
                <Play size={13} fill="#FFFFFF" />
                <span>New Campaign</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Centered Content */}
      <main className="container" style={{ flex: 1 }}>
        {/* Safety Alert Banner */}
        <SafetyBanner
          isPaused={isPaused}
          pauseReason={pauseReason}
          onResume={handleResumeSafety}
        />

        {/* Campaign Overview Section (Zentra Style) */}
        <section className="card" style={{ padding: '18px 22px', marginBottom: '22px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Campaign Overview
              </span>
              {currentCompany && (
                <span className="badge badge-neutral" style={{ fontSize: '12px' }}>
                  Target: <strong style={{ color: 'var(--text-primary)', marginLeft: '3px' }}>{currentCompany}</strong>
                </span>
              )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '4px 10px',
              backgroundColor: 'var(--surface-secondary)',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-divider)'
            }}>
              <span className={`status-dot ${isPaused ? 'alert' : isRunning ? 'active' : 'idle'}`} />
              <span style={{ fontSize: '12.5px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                {isPaused ? 'Awaiting Manual Verification' : isRunning ? 'Agent Active' : 'Ready'}
              </span>
            </div>
          </div>

          {campaignProgress.target > 0 && (
            <div className="campaign-progress">
              <div className="campaign-progress__label">
                <span>Confirmed connection requests sent</span>
                <strong>{Math.min(campaignProgress.sent, campaignProgress.target)} / {campaignProgress.target}</strong>
              </div>
              <div
                className="campaign-progress__track"
                role="progressbar"
                aria-label="Confirmed connection requests"
                aria-valuemin={0}
                aria-valuemax={campaignProgress.target}
                aria-valuenow={Math.min(campaignProgress.sent, campaignProgress.target)}
              >
                <div
                  className="campaign-progress__fill"
                  style={{ width: `${Math.min(100, (campaignProgress.sent / campaignProgress.target) * 100)}%` }}
                />
              </div>
              <span className="campaign-progress__hint">
                Strict counting: only requests verified and confirmed by LinkedIn are counted towards target.
              </span>
            </div>
          )}

          {/* 6 Aligned Metric Cards */}
          <div className="kpi-grid">
            {/* 1. Requests Sent */}
            <div className="kpi-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '500' }}>Requests sent</span>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '7px',
                  backgroundColor: 'var(--success-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--success-green)'
                }}>
                  <CheckCircle size={14} />
                </div>
              </div>
              <div style={{ fontSize: '30px', fontWeight: '600', color: 'var(--success-green)', marginTop: '8px', lineHeight: 1 }}>
                {stats.sent}
              </div>
            </div>

            {/* 2. HR / Talent */}
            <div className="kpi-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '500' }}>HR / Talent</span>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '7px',
                  backgroundColor: 'var(--accent-lavender-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-lavender)'
                }}>
                  <Users size={14} />
                </div>
              </div>
              <div style={{ fontSize: '30px', fontWeight: '600', color: 'var(--accent-lavender)', marginTop: '8px', lineHeight: 1 }}>
                {stats.salesSent}
              </div>
            </div>

            {/* 3. IT / Engineering */}
            <div className="kpi-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '500' }}>IT / Engineering</span>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '7px',
                  backgroundColor: 'var(--action-blue-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--action-blue)'
                }}>
                  <Briefcase size={14} />
                </div>
              </div>
              <div style={{ fontSize: '30px', fontWeight: '600', color: 'var(--action-blue)', marginTop: '8px', lineHeight: 1 }}>
                {stats.itSent}
              </div>
            </div>

            {/* 4. Skipped */}
            <div className="kpi-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '500' }}>Skipped</span>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '7px',
                  backgroundColor: 'var(--surface-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)'
                }}>
                  <XCircle size={14} />
                </div>
              </div>
              <div style={{ fontSize: '30px', fontWeight: '600', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1 }}>
                {stats.skipped}
              </div>
            </div>

            {/* 5. Connected / Pending */}
            <div className="kpi-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '500' }}>Connected / Pending</span>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '7px',
                  backgroundColor: 'var(--warning-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--warning-amber)'
                }}>
                  <Clock size={14} />
                </div>
              </div>
              <div style={{ fontSize: '30px', fontWeight: '600', color: 'var(--warning-amber)', marginTop: '8px', lineHeight: 1 }}>
                {(stats.alreadyConnected || 0) + (stats.pending || 0)}
              </div>
            </div>

            {/* 6. Failed */}
            <div className="kpi-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '500' }}>Failed</span>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '7px',
                  backgroundColor: 'var(--error-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--error-rose)'
                }}>
                  <AlertTriangle size={14} />
                </div>
              </div>
              <div style={{ fontSize: '30px', fontWeight: '600', color: stats.failed > 0 ? 'var(--error-rose)' : 'var(--text-muted)', marginTop: '8px', lineHeight: 1 }}>
                {stats.failed}
              </div>
            </div>
          </div>
        </section>

        {/* Tab Panels */}
        {activeTab === 'setup' && (
          <CampaignSetup
            onStartCampaign={handleStartCampaign}
            isRunning={isRunning}
            recentCompanies={history.map(record => record.company).filter(Boolean)}
          />
        )}

        {activeTab === 'live' && (
          <div>
            {/* Target Company Verification Card if awaiting confirmation */}
            {companyVerification && (
              <CompanyVerification
                companySummary={companyVerification}
                onDecision={handleCompanyVerificationDecision}
              />
            )}

            {/* Current Active Campaign Notice */}
            {currentCompany && (
              <div className="card" style={{ padding: '16px 20px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '9px',
                    backgroundColor: 'var(--action-blue-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--action-blue)'
                  }}>
                    <Building2 size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '600' }}>
                      Active Target Company
                    </span>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '1px' }}>
                      {currentCompany}
                    </h3>
                  </div>
                </div>
                {currentMessage && (
                  <div style={{
                    maxWidth: '620px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--surface-secondary)',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-divider)'
                  }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Note:</strong> "{currentMessage.substring(0, 110)}..."
                  </div>
                )}
              </div>
            )}

            <LiveActivityLog
              logs={logs}
              onClear={() => setLogs([])}
            />
          </div>
        )}

        {activeTab === 'candidates' && (
          <CandidateTable
            candidates={candidates}
            currentCompany={currentCompany}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            history={history}
            lastCampaign={lastCampaign}
          />
        )}

        {activeTab === 'report' && (
          <FinalReport
            report={finalReport || { stats, records: history }}
            companyName={currentCompany}
            onNewCampaign={() => setActiveTab('setup')}
          />
        )}

        {/* Human Approval Floating Modal */}
        {approvalRequest && (
          <ApprovalModal
            key={approvalRequest.candidate?.profileUrl || approvalRequest.candidate?.personName}
            data={approvalRequest}
            onDecision={handleApprovalDecision}
          />
        )}
      </main>

      {/* Modern Minimalist Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-divider)',
        backgroundColor: 'var(--surface-main)',
        padding: '16px 24px',
        textAlign: 'center',
        fontSize: '13px',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ maxWidth: '1260px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>ReferPilot</span>
            <span>&bull;</span>
            <span>AI Referral Outreach Dashboard</span>
          </div>
          <div>Compliant with Rate Limits &amp; Human-in-the-Loop Safeguards</div>
        </div>
      </footer>
    </div>
  );
}
