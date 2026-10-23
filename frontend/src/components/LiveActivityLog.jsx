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
          icon: <CheckCircle2 size={15} color="var(--success-green)" />,
          textColor: 'var(--text-primary)'
        };
      case 'warning':
        return {
          icon: <Clock size={15} color="var(--warning-amber)" />,
          textColor: 'var(--warning-amber)'
        };
      case 'error':
        return {
          icon: <XCircle size={15} color="var(--error-rose)" />,
          textColor: 'var(--error-rose)'
        };
      case 'alert':
        return {
          icon: <AlertCircle size={15} color="var(--error-rose)" />,
          textColor: 'var(--error-rose)'
        };
      default:
        return {
          icon: <ArrowRight size={15} color="var(--action-blue)" />,
          textColor: 'var(--text-primary)'
        };
    }
  };

  return (
    <div className="card" style={{ padding: '24px 28px', backgroundColor: 'var(--surface-main)' }}>
      {/* Activity Header & Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '18px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <Activity size={19} color="var(--action-blue)" />
          <h3 style={{ fontSize: '17px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Campaign Activity Feed
          </h3>
          <span className="badge badge-neutral" style={{ fontSize: '11.5px' }}>
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
                backgroundColor: 'var(--surface-input)',
                border: '1px solid var(--border-divider)',
                borderRadius: '8px',
                padding: '6px 10px 6px 30px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
                width: '160px'
              }}
            />
            <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '13px' }}
            title={autoScroll ? 'Disable Auto-scroll' : 'Enable Auto-scroll'}
          >
            <ArrowDown size={13} style={{ opacity: autoScroll ? 1 : 0.4 }} />
            <span>Auto-scroll</span>
          </button>

          <button
            onClick={onClear}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '13px' }}
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
        style={{ minHeight: '300px', maxHeight: '440px' }}
      >
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '52px 20px', color: 'var(--text-muted)' }}>
            <Activity size={36} strokeWidth={1.5} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <div style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: '500' }}>
              No campaign activities yet.
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
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
                  <div style={{ color: visual.textColor, fontSize: '13.5px', wordBreak: 'break-word', lineHeight: '1.45' }}>
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
