import React from 'react';
import { Activity, Settings } from 'lucide-react';

const Header = ({ liveEvent, usersCount, onToggleSettings, isSettingsOpen }) => {
  return (
    <header>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.03em' }}>VenueIQ</h1>
        <div className="game-clock pulsing" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={12} />
          <span className="mono" style={{ fontSize: '0.7rem' }}>{liveEvent.score} • Q3</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--low)', textTransform: 'uppercase' }}>
          ● Live {usersCount > 0 ? '1K' : '...'}
        </span>
        <button
          onClick={onToggleSettings}
          style={{ 
            background: isSettingsOpen ? 'var(--primary)' : 'rgba(255,255,255,0.05)', 
            border: 'none', 
            borderRadius: 8, 
            padding: '6px', 
            cursor: 'pointer', 
            color: 'white', 
            display: 'flex' 
          }}
        >
          <Settings size={14} />
        </button>
      </div>
    </header>
  );
};

export default Header;
