import React from 'react';
import { Activity } from 'lucide-react';

const LiveEventFeed = ({ description, eventMomentum, weatherImpact }) => {
  return (
    <div className="panel-section">
      <div className="panel-section-title"><Activity size={12} /> Live Event</div>
      <div style={{ padding: 12, borderRadius: 12, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, marginBottom: 4 }}>{description}</div>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
          Momentum: {Math.round(eventMomentum * 100)}% • Weather Factor: {Math.round(weatherImpact * 100)}%
        </div>
      </div>
    </div>
  );
};

export default LiveEventFeed;
