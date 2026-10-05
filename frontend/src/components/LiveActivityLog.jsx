import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Trash2, 
  ArrowDown, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
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
          icon: <CheckCircle2 size={15} color="#057642" />,
          textColor: '#1D2226'
        };
      case 'warning':
        return {
          icon: <Clock size={15} color="#915907" />,
          textColor: '#915907'
        };
      case 'error':
        return {
          icon: <XCircle size={15} color="#CC1016" />,
          textColor: '#CC1016'
        };
      case 'alert':
        return {
          icon: <AlertCircle size={15} color="#CC1016" />,
          textColor: '#CC1016'
        };
      default:
        return {
          icon: <ArrowRight size={15} color="#0A66C2" />,
          textColor: '#1D2226'
        };
    }
  };

  return (
    <div className="card" style={{ padding: '20px 24px', backgroundColor: '#FFFFFF' }}>
      {/* Activity Header & Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="#0A66C2" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#1D2226' }}>
            Campaign Activity Feed
          </h3>
          <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
            {logs.length} updates
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Search Filter */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search feed..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '6px 10px 6px 28px',
                color: '#1D2226',
                fontSize: '0.8rem',
                outline: 'none',
                width: '150px'
              }}
            />
            <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className="btn btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.78rem' }}
            title={autoScroll ? 'Disable Auto-scroll' : 'Enable Auto-scroll'}
          >
            <ArrowDown size={13} style={{ opacity: autoScroll ? 1 : 0.4 }} />
            <span>Auto-scroll</span>
          </button>

          <button
            onClick={onClear}
            className="btn btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.78rem' }}
            title="Clear Activity Feed"
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div
        ref={containerRef}
        className="activity-feed-container"
        style={{ minHeight: '280px', maxHeight: '420px', backgroundColor: '#FFFFFF' }}
      >
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
            <Activity size={32} strokeWidth={1.5} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              No campaign activities yet.
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '2px' }}>
              Launch a campaign from the setup tab to observe live automated actions.
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
              >
                <div style={{ marginTop: '2px', flexShrink: 0 }}>
                  {visual.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: visual.textColor, fontSize: '0.85rem', wordBreak: 'break-word', lineHeight: '1.4' }}>
                    {log.message}
                  </div>
                </div>
                <span className="activity-feed-time">
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
