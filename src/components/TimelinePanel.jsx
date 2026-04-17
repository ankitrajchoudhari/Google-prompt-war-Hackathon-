import React from 'react';
import { Clock } from 'lucide-react';

const TimelinePanel = React.memo(({ timeline }) => {
  return (
    <div className="panel-section" role="region" aria-label="Timeline Panel">
      <div className="panel-section-title"><Clock size={12} aria-hidden="true" /> ML Timeline</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {timeline.length === 0 && (
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Generating optimized schedule...</p>
        )}
        {timeline.slice(0, 4).map((t) => (
          <div
            key={t.id}
            style={{
              padding: '12px 14px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.02)',
              borderLeft: `3px solid ${t.status === 'RED' ? 'var(--high)' : t.status === 'YELLOW' ? 'var(--medium)' : 'var(--low)'}`,
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: 4 }}>{t.activity}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              <Clock size={10} /> {t.time}
              {t.suggestion && <span style={{ marginLeft: 'auto', fontSize: '0.55rem', color: t.status === 'RED' ? 'var(--high)' : 'var(--low)' }}>• {t.suggestion.substring(0, 30)}...</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default TimelinePanel;
