import React from 'react';

const StatsBar = ({ avgWait, crowdLevel, meetingPointName }) => {
  return (
    <div className="stats-bar" style={{ gridColumn: '1 / -1' }}>
      <div className="stat-card">
        <div className="stat-label">Avg Wait</div>
        <div className="stat-value" style={{ color: avgWait < 8 ? 'var(--low)' : avgWait < 15 ? 'var(--medium)' : 'var(--high)' }}>
          {avgWait} min
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Crowd Level</div>
        <div className="stat-value" style={{ color: crowdLevel < 40 ? 'var(--low)' : crowdLevel < 70 ? 'var(--medium)' : 'var(--high)' }}>
          {crowdLevel}%
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Meeting Point</div>
        <div className="stat-value" style={{ fontSize: '0.7rem' }}>
          {meetingPointName || 'Syncing...'}
        </div>
      </div>
      <div className="stat-card" style={{ display: 'none' }}>
        <div className="stat-label">Efficiency</div>
        <div className="stat-value" style={{ color: 'var(--low)' }}>+24%</div>
      </div>
    </div>
  );
};

export default StatsBar;
