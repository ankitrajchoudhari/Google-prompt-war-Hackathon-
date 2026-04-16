import React, { useMemo } from 'react';

/**
 * SignalHeatmap – renders multi-layer signal strength visualization
 * on top of the venue SVG map.
 */
const SignalHeatmap = ({ heatmapData, flowVectors, showSignalRings, showFlowArrows }) => {
  // Memoize gradient definitions
  const gradients = useMemo(() => {
    if (!heatmapData) return [];
    return heatmapData.map((zone) => ({
      id: `signal-gradient-${zone.zoneId}`,
      color: zone.color,
      opacity: zone.opacity,
    }));
  }, [heatmapData]);

  if (!heatmapData || heatmapData.length === 0) return null;

  return (
    <g className="signal-heatmap-layer">
      {/* Radial gradient definitions */}
      <defs>
        {gradients.map((g) => (
          <radialGradient key={g.id} id={g.id}>
            <stop offset="0%" stopColor={g.color} stopOpacity={g.opacity * 1.2} />
            <stop offset="40%" stopColor={g.color} stopOpacity={g.opacity * 0.8} />
            <stop offset="70%" stopColor={g.color} stopOpacity={g.opacity * 0.4} />
            <stop offset="100%" stopColor={g.color} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>

      {/* Signal coverage rings */}
      {showSignalRings && heatmapData.map((zone) => (
        <g key={`rings-${zone.zoneId}`}>
          {zone.rings.slice().reverse().map((ring, i) => (
            <circle
              key={`ring-${zone.zoneId}-${i}`}
              cx={zone.x}
              cy={zone.y}
              r={ring.radius}
              fill="none"
              stroke={ring.color}
              strokeWidth="1"
              strokeOpacity={0.2 + zone.intensity * 0.3}
              strokeDasharray="4,6"
            >
              <animate
                attributeName="r"
                values={`${ring.radius * 0.95};${ring.radius * 1.05};${ring.radius * 0.95}`}
                dur={`${zone.pulseSpeed + i * 0.5}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>
      ))}

      {/* Heatmap blobs */}
      {heatmapData.map((zone) => (
        <g key={`heat-${zone.zoneId}`}>
          {/* Outer glow */}
          <circle
            cx={zone.x}
            cy={zone.y}
            r={zone.radius * (1.2 + zone.intensity * 0.6)}
            fill={`url(#signal-gradient-${zone.zoneId})`}
          >
            <animate
              attributeName="r"
              values={`${zone.radius * (1.1 + zone.intensity * 0.5)};${zone.radius * (1.3 + zone.intensity * 0.7)};${zone.radius * (1.1 + zone.intensity * 0.5)}`}
              dur={`${zone.pulseSpeed}s`}
              repeatCount="indefinite"
            />
          </circle>

          {/* Inner core */}
          <circle
            cx={zone.x}
            cy={zone.y}
            r={zone.radius * 0.3 * (0.5 + zone.intensity)}
            fill={zone.color}
            opacity={0.1 + zone.intensity * 0.2}
          />

          {/* Signal strength indicator */}
          <g transform={`translate(${zone.x + zone.radius + 5}, ${zone.y - 8})`}>
            {/* RSSI bars */}
            {[0, 1, 2, 3].map((bar) => {
              const barHeight = 4 + bar * 2;
              const isActive = zone.avgRSSI > [-90, -75, -65, -50][bar];
              return (
                <rect
                  key={bar}
                  x={bar * 4}
                  y={16 - barHeight}
                  width="3"
                  height={barHeight}
                  rx="1"
                  fill={isActive ? zone.color : 'rgba(255,255,255,0.1)'}
                  opacity={isActive ? 0.9 : 0.3}
                />
              );
            })}
            {/* Device count */}
            <text
              x="0"
              y="24"
              fill="rgba(255,255,255,0.7)"
              fontSize="7"
              fontWeight="700"
              fontFamily="'JetBrains Mono', monospace"
            >
              {zone.deviceCount}
            </text>
          </g>
        </g>
      ))}

      {/* Flow arrows */}
      {showFlowArrows && flowVectors && flowVectors.slice(0, 50).map((v, i) => (
        <g key={`flow-${i}`} opacity="0.3">
          <line
            x1={v.fromX}
            y1={v.fromY}
            x2={v.toX}
            y2={v.toY}
            stroke="#6366f1"
            strokeWidth="1.5"
            markerEnd="url(#arrowhead)"
          />
        </g>
      ))}

      {/* Arrowhead marker definition */}
      {showFlowArrows && (
        <defs>
          <marker
            id="arrowhead"
            markerWidth="6"
            markerHeight="4"
            refX="6"
            refY="2"
            orient="auto"
          >
            <polygon points="0 0, 6 2, 0 4" fill="#6366f1" opacity="0.5" />
          </marker>
        </defs>
      )}
    </g>
  );
};

export default SignalHeatmap;
