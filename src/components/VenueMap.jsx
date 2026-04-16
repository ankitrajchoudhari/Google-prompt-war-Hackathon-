import React, { useState, useMemo } from 'react';
import { Map as MapIcon, Layers, Radio, Eye, Users, Wifi, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import SignalHeatmap from './SignalHeatmap';

// ─── Stadium Structure ─────────────────────────────
const STADIUM_SECTIONS = [
  // Seating bowl (elliptical)
  { type: 'bowl', cx: 400, cy: 250, rx: 340, ry: 200 },
  // Field
  { type: 'field', cx: 400, cy: 250, rx: 180, ry: 100 },
  // Concourse ring
  { type: 'concourse', cx: 400, cy: 250, rx: 370, ry: 225 },
  // Seating sections
  { type: 'section', id: 'SEC-101', x: 120, y: 180, w: 60, h: 25, label: '101' },
  { type: 'section', id: 'SEC-102', x: 200, y: 100, w: 60, h: 25, label: '102' },
  { type: 'section', id: 'SEC-103', x: 340, y: 65, w: 60, h: 25, label: '103' },
  { type: 'section', id: 'SEC-104', x: 400, y: 55, w: 60, h: 25, label: '104' },
  { type: 'section', id: 'SEC-105', x: 520, y: 80, w: 60, h: 25, label: '105' },
  { type: 'section', id: 'SEC-106', x: 620, y: 130, w: 60, h: 25, label: '106' },
  { type: 'section', id: 'SEC-107', x: 680, y: 220, w: 60, h: 25, label: '107' },
  { type: 'section', id: 'SEC-108', x: 660, y: 320, w: 60, h: 25, label: '108' },
  { type: 'section', id: 'SEC-109', x: 560, y: 390, w: 60, h: 25, label: '109' },
  { type: 'section', id: 'SEC-110', x: 400, y: 420, w: 60, h: 25, label: '110' },
  { type: 'section', id: 'SEC-111', x: 240, y: 400, w: 60, h: 25, label: '111' },
  { type: 'section', id: 'SEC-112', x: 120, y: 320, w: 60, h: 25, label: '112' },
];

// Concourse walkway paths
const WALKWAY_PATHS = [
  'M 55,250 Q 55,120 200,60',
  'M 200,60 Q 400,10 600,60',
  'M 600,60 Q 745,120 745,250',
  'M 745,250 Q 745,380 600,440',
  'M 600,440 Q 400,490 200,440',
  'M 200,440 Q 55,380 55,250',
];

// Gate positions on the concourse
const GATES = [
  { id: 'G-N', label: 'Gate N', x: 400, y: 18, angle: 0 },
  { id: 'G-E', label: 'Gate E', x: 758, y: 250, angle: 90 },
  { id: 'G-S', label: 'Gate S', x: 400, y: 482, angle: 180 },
  { id: 'G-W', label: 'Gate W', x: 42, y: 250, angle: 270 },
];

const VenueMap = ({ VENUE_GRAPH, densities, users, locations, getDensityColor, centroid, heatmapData, flowVectors, realDevice }) => {
  const [showSignalRings, setShowSignalRings] = useState(true);
  const [showFlowArrows, setShowFlowArrows] = useState(true);
  const [mapLayer, setMapLayer] = useState('signal');
  const [hoveredZone, setHoveredZone] = useState(null);
  const [showUsers, setShowUsers] = useState(true);

  // Compute zone info cards data
  const zoneCards = useMemo(() => {
    if (!densities || densities.length === 0) return [];
    return densities.map((d) => {
      const waitColor = d.predictedWait < 5 ? '#10b981' : d.predictedWait < 12 ? '#f59e0b' : '#ef4444';
      const densityPct = Math.round(d.density);
      const trend = densityPct > 60 ? 'rising' : densityPct < 30 ? 'falling' : 'stable';
      return { ...d, waitColor, densityPct, trend };
    });
  }, [densities]);

  // Find heatmap data for a zone
  const getHeat = (zoneId) => heatmapData?.find((h) => h.zoneId === zoneId);

  return (
    <div className="panel-center">
      {/* ─── Map Header ──────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="panel-section-title" style={{ margin: 0 }}>
          <MapIcon size={12} /> Live Venue Map
          <span style={{ fontSize: '0.45rem', color: 'var(--text-muted)', marginLeft: 8, fontWeight: 600, letterSpacing: '0.02em' }}>
            REAL-TIME CROWD INTELLIGENCE
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => setMapLayer(mapLayer === 'signal' ? 'standard' : 'signal')}
            title="Toggle signal heatmap"
            style={{
              background: mapLayer === 'signal' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${mapLayer === 'signal' ? 'rgba(99,102,241,0.4)' : 'var(--glass-border)'}`,
              borderRadius: 6, padding: '3px 6px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: 3,
            }}
          >
            <Radio size={9} />
            <span style={{ fontSize: '0.45rem', fontWeight: 700 }}>Signal</span>
          </button>
          <button onClick={() => setShowFlowArrows(!showFlowArrows)}
            style={{
              background: showFlowArrows ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${showFlowArrows ? 'rgba(99,102,241,0.4)' : 'var(--glass-border)'}`,
              borderRadius: 6, padding: '3px 6px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: 3,
            }}
          >
            <Layers size={9} />
            <span style={{ fontSize: '0.45rem', fontWeight: 700 }}>Flow</span>
          </button>
          <button onClick={() => setShowUsers(!showUsers)}
            style={{
              background: showUsers ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${showUsers ? 'rgba(16,185,129,0.4)' : 'var(--glass-border)'}`,
              borderRadius: 6, padding: '3px 6px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: 3,
            }}
          >
            <Eye size={9} />
            <span style={{ fontSize: '0.45rem', fontWeight: 700 }}>Crowd</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.5rem', fontWeight: 700, marginLeft: 4 }}>
            <span style={{ color: 'var(--low)', display: 'flex', alignItems: 'center', gap: 2 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--low)' }}></span>Low</span>
            <span style={{ color: 'var(--medium)', display: 'flex', alignItems: 'center', gap: 2 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--medium)' }}></span>Med</span>
            <span style={{ color: 'var(--high)', display: 'flex', alignItems: 'center', gap: 2 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--high)' }}></span>High</span>
          </div>
        </div>
      </div>

      {/* ─── Map Viewport ─────────────────────────── */}
      <div className="map-viewport" style={{ position: 'relative' }}>
        <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">
          <defs>
            {/* Stadium ambient glow */}
            <radialGradient id="field-glow" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
            {/* Grid pattern for stadium floor */}
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="40" y2="0" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
              <line x1="0" y1="0" x2="0" y2="40" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
            </pattern>
            {/* Concourse gradient */}
            <linearGradient id="concourse-stroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(99,102,241,0.3)" />
              <stop offset="50%" stopColor="rgba(236,72,153,0.2)" />
              <stop offset="100%" stopColor="rgba(99,102,241,0.3)" />
            </linearGradient>
          </defs>

          {/* Background grid */}
          <rect width="800" height="500" fill="url(#grid-pattern)" />

          {/* ── Stadium Structure ─── */}
          {/* Concourse ring (outer boundary) */}
          <ellipse cx={400} cy={250} rx={370} ry={225}
            fill="none" stroke="url(#concourse-stroke)" strokeWidth="2" strokeDasharray="6,3" opacity="0.6"
          />
          {/* Seating bowl */}
          <ellipse cx={400} cy={250} rx={340} ry={200}
            fill="rgba(99,102,241,0.02)" stroke="rgba(99,102,241,0.1)" strokeWidth="1"
          />
          {/* Inner bowl boundary */}
          <ellipse cx={400} cy={250} rx={220} ry={130}
            fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"
          />

          {/* ── Playing Field ─── */}
          <ellipse cx={400} cy={250} rx={180} ry={100}
            fill="url(#field-glow)" stroke="rgba(16,185,129,0.15)" strokeWidth="1.5"
          />
          {/* Field markings */}
          <line x1={400} y1={150} x2={400} y2={350} stroke="rgba(16,185,129,0.08)" strokeWidth="1" />
          <line x1={220} y1={250} x2={580} y2={250} stroke="rgba(16,185,129,0.08)" strokeWidth="1" />
          <circle cx={400} cy={250} r={30} fill="none" stroke="rgba(16,185,129,0.08)" strokeWidth="1" />
          <text x={400} y={254} textAnchor="middle" fill="rgba(16,185,129,0.15)" fontSize="11" fontWeight="800" fontFamily="'Inter', sans-serif">
            PLAYING FIELD
          </text>

          {/* ── Concourse Walkways ─── */}
          {WALKWAY_PATHS.map((path, i) => (
            <g key={`walk-${i}`}>
              <path d={path} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" strokeLinecap="round" />
              <path d={path} fill="none" stroke="rgba(99,102,241,0.08)" strokeWidth="1" strokeLinecap="round" strokeDasharray="2,8" />
            </g>
          ))}

          {/* ── Seating Sections ─── */}
          {STADIUM_SECTIONS.filter((s) => s.type === 'section').map((sec) => (
            <g key={sec.id}>
              <rect x={sec.x} y={sec.y} width={sec.w} height={sec.h} rx={4}
                fill="rgba(99,102,241,0.04)" stroke="rgba(99,102,241,0.1)" strokeWidth="0.5"
              />
              <text x={sec.x + sec.w / 2} y={sec.y + sec.h / 2 + 3} textAnchor="middle"
                fill="rgba(99,102,241,0.3)" fontSize="8" fontWeight="700" fontFamily="'JetBrains Mono', monospace"
              >
                {sec.label}
              </text>
            </g>
          ))}

          {/* ── Gates ─── */}
          {GATES.map((gate) => (
            <g key={gate.id}>
              <rect x={gate.x - 16} y={gate.y - 8} width={32} height={16} rx={4}
                fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8"
              />
              <text x={gate.x} y={gate.y + 3} textAnchor="middle"
                fill="rgba(255,255,255,0.3)" fontSize="6" fontWeight="800" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.05em"
              >
                {gate.label.toUpperCase()}
              </text>
            </g>
          ))}

          {/* ── Signal Heatmap Layer ─── */}
          {mapLayer === 'signal' && (
            <SignalHeatmap
              heatmapData={heatmapData}
              flowVectors={flowVectors}
              showSignalRings={showSignalRings}
              showFlowArrows={showFlowArrows}
            />
          )}

          {/* ── Graph Edges (Pathways) ─── */}
          {VENUE_GRAPH.edges.map((edge, idx) => {
            const from = VENUE_GRAPH.nodes.find((n) => n.id === edge.from);
            const to = VENUE_GRAPH.nodes.find((n) => n.id === edge.to);
            if (!from || !to) return null;
            const d = densities.find((den) => den.locationId === edge.to)?.density || 20;
            const color = getDensityColor(d);
            return (
              <g key={idx}>
                {/* Pathway background */}
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke="rgba(255,255,255,0.03)" strokeWidth="10" strokeLinecap="round"
                />
                {/* Active path */}
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={color} strokeWidth="2.5" strokeOpacity="0.4" strokeLinecap="round"
                  strokeDasharray="8,4"
                />
                {/* Moving indicator */}
                <circle r="3" fill={color} opacity="0.9">
                  <animateMotion path={`M${from.x},${from.y} L${to.x},${to.y}`} dur="3s" repeatCount="indefinite" />
                </circle>
                <circle r="6" fill={color} opacity="0.15">
                  <animateMotion path={`M${from.x},${from.y} L${to.x},${to.y}`} dur="3s" repeatCount="indefinite" />
                </circle>
              </g>
            );
          })}

          {/* ── Crowd Dots ─── */}
          {showUsers && users.slice(0, 500).map((u) => (
            <circle
              key={u.id}
              cx={u.x}
              cy={u.y}
              r={u.groupId ? 3 : 1.2}
              fill={u.groupId ? '#6366f1' : 'rgba(255,255,255,0.6)'}
              opacity={u.groupId ? 0.9 : 0.12}
            />
          ))}

          {/* ── Location Markers (Enhanced Info Cards) ─── */}
          {zoneCards.map((zone) => {
            const heat = getHeat(zone.id);
            const isHovered = hoveredZone === zone.id;
            const color = getDensityColor(zone.density);
            const deviceCount = heat?.deviceCount || zone.count;

            return (
              <g key={zone.id}
                onMouseEnter={() => setHoveredZone(zone.id)}
                onMouseLeave={() => setHoveredZone(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Zone coverage area */}
                <circle cx={zone.x} cy={zone.y} r={zone.radius}
                  fill={color} opacity={isHovered ? 0.12 : 0.06}
                />

                {/* Outer ring */}
                <circle cx={zone.x} cy={zone.y} r={20}
                  fill="rgba(11,15,25,0.85)" stroke={color} strokeWidth="2.5"
                  filter={isHovered ? 'drop-shadow(0 0 8px rgba(99,102,241,0.5))' : 'none'}
                />

                {/* Icon */}
                <text x={zone.x} y={zone.y + 4} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
                  {zone.type === 'FOOD' ? '🍔' : zone.type === 'RESTROOM' ? '🚻' : zone.type === 'SHOP' ? '🏪' : zone.type === 'PHOTO' ? '📸' : '🚪'}
                </text>

                {/* ── Floating Info Card ─── */}
                <g transform={`translate(${zone.x - 50}, ${zone.y + 26})`}>
                  {/* Card background */}
                  <rect x={0} y={0} width={100} height={isHovered ? 62 : 38} rx={8}
                    fill="rgba(11,15,25,0.92)" stroke={`${color}40`} strokeWidth="1"
                  />

                  {/* Zone name */}
                  <text x={50} y={13} textAnchor="middle"
                    fill="white" fontSize="8" fontWeight="800" fontFamily="'Inter', sans-serif"
                  >
                    {zone.name}
                  </text>

                  {/* Stats row */}
                  <g transform="translate(6, 20)">
                    {/* Wait time */}
                    <rect x={0} y={0} width={28} height={14} rx={3}
                      fill={`${zone.waitColor}15`}
                    />
                    <text x={14} y={10} textAnchor="middle"
                      fill={zone.waitColor} fontSize="7" fontWeight="800" fontFamily="'JetBrains Mono', monospace"
                    >
                      {zone.predictedWait}m
                    </text>

                    {/* Density bar */}
                    <rect x={32} y={3} width={36} height={8} rx={4}
                      fill="rgba(255,255,255,0.06)"
                    />
                    <rect x={32} y={3} width={Math.max(2, zone.densityPct * 0.36)} height={8} rx={4}
                      fill={color}
                    >
                      <animate attributeName="width"
                        to={Math.max(2, zone.densityPct * 0.36)}
                        dur="0.5s" fill="freeze"
                      />
                    </rect>

                    {/* Density % */}
                    <text x={72} y={10} textAnchor="start"
                      fill={color} fontSize="6.5" fontWeight="800" fontFamily="'JetBrains Mono', monospace"
                    >
                      {zone.densityPct}%
                    </text>
                  </g>

                  {/* Expanded info on hover */}
                  {isHovered && (
                    <g transform="translate(6, 38)">
                      {/* Device count */}
                      <text x={0} y={8} fill="rgba(255,255,255,0.5)" fontSize="6" fontWeight="700" fontFamily="'JetBrains Mono', monospace">
                        📡 {deviceCount} devices
                      </text>
                      {/* Trend */}
                      <text x={58} y={8} fill={zone.trend === 'rising' ? '#ef4444' : zone.trend === 'falling' ? '#10b981' : '#64748b'} fontSize="6" fontWeight="700" fontFamily="'JetBrains Mono', monospace">
                        {zone.trend === 'rising' ? '▲ Rising' : zone.trend === 'falling' ? '▼ Falling' : '─ Stable'}
                      </text>
                      {/* RSSI */}
                      {heat && (
                        <text x={0} y={19} fill="rgba(255,255,255,0.35)" fontSize="5.5" fontWeight="600" fontFamily="'JetBrains Mono', monospace">
                          RSSI {heat.avgRSSI} dBm • Cap {zone.capacity}
                        </text>
                      )}
                    </g>
                  )}
                </g>
              </g>
            );
          })}

          {/* ── Real Device (You) ─── */}
          {realDevice && (
            <g>
              {/* Accuracy ring */}
              <circle cx={realDevice.venueX} cy={realDevice.venueY} r={24}
                fill="none" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.15"
              >
                <animate attributeName="r" values="16;28;16" dur="3s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.3;0.05;0.3" dur="3s" repeatCount="indefinite" />
              </circle>
              {/* Ping effect */}
              <circle cx={realDevice.venueX} cy={realDevice.venueY} r={6}
                fill="none" stroke="#6366f1" strokeWidth="1.5" opacity="0"
              >
                <animate attributeName="r" values="6;30" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0" dur="2s" repeatCount="indefinite" />
              </circle>
              {/* Dot */}
              <circle cx={realDevice.venueX} cy={realDevice.venueY} r={5}
                fill="#6366f1" stroke="white" strokeWidth="2"
              />
              {/* Label card */}
              <g transform={`translate(${realDevice.venueX - 22}, ${realDevice.venueY - 24})`}>
                <rect x={0} y={0} width={44} height={14} rx={7}
                  fill="#6366f1" opacity="0.9"
                />
                <text x={22} y={10} textAnchor="middle"
                  fill="white" fontSize="6" fontWeight="900" fontFamily="'Inter', sans-serif" letterSpacing="0.06em"
                >
                  📍 YOU
                </text>
              </g>
            </g>
          )}

          {/* ── Group Centroid ─── */}
          {centroid && (
            <g>
              <circle cx={centroid.x} cy={centroid.y} r={10}
                fill="none" stroke="var(--secondary)" strokeWidth="1.5" strokeDasharray="3,3"
              >
                <animateTransform attributeName="transform" type="rotate"
                  from={`0 ${centroid.x} ${centroid.y}`} to={`360 ${centroid.x} ${centroid.y}`}
                  dur="6s" repeatCount="indefinite"
                />
              </circle>
              <circle cx={centroid.x} cy={centroid.y} r={3}
                fill="var(--secondary)" opacity="0.6"
              />
              <text x={centroid.x} y={centroid.y - 14} textAnchor="middle"
                fill="var(--secondary)" fontSize="5.5" fontWeight="800" fontFamily="'JetBrains Mono', monospace" opacity="0.7"
              >
                MEETUP ●
              </text>
            </g>
          )}

          {/* ── Map Scale + North Arrow ─── */}
          <g transform="translate(20, 470)">
            <line x1={0} y1={0} x2={50} y2={0} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <line x1={0} y1={-3} x2={0} y2={3} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <line x1={50} y1={-3} x2={50} y2={3} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <text x={25} y={-5} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="5" fontWeight="700" fontFamily="'JetBrains Mono', monospace">
              ~25m
            </text>
          </g>
          {/* North arrow */}
          <g transform="translate(770, 30)">
            <line x1={0} y1={12} x2={0} y2={-4} stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
            <polygon points="-4,0 0,-6 4,0" fill="rgba(255,255,255,0.25)" />
            <text x={0} y={22} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="6" fontWeight="800">N</text>
          </g>

          {/* ── Live timestamp ─── */}
          <text x={780} y={490} textAnchor="end"
            fill="rgba(255,255,255,0.12)" fontSize="6" fontWeight="600" fontFamily="'JetBrains Mono', monospace"
          >
            LIVE • {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </text>
        </svg>

        {/* ── Bottom Stats Overlay ─── */}
        <div style={{
          position: 'absolute', bottom: 8, left: 8, right: 8,
          display: 'flex', gap: 6, justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          {zoneCards.slice(0, 6).map((zone) => (
            <div key={zone.id} style={{
              padding: '4px 8px', borderRadius: 8,
              background: 'rgba(11,15,25,0.85)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '0.5rem', fontWeight: 700, pointerEvents: 'auto',
            }}>
              <span style={{ fontSize: '0.6rem' }}>
                {zone.type === 'FOOD' ? '🍔' : zone.type === 'RESTROOM' ? '🚻' : zone.type === 'SHOP' ? '🏪' : zone.type === 'PHOTO' ? '📸' : '🚪'}
              </span>
              <span style={{ color: getDensityColor(zone.density), fontFamily: "'JetBrains Mono', monospace" }}>
                {zone.predictedWait}m
              </span>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: zone.trend === 'rising' ? '#ef4444' : zone.trend === 'falling' ? '#10b981' : '#64748b',
              }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VenueMap;
