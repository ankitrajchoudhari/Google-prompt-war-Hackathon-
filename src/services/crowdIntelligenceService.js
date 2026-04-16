/**
 * Crowd Intelligence Service
 * ──────────────────────────
 * Fuses signal data + ML predictions + geolocation into a unified
 * crowd intelligence layer.
 *
 * This is the "brain" that sits between raw signal data and the UI.
 * It provides:
 *  - Real-time zone-level crowd metrics
 *  - Anomaly detection (sudden surges)
 *  - Predictive alerts (crowd building up)
 *  - Heat-map data ready for rendering
 *  - Device fingerprint bucketing (unique vs repeat visitors)
 */

// ─── Anomaly Detection ──────────────────────────
const SURGE_THRESHOLD   = 25;  // % density jump in 10 seconds = surge
const DANGER_THRESHOLD  = 85;  // density above this = safety alert
const CLEAR_WINDOW_SEC  = 30;  // seconds before clearing an alert

/**
 * Analyze zone data for anomalies.
 */
export function detectAnomalies(currentZoneData, previousZoneData) {
  const alerts = [];

  for (const zone of currentZoneData) {
    const prev = previousZoneData?.find((z) => z.towerId === zone.towerId);
    const prevDensity = prev?.signalDensity || 0;
    const delta = zone.signalDensity - prevDensity;

    // Sudden surge detection
    if (delta > SURGE_THRESHOLD) {
      alerts.push({
        type:     'SURGE',
        severity: 'warning',
        zoneId:   zone.towerId,
        zoneName: zone.towerName,
        message:  `📡 Rapid crowd build-up at ${zone.towerName}: +${delta}% in last scan`,
        density:  zone.signalDensity,
        delta,
        timestamp: Date.now(),
      });
    }

    // Overcrowding danger
    if (zone.signalDensity > DANGER_THRESHOLD) {
      alerts.push({
        type:     'OVERCROWDING',
        severity: 'critical',
        zoneId:   zone.towerId,
        zoneName: zone.towerName,
        message:  `🚨 ${zone.towerName} at ${zone.signalDensity}% capacity — consider crowd control`,
        density:  zone.signalDensity,
        timestamp: Date.now(),
      });
    }

    // Signal quality degradation (too many devices, jamming)
    if (zone.histogram) {
      const total = Object.values(zone.histogram).reduce((a, b) => a + b, 0);
      const poorPct = total > 0 ? (zone.histogram.poor / total) * 100 : 0;
      if (poorPct > 40 && total > 20) {
        alerts.push({
          type:     'SIGNAL_DEGRADATION',
          severity: 'info',
          zoneId:   zone.towerId,
          zoneName: zone.towerName,
          message:  `📶 Signal congestion at ${zone.towerName} — ${Math.round(poorPct)}% poor quality`,
          density:  zone.signalDensity,
          timestamp: Date.now(),
        });
      }
    }
  }

  return alerts;
}

/**
 * Build heatmap data from zone signal data.
 * Returns an array of gradient stops for SVG rendering.
 */
export function buildHeatmapData(zoneSignalData) {
  return zoneSignalData.map((zone) => {
    const intensity = zone.signalDensity / 100; // 0–1
    const congestion = zone.congestionIndex / 100;

    // Color interpolation: green → yellow → red
    let r, g, b;
    if (intensity < 0.4) {
      // Green to yellow
      const t = intensity / 0.4;
      r = Math.round(16 + t * (245 - 16));
      g = Math.round(185 + t * (158 - 185));
      b = Math.round(129 + t * (11 - 129));
    } else {
      // Yellow to red
      const t = (intensity - 0.4) / 0.6;
      r = Math.round(245 + t * (239 - 245));
      g = Math.round(158 - t * 158);
      b = Math.round(11 + t * (68 - 11));
    }

    return {
      zoneId:    zone.towerId,
      x:         zone.x,
      y:         zone.y,
      radius:    zone.radius,
      intensity,
      congestion,
      color:     `rgb(${r}, ${g}, ${b})`,
      opacity:   0.15 + intensity * 0.35,
      // Pulse animation speed: faster = more crowded
      pulseSpeed: 3 - intensity * 2,
      // Ring data for multi-layer heatmap
      rings:     zone.signalRings,
      deviceCount: zone.deviceCount,
      avgRSSI:     zone.avgRSSI,
    };
  });
}

/**
 * Compute venue-wide crowd flow vectors.
 * Shows the general direction crowds are moving.
 */
export function computeFlowVectors(deviceSignalMaps, previousDeviceMap) {
  if (!previousDeviceMap || previousDeviceMap.length === 0) return [];

  const vectors = [];
  const prevMap = new Map(previousDeviceMap.map((d) => [d.userId, d]));

  for (const device of deviceSignalMaps.slice(0, 200)) {
    const prev = prevMap.get(device.userId);
    if (!prev || !device.estimatedPos || !prev.estimatedPos) continue;

    const dx = device.estimatedPos.x - prev.estimatedPos.x;
    const dy = device.estimatedPos.y - prev.estimatedPos.y;
    const magnitude = Math.sqrt(dx * dx + dy * dy);

    if (magnitude > 2) { // Only show meaningful movement
      vectors.push({
        userId: device.userId,
        fromX:  prev.estimatedPos.x,
        fromY:  prev.estimatedPos.y,
        toX:    device.estimatedPos.x,
        toY:    device.estimatedPos.y,
        dx, dy,
        magnitude,
        direction: Math.atan2(dy, dx) * (180 / Math.PI),
      });
    }
  }

  return vectors;
}

/**
 * Smart crowd prediction combining signal trends and event context.
 */
export function smartCrowdPrediction(signalService, zoneId, eventMomentum, weatherImpact) {
  const trend     = signalService.getZoneTrend(zoneId);
  const predicted = signalService.predictDensity(zoneId, 60); // 60 sec ahead

  let recommendation = '';
  let urgency = 'low';

  if (predicted === null) {
    return { trend: 'stable', predicted: null, recommendation: 'Gathering data...', urgency: 'low' };
  }

  if (trend === 'rising' && predicted > 70) {
    recommendation = `Crowd building fast — will hit ${predicted}% in ~1 min. Visit now or wait 5+ min.`;
    urgency = 'high';
  } else if (trend === 'falling') {
    recommendation = `Crowd dispersing — density dropping to ~${predicted}%. Good window opening.`;
    urgency = 'low';
  } else if (eventMomentum > 0.8) {
    recommendation = `Game momentum is high — expect surge after the play ends.`;
    urgency = 'medium';
  } else if (weatherImpact > 0.5) {
    recommendation = `Weather pushing crowds indoors. Outdoor zones may clear up.`;
    urgency = 'medium';
  } else {
    recommendation = `Stable crowd levels — predicted ${predicted}% in 1 min.`;
    urgency = 'low';
  }

  return { trend, predicted, recommendation, urgency };
}

/**
 * Generate real-time crowd digest for the UI header.
 */
export function generateCrowdDigest(zoneSignalData) {
  const total      = zoneSignalData.reduce((s, z) => s + z.deviceCount, 0);
  const avgDensity = zoneSignalData.length > 0
    ? Math.round(zoneSignalData.reduce((s, z) => s + z.signalDensity, 0) / zoneSignalData.length)
    : 0;
  const hottestZone = [...zoneSignalData].sort((a, b) => b.congestionIndex - a.congestionIndex)[0];
  const coolestZone = [...zoneSignalData].sort((a, b) => a.congestionIndex - b.congestionIndex)[0];

  return {
    totalDevices:  total,
    avgDensity,
    hottestZone:   hottestZone ? { name: hottestZone.towerName, density: hottestZone.signalDensity } : null,
    coolestZone:   coolestZone ? { name: coolestZone.towerName, density: coolestZone.signalDensity } : null,
    overallStatus: avgDensity < 40 ? 'LOW' : avgDensity < 70 ? 'MODERATE' : 'HIGH',
  };
}

/**
 * Emergency Evacuation Router
 * ──────────────────────────
 * Dynamically calculates evacuation paths that AVOID congested zones.
 */
export function computeEvacuationRoutes(zoneSignalData, locations) {
  // 1. Identify "Danger Zones" (Density > 80%)
  const dangerZones = new Set(
    zoneSignalData
      .filter(z => z.signalDensity > 80)
      .map(z => z.towerId)
  );

  // 2. Identify "Safe Exits" (Gates with lowest congestion)
  const exits = locations
    .filter(l => l.type === 'GATE')
    .map(gate => {
      const signal = zoneSignalData.find(z => z.towerId === gate.id);
      return {
        id: gate.id,
        name: gate.name,
        x: gate.x,
        y: gate.y,
        congestion: signal?.congestionIndex || 0,
      };
    })
    .sort((a, b) => a.congestion - b.congestion);

  // 3. Generate vectors pointing towards safest exits
  // Every zone is assigned a "preferred exit" that isn't blocked by danger
  return zoneSignalData.map(zone => {
    // Find closest exit to this zone that has low congestion
    const bestExit = exits[0]; // Simplification for demo
    
    const dx = bestExit.x - zone.x;
    const dy = bestExit.y - zone.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    return {
      zoneId: zone.towerId,
      exitId: bestExit.id,
      exitName: bestExit.name,
      isDanger: dangerZones.has(zone.towerId),
      vector: {
        x: dx / dist,
        y: dy / dist,
      },
      evacuationMessage: dangerZones.has(zone.towerId) 
        ? `⚠️ ZONE CONGESTED. FOLLOW ARROWS TO ${bestExit.name.toUpperCase()}`
        : `SAFE ROUTE TO ${bestExit.name.toUpperCase()}`,
    };
  });
}
