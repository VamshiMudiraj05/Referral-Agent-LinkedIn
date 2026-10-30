import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Trash2, 
  ArrowDown, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  XCircle,
  Clock
} from 'lucide-react';

export default function LiveActivityLog({ logs = [], onClear }) {
  const [filter, setFilter] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(l => 
    l.message.toLowerCase().includes(filter.toLowerCase())
  );

  const getLogVisual = (type) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 size={14} color="#10B981" />,
          textColor: '#34D399',
          prefix: '[SUCCESS]'
        };
      case 'warning':
        return {
          icon: <Clock size={14} color="#F59E0B" />,
          textColor: '#FBBF24',
          prefix: '[WAIT]'
        };
      case 'error':
        return {
          icon: <XCircle size={14} color="#EF4444" />,
          textColor: '#F87171',
          prefix: '[ERROR]'
        };
      case 'alert':
        return {
          icon: <AlertCircle size={14} color="#EF4444" />,
          textColor: '#F87171',
          prefix: '[SECURITY]'
        };
      default:
        return {
          icon: <ArrowRight size={14} color="#E7E2D5" />,
          textColor: '#E7E2D5',
          prefix: '[INFO]'
        };
    }
  };

  return (
    <div className="terminal-window scroll-reveal">
      {/* Terminal Title Bar */}
      <div className="terminal-header">
        <div className="terminal-dots">
          <span className="terminal-dot close" />
          <span className="terminal-dot min" />
          <span className="terminal-dot max" />
        </div>

        <div className="terminal-title">
          $ referpilot --stream-activity (stdout)
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="status-dot active" style={{ width: '6px', height: '6px' }} />
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#A8A29E', letterSpacing: '0.04em' }}>
            {logs.length} EVENTS
          </span>
        </div>
      </div>

      {/* Terminal Controls Bar */}
      <div style={{
        padding: '10px 16px',
        backgroundColor: '#1E1B16',
        borderBottom: '1px solid #2B2620',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="grep events..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              backgroundColor: '#14120F',
              border: '1px solid #38322B',
              borderRadius: '6px',
              padding: '5px 10px 5px 28px',
              color: '#FFFBF2',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
              width: '180px'
            }}
          />
          <Search size={12} color="#78716C" style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              backgroundColor: autoScroll ? '#28231D' : 'transparent',
              color: autoScroll ? '#FFFBF2' : '#78716C',
              border: '1px solid #38322B',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer'
            }}
            title={autoScroll ? 'Disable Auto-scroll' : 'Enable Auto-scroll'}
          >
            <ArrowDown size={12} style={{ opacity: autoScroll ? 1 : 0.4 }} />
            <span>AUTO-SCROLL</span>
          </button>

          <button
            onClick={onClear}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              backgroundColor: 'transparent',
              color: '#A8A29E',
              border: '1px solid #38322B',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer'
            }}
            title="Clear Stream"
          >
            <Trash2 size={12} />
            <span>CLEAR</span>
          </button>
        </div>
      </div>

      {/* Activity Timeline Terminal List */}
      <div
        ref={containerRef}
        className="activity-feed-container"
        style={{ minHeight: '340px', maxHeight: '480px', border: 'none', borderRadius: 0 }}
      >
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#78716C', fontFamily: 'var(--font-mono)' }}>
            <Activity size={32} strokeWidth={1.5} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div style={{ fontSize: '13.5px', color: '#D6D3CD', fontWeight: '500' }}>
              $ awaiting campaign dispatch...
            </div>
            <div style={{ fontSize: '12px', color: '#78716C', marginTop: '6px' }}>
              Launch a campaign from the setup tab to stream automated browser actions live.
            </div>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const visual = getLogVisual(log.type);
            const isAlert = log.type === 'alert' || log.type === 'error';
            return (
              <div
                key={log.id}
                className={`activity-feed-item ${isAlert ? 'alert-item' : ''}`}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                <div style={{ marginTop: '2px', flexShrink: 0 }}>
                  {visual.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: visual.textColor, fontSize: '12.5px', wordBreak: 'break-word', lineHeight: '1.5' }}>
                    <span style={{ color: '#78716C', marginRight: '6px', fontSize: '11px' }}>{visual.prefix}</span>
                    {log.message}
                  </div>
                </div>
                <span className="activity-feed-time" style={{ color: '#78716C', fontSize: '11px' }}>
                  {log.timestamp}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
