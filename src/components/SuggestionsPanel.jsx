import React from 'react';
import { TrendingUp } from 'lucide-react';

const SuggestionsPanel = ({ densities, getDensityColor, getDensityLabel, onPlaceOrder }) => {
  return (
    <div className="panel-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="panel-section-title" style={{ margin: 0 }}>
          <TrendingUp size={12} /> AI Suggestions
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse-soft 2s infinite' }} />
          <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>Live</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {densities.slice(0, 4).map((s) => (
          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', transition: 'all 0.2s', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: 3 }}>{s.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: getDensityColor(s.density) }}>
                  {s.predictedWait} min wait
                </span>
                <span style={{ fontSize: '0.55rem', fontWeight: 600, color: 'var(--text-muted)', padding: '1px 6px', borderRadius: 6, background: 'rgba(255,255,255,0.04)' }}>
                  {getDensityLabel(s.density)}
                </span>
              </div>
            </div>
            <button className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.6rem' }}
              onClick={() => onPlaceOrder(s.id)}
            >
              Go Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestionsPanel;
