import React from 'react';
import { Map as MapIcon } from 'lucide-react';

const VenueMap = ({ VENUE_GRAPH, densities, users, locations, getDensityColor, centroid }) => {
  return (
    <div className="panel-center">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="panel-section-title" style={{ margin: 0 }}>
          <MapIcon size={12} /> Live Venue Map
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.55rem', fontWeight: 700 }}>
          <span style={{ color: 'var(--low)' }}>● Low</span>
          <span style={{ color: 'var(--medium)' }}>● Med</span>
          <span style={{ color: 'var(--high)' }}>● High</span>
        </div>
      </div>

      <div className="map-viewport">
        <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" style={{ opacity: 0.6 }}>
          {VENUE_GRAPH.edges.map((edge, idx) => {
            const from = VENUE_GRAPH.nodes.find((n) => n.id === edge.from);
            const to = VENUE_GRAPH.nodes.find((n) => n.id === edge.to);
            if (!from || !to) return null;
            const d = densities.find((den) => den.locationId === edge.to)?.density || 20;
            const color = getDensityColor(d);
            return (
              <g key={idx}>
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeWidth="4" strokeOpacity="0.3" />
                <circle r="3" fill={color} opacity="0.8">
                  <animateMotion path={`M${from.x},${from.y} L${to.x},${to.y}`} dur="4s" repeatCount="indefinite" />
                </circle>
              </g>
            );
          })}

          {users.slice(0, 400).map((u) => (
            <circle
              key={u.id}
              cx={u.x}
              cy={u.y}
              r={u.groupId ? 3 : 1.5}
              fill={u.groupId ? '#6366f1' : '#ffffff'}
              opacity={u.groupId ? 0.9 : 0.2}
            />
          ))}

          {locations.map((loc) => {
            const d = densities.find((den) => den.locationId === loc.id)?.density || 0;
            const color = getDensityColor(d);
            return (
              <g key={loc.id}>
                <circle cx={loc.x} cy={loc.y} r={loc.radius} fill={color} opacity="0.08" />
                <circle cx={loc.x} cy={loc.y} r="14" fill="var(--bg)" stroke={color} strokeWidth="2" />
                <text x={loc.x} y={loc.y + 3} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
                  {loc.type === 'FOOD' ? '🍔' : loc.type === 'RESTROOM' ? '🚻' : loc.type === 'SHOP' ? '🏪' : loc.type === 'PHOTO' ? '📸' : '🚪'}
                </text>
                <text x={loc.x} y={loc.y + 28} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="9" fontWeight="600">
                  {loc.name}
                </text>
              </g>
            );
          })}

          {centroid && (
            <g>
              <circle cx={centroid.x} cy={centroid.y} r="8" fill="none" stroke="var(--secondary)" strokeWidth="2" strokeDasharray="4,4">
                <animateTransform attributeName="transform" type="rotate" from={`0 ${centroid.x} ${centroid.y}`} to={`360 ${centroid.x} ${centroid.y}`} dur="4s" repeatCount="indefinite" />
              </circle>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

export default VenueMap;
