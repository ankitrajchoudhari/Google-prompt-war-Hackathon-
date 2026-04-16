import React from 'react';
import { Users } from 'lucide-react';

const GroupPanel = ({ groupCode, members }) => {
  return (
    <div className="panel-section">
      <div className="panel-section-title"><Users size={12} /> Group • {groupCode}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {members.map((m) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900 }}>
              {m.name[0]}
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700 }}>{m.name}</div>
              <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
                ({Math.round(m.x)}, {Math.round(m.y)})
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupPanel;
