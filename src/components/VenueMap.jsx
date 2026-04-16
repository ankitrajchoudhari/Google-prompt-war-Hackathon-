import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Map as MapIcon, Layers, Radio, Eye, Search, Box } from 'lucide-react';
import SignalHeatmap from './SignalHeatmap';

// ─── Stadium Structure ─────────────────────────────
const STADIUM_SECTIONS = [
  { type: 'bowl', cx: 400, cy: 250, rx: 340, ry: 200 },
  { type: 'field', cx: 400, cy: 250, rx: 180, ry: 100 },
  { type: 'concourse', cx: 400, cy: 250, rx: 370, ry: 225 },
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

const GATES = [
  { id: 'G-N', label: 'Gate N', x: 400, y: 18 },
  { id: 'G-E', label: 'Gate E', x: 758, y: 250 },
  { id: 'G-S', label: 'Gate S', x: 400, y: 482 },
  { id: 'G-W', label: 'Gate W', x: 42, y: 250 },
];

const VenueMap = ({ 
  VENUE_GRAPH, densities, users, locations, getDensityColor, centroid, 
  heatmapData, flowVectors, realDevice, evacuationRoutes, isEmergency 
}) => {
  const [showSignalRings, setShowSignalRings] = useState(true);
  const [showFlowArrows, setShowFlowArrows] = useState(true);
  const [mapLayer, setMapLayer] = useState('signal');
  const [hoveredZone, setHoveredZone] = useState(null);
  const [showUsers, setShowUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [is3D, setIs3D] = useState(false);
  
  const canvasRef = useRef(null);

  // ─── Optimization: Canvas Rendering for Users ──────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showUsers) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    let animationFrameId;

    const renderLoop = () => {
      ctx.clearRect(0, 0, width, height);

      // Batch draw users
      ctx.fillStyle = isEmergency ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)';
      users.forEach(u => {
        ctx.beginPath();
        ctx.arc(u.x, u.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Highlight group members
      ctx.fillStyle = '#6366f1';
      users.filter(u => u.groupId).forEach(u => {
        ctx.beginPath();
        ctx.arc(u.x, u.y, 3, 0, Math.PI * 2);
        ctx.fill();
        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#6366f1';
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => cancelAnimationFrame(animationFrameId);
  }, [users, showUsers, isEmergency]);

  const zoneCards = useMemo(() => {
    if (!densities || densities.length === 0) return [];
    return densities.map((d) => {
      const waitColor = d.predictedWait < 5 ? '#10b981' : d.predictedWait < 12 ? '#f59e0b' : '#ef4444';
      const densityPct = Math.round(d.density);
      const trend = densityPct > 60 ? 'rising' : densityPct < 30 ? 'falling' : 'stable';
      return { ...d, waitColor, densityPct, trend };
    });
  }, [densities]);

  const filteredZones = useMemo(() => {
    if (!searchQuery) return zoneCards;
    return zoneCards.filter(z => z.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [zoneCards, searchQuery]);

  const exits = locations?.filter(l => l.type === 'GATE') || [];
  const getHeat = (zoneId) => heatmapData?.find((h) => h.zoneId === zoneId);

  return (
    <div className={`panel-center ${isEmergency ? 'emergency-glow' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="panel-section-title" style={{ margin: 0, color: isEmergency ? '#ef4444' : 'inherit' }}>
            <MapIcon size={12} /> {isEmergency ? '⚠️ EVACUATION ROUTER' : 'Live Venue Map'}
            <span style={{ fontSize: '0.45rem', color: isEmergency ? '#ef4444' : 'var(--text-muted)', marginLeft: 8, fontWeight: 700 }}>
              {isEmergency ? 'SAFETY GUIDANCE ACTIVE' : 'CROWD INTELLIGENCE'}
            </span>
          </div>

          {!isEmergency && (
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: 8, 
              background: 'rgba(255,255,255,0.03)', padding: '4px 12px', 
              borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <Search size={10} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="Search venue..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  background: 'none', border: 'none', outline: 'none', 
                  color: 'white', fontSize: '0.6rem', width: 80, fontWeight: 600
                }}
              />
            </div>
          )}
        </div>

        {!isEmergency && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => setMapLayer(mapLayer === 'signal' ? 'standard' : 'signal')}
              style={{ background: mapLayer === 'signal' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 6, padding: '3px 6px', color: 'white', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Radio size={9} /><span style={{ fontSize: '0.45rem', fontWeight: 700 }}>Signal</span>
            </button>
            <button onClick={() => setShowFlowArrows(!showFlowArrows)}
              style={{ background: showFlowArrows ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 6, padding: '3px 6px', color: 'white', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Layers size={9} /><span style={{ fontSize: '0.45rem', fontWeight: 700 }}>Flow</span>
            </button>
            <button onClick={() => setShowUsers(!showUsers)}
              style={{ background: showUsers ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 6, padding: '3px 6px', color: 'white', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Eye size={9} /><span style={{ fontSize: '0.45rem', fontWeight: 700 }}>Crowd</span>
            </button>
            <button onClick={() => setIs3D(!is3D)}
              style={{ background: is3D ? 'rgba(236,72,153,0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 6, padding: '3px 6px', color: 'white', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box size={9} /><span style={{ fontSize: '0.45rem', fontWeight: 700 }}>3D View</span>
            </button>
          </div>
        )}
      </div>

      <div className="map-viewport" style={{ 
        position: 'relative',
        perspective: '1200px',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          transform: is3D ? 'rotateX(55deg) rotateZ(-30deg) translateZ(-50px) scale(0.9)' : 'none',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
        {/* ─── LAYER 1: Background Canvas ─── */}
        <canvas 
          ref={canvasRef}
          width={800}
          height={500}
          style={{ 
            position: 'absolute', inset: 0, width: '100%', height: '100%', 
            pointerEvents: 'none', zIndex: 1,
            filter: isEmergency ? 'grayscale(1) contrast(0.5)' : 'none'
          }}
        />

        {/* ─── LAYER 2: SVG Overlays ─── */}
        <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" style={{ 
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          zIndex: 2, pointerEvents: 'auto',
          filter: isEmergency ? 'grayscale(0.6) brightness(0.4)' : 'none', 
          transition: 'filter 0.5s ease' 
        }}>
          <defs>
            <radialGradient id="field-glow" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.06" /><stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="40" y2="0" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
              <line x1="0" y1="0" x2="0" y2="40" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
            </pattern>
            <marker id="arrow-green" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
            </marker>
          </defs>

          <rect width="800" height="500" fill="url(#grid-pattern)" />
          
          <ellipse cx={400} cy={250} rx={370} ry={225} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" strokeDasharray="6,3" />
          <ellipse cx={400} cy={250} rx={180} ry={100} fill="url(#field-glow)" stroke="rgba(16,185,129,0.1)" strokeWidth="1" />
          
          {STADIUM_SECTIONS.filter(s => s.type === 'section').map(sec => (
            <rect key={sec.id} x={sec.x} y={sec.y} width={sec.w} height={sec.h} rx={4} fill="rgba(99,102,241,0.02)" stroke="rgba(99,102,241,0.05)" />
          ))}

          {!isEmergency && mapLayer === 'signal' && heatmapData && (
            <SignalHeatmap heatmapData={heatmapData} flowVectors={flowVectors} showSignalRings={showSignalRings} showFlowArrows={showFlowArrows} />
          )}

          {isEmergency && evacuationRoutes && evacuationRoutes.map((route, i) => {
            const loc = locations?.find(l => l.id === route.zoneId);
            if (!loc) return null;
            return (
              <g key={`evac-${i}`}>
                <line x1={loc.x} y1={loc.y} x2={loc.x + route.vector.x * 60} y2={loc.y + route.vector.y * 60} stroke="#10b981" strokeWidth="4" markerEnd="url(#arrow-green)" strokeDasharray="8,4">
                  <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="1s" repeatCount="indefinite" />
                </line>
              </g>
            );
          })}

          {filteredZones.map(zone => {
            const isHovered = hoveredZone === zone.id;
            const isSearched = searchQuery && zone.name.toLowerCase().includes(searchQuery.toLowerCase());
            const color = getDensityColor(zone.density);
            
            return (
              <g key={zone.id} onMouseEnter={() => setHoveredZone(zone.id)} onMouseLeave={() => setHoveredZone(null)}>
                {/* Search pulse */}
                {isSearched && (
                  <circle cx={zone.x} cy={zone.y} r={35} fill="none" stroke="var(--primary)" strokeWidth="2">
                    <animate attributeName="r" values="25;45" dur="1s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;0" dur="1s" repeatCount="indefinite" />
                  </circle>
                )}
                
                <circle cx={zone.x} cy={zone.y} r={20} fill="rgba(11,15,25,0.9)" stroke={isSearched ? 'var(--primary)' : color} strokeWidth={isSearched ? 3 : 2} style={{ transition: 'all 0.3s ease' }} />
                <text x={zone.x} y={zone.y + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                  {zone.type === 'FOOD' ? '🍔' : zone.type === 'RESTROOM' ? '🚻' : '🏪'}
                </text>
                {(isHovered || isSearched) && (
                  <g transform={`translate(${zone.x - 50}, ${zone.y + 25})`}>
                    <rect width="100" height="40" rx={8} fill="rgba(11,15,25,0.95)" stroke={isSearched ? 'var(--primary)' : color} strokeWidth="1" />
                    <text x="50" y="15" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">{zone.name}</text>
                    <text x="50" y="30" textAnchor="middle" fill={color} fontSize="7">{zone.densityPct}% Full • {zone.predictedWait}m</text>
                  </g>
                )}
              </g>
            );
          })}

          {isEmergency && evacuationRoutes?.filter(r => r.isDanger).map((route, i) => {
            const loc = locations?.find(l => l.id === route.zoneId);
            if (!loc) return null;
            return <circle key={i} cx={loc.x} cy={loc.y} r={50} fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" strokeWidth="2"><animate attributeName="opacity" values="0.2;0.5;0.2" dur="1s" repeatCount="indefinite" /></circle>;
          })}

          {isEmergency && exits.map(gate => (
            <g key={gate.id}>
              <circle cx={gate.x} cy={gate.y} r={30} fill="none" stroke="#10b981" strokeWidth="3"><animate attributeName="r" values="30;45" dur="1.5s" repeatCount="indefinite" /><animate attributeName="opacity" values="1;0" dur="1.5s" repeatCount="indefinite" /></circle>
              <text x={gate.x} y={gate.y - 45} textAnchor="middle" fill="#10b981" fontSize="12" fontWeight="900">SAFE EXIT</text>
            </g>
          ))}

          {/* Real user indicator */}
          {realDevice && (
            <g>
              <circle cx={realDevice.venueX} cy={realDevice.venueY} r={6} fill="var(--primary)" stroke="white" strokeWidth="2" />
              <text x={realDevice.venueX} y={realDevice.venueY - 12} textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">YOU</text>
            </g>
          )}
        </svg>
        </div>

        {isEmergency && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none', zIndex: 10 }}>
            <h2 style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 900 }}>EMERGENCY EVACUATION</h2>
            <p style={{ color: 'white', fontSize: '0.8rem' }}>FOLLOW GREEN ARROWS TO SAFETY</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueMap;
