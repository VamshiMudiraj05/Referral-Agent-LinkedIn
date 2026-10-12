import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Send, 
  Users, 
  Layers, 
  Terminal, 
  History as HistoryIcon, 
  FileText, 
  Play, 
  Square, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  UserCheck,
  Compass,
  ArrowRight
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Professional Navigation Bar */}
      <nav style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          {/* Brand Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              backgroundColor: '#0A66C2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <Compass size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: '700', letterSpacing: '-0.02em', color: '#1D2226' }}>
                  ReferPilot
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: '600',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#EBF4FD',
                  color: '#0A66C2',
                  border: '1px solid #CBE2FB'
                }}>
                  AI
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#7A8A99', lineHeight: 1 }}>
                AI-powered referral outreach
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '100%', overflowX: 'auto' }}>
            {[
              { id: 'setup', label: 'Campaigns', icon: <Layers size={16} /> },
              { id: 'live', label: 'Live Activity', icon: <Terminal size={16} />, hasDot: isRunning },
              { id: 'candidates', label: `Candidates (${candidates.length})`, icon: <Users size={16} /> },
              { id: 'history', label: `History (${history.length})`, icon: <HistoryIcon size={16} /> },
              { id: 'report', label: 'Reports', icon: <FileText size={16} /> }
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
                    padding: '0 14px',
                    height: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: isActive ? '2px solid #0A66C2' : '2px solid transparent',
                    color: isActive ? '#0A66C2' : '#56687A',
                    fontWeight: isActive ? '600' : '500',
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.15s ease'
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = '#1D2226'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = '#56687A'; }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.hasDot && (
                    <span className="status-dot active" style={{ width: '6px', height: '6px' }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Top Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isRunning ? (
              <button
                onClick={handleStopCampaign}
                className="btn btn-danger"
                style={{ padding: '6px 14px', fontSize: '0.82rem' }}
              >
                <Square size={13} fill="#CC1016" /> Stop Campaign
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('setup')}
                className="btn btn-primary"
                style={{ padding: '7px 16px', fontSize: '0.84rem' }}
              >
                <Play size={13} fill="#FFFFFF" /> New Campaign
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Centered Content */}
      <main className="container" style={{ flex: 1 }}>
        {/* Safety Alert Banner */}
        <SafetyBanner
          isPaused={isPaused}
          pauseReason={pauseReason}
          onResume={handleResumeSafety}
        />

        {/* Compact Campaign Overview Bar */}
        <section className="card" style={{ padding: '14px 20px', marginBottom: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1D2226' }}>
                Campaign Overview
              </span>
              {currentCompany && (
                <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                  Target: <strong>{currentCompany}</strong>
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className={`status-dot ${isPaused ? 'alert' : isRunning ? 'active' : 'idle'}`} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {isPaused ? 'Awaiting Manual Verification' : isRunning ? 'Agent Active' : 'Ready'}
              </span>
            </div>
          </div>

          {campaignProgress.target > 0 && (
            <div className="campaign-progress">
              <div className="campaign-progress__label">
                <span>Confirmed requests</span>
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
                Counts only requests confirmed by LinkedIn.
              </span>
            </div>
          )}

          <div className="kpi-grid">
            <div style={{ padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Requests sent</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#057642', marginTop: '2px' }}>{stats.sent}</div>
            </div>

            <div style={{ padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: '500' }}>HR / Talent</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#6B21A8', marginTop: '2px' }}>{stats.salesSent}</div>
            </div>

            <div style={{ padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: '500' }}>IT / Engineering</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0A66C2', marginTop: '2px' }}>{stats.itSent}</div>
            </div>

            <div style={{ padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Skipped</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-secondary)', marginTop: '2px' }}>{stats.skipped}</div>
            </div>

            <div style={{ padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Connected / Pending</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#915907', marginTop: '2px' }}>
                {(stats.alreadyConnected || 0) + (stats.pending || 0)}
              </div>
            </div>

            <div style={{ padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Failed</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: stats.failed > 0 ? '#CC1016' : 'var(--text-muted)', marginTop: '2px' }}>
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
              <div className="card" style={{ padding: '14px 18px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={18} color="#0A66C2" />
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Target</span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#1D2226' }}>{currentCompany}</h3>
                  </div>
                </div>
                {currentMessage && (
                  <div style={{ maxWidth: '620px', fontSize: '0.82rem', color: 'var(--text-secondary)', backgroundColor: '#F8FAFC', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <strong>Note:</strong> "{currentMessage.substring(0, 110)}..."
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

      {/* Professional Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        backgroundColor: '#FFFFFF',
        padding: '16px 20px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>ReferPilot • AI Referral Outreach Assistant</div>
          <div>Compliant with Rate Limits & Human-in-the-Loop Approval</div>
        </div>
      </footer>
    </div>
  );
}
