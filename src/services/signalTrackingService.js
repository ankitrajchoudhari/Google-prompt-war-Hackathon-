/**
 * Mobile Signal Triangulation Service
 * ────────────────────────────────────
 * Simulates real cell-tower triangulation logic for crowd density estimation.
 *
 * HOW IT WORKS (real-world logic applied to browser):
 *  1. Virtual "cell towers" are placed at each venue zone.
 *  2. Each tower broadcasts a signal that decays with distance (inverse-square law).
 *  3. Every device (simulated user) receives signal from multiple towers.
 *  4. Using RSSI (Received Signal Strength Indicator) from ≥3 towers we
 *     trilaterate the device's position.
 *  5. The number of devices whose trilaterated position falls inside a
 *     tower's coverage radius gives us real-time crowd density for that zone.
 *
 * Additionally, the service taps into the **Browser Geolocation API** so the
 * actual user's GPS / Wi-Fi position is fed into the system as a "real device".
 */

// ─── Constants ──────────────────────────────────
const SPEED_OF_LIGHT   = 3e8;          // m/s – used in FSPL formula
const FREQ_MHZ         = 2400;         // Wi-Fi 2.4 GHz for indoor model
const TX_POWER_DBM     = 20;           // Typical indoor AP transmit power
const PATH_LOSS_EXP    = 2.7;          // Indoor path-loss exponent (2–4)
const NOISE_FLOOR_DBM  = -90;          // Below this = no signal
const MIN_TOWERS       = 3;            // Minimum towers for trilateration

// ─── Virtual Cell Tower ─────────────────────────
class CellTower {
  constructor(id, x, y, radius, zoneType, name) {
    this.id       = id;
    this.x        = x;
    this.y        = y;
    this.radius   = radius;
    this.zoneType = zoneType;
    this.name     = name;
    this.txPower  = TX_POWER_DBM;
    // Devices currently "heard" by this tower
    this.connectedDevices = [];
    // Signal quality histogram (for heatmap)
    this.signalHistogram  = { excellent: 0, good: 0, fair: 0, poor: 0 };
  }

  /**
   * Free-Space Path Loss → RSSI at distance d (meters).
   * RSSI = TxPower – FSPL – fading
   */
  calculateRSSI(distPixels) {
    // Convert pixels to meters (1 px ≈ 0.5 m for an 800 px wide stadium ~400 m)
    const distMeters = Math.max(distPixels * 0.5, 0.1);
    const fspl = TX_POWER_DBM
      - 10 * PATH_LOSS_EXP * Math.log10(distMeters)
      - 20 * Math.log10(FREQ_MHZ)
      + 27.55;
    // Add Rayleigh fading noise (±3 dB)
    const fading = (Math.random() - 0.5) * 6;
    return Math.max(NOISE_FLOOR_DBM, fspl + fading);
  }

  /**
   * Classify RSSI into quality bucket.
   */
  static classifySignal(rssi) {
    if (rssi > -50) return 'excellent';
    if (rssi > -65) return 'good';
    if (rssi > -75) return 'fair';
    return 'poor';
  }
}

// ─── Trilateration Engine ───────────────────────
/**
 * Given RSSI readings from ≥3 towers, estimate device position.
 * Uses weighted-centroid (fast, good enough for dense indoor).
 */
function trilateratePosition(towerReadings) {
  if (towerReadings.length < MIN_TOWERS) return null;

  // Sort by RSSI descending (strongest first) and keep best N
  const best = [...towerReadings]
    .sort((a, b) => b.rssi - a.rssi)
    .slice(0, 5);

  // Convert RSSI to linear weight: w = 10^(rssi/10)
  let totalWeight = 0;
  let wx = 0;
  let wy = 0;

  for (const reading of best) {
    const w = Math.pow(10, reading.rssi / 20); // Higher RSSI → bigger weight
    wx += reading.tower.x * w;
    wy += reading.tower.y * w;
    totalWeight += w;
  }

  if (totalWeight === 0) return null;
  return { x: wx / totalWeight, y: wy / totalWeight };
}

// ─── Signal Tracking Service (main export) ──────
export class SignalTrackingService {
  constructor(venueLocations) {
    // Create a virtual cell tower for every venue zone
    this.towers = venueLocations.map(
      (loc) => new CellTower(loc.id, loc.x, loc.y, loc.radius, loc.type, loc.name)
    );
    // Real device (browser user) location
    this.realDevicePosition = null;
    this.geoWatchId          = null;
    this.isTracking          = false;
    // Signal snapshots for analytics
    this.snapshots           = [];
    this.maxSnapshots        = 60;        // Keep last 60 snapshots (≈1 min at 1 Hz)
    // Callbacks
    this._onSignalUpdate     = null;
  }

  // ─── Start real GPS/Wi-Fi tracking ────────────
  startRealTracking(onUpdate) {
    this._onSignalUpdate = onUpdate;
    this.isTracking = true;

    if ('geolocation' in navigator) {
      this.geoWatchId = navigator.geolocation.watchPosition(
        (pos) => {
          this.realDevicePosition = {
            lat:       pos.coords.latitude,
            lng:       pos.coords.longitude,
            accuracy:  pos.coords.accuracy,           // metres
            speed:     pos.coords.speed,               // m/s or null
            heading:   pos.coords.heading,             // degrees or null
            timestamp: pos.timestamp,
            // Map GPS to venue coordinates (demo: center the user in the venue)
            venueX:    this._gpsToVenueX(pos.coords.longitude),
            venueY:    this._gpsToVenueY(pos.coords.latitude),
          };
        },
        (err) => {
          console.warn('[SignalTracking] Geolocation denied or unavailable:', err.message);
          // Fall back to simulated position
          this.realDevicePosition = this._simulateDevicePosition();
        },
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 }
      );
    } else {
      this.realDevicePosition = this._simulateDevicePosition();
    }
  }

  stopRealTracking() {
    this.isTracking = false;
    if (this.geoWatchId !== null) {
      navigator.geolocation.clearWatch(this.geoWatchId);
      this.geoWatchId = null;
    }
  }

  // ─── Core: process all user positions through towers ─
  /**
   * Takes an array of user positions [{id, x, y, ...}]
   * Returns enriched signal data per zone / tower.
   */
  processSignals(userPositions) {
    const timestamp = Date.now();

    // Reset tower state
    for (const tower of this.towers) {
      tower.connectedDevices = [];
      tower.signalHistogram  = { excellent: 0, good: 0, fair: 0, poor: 0 };
    }

    // For each user, compute RSSI to every tower
    const deviceSignalMaps = userPositions.map((user) => {
      const readings = this.towers.map((tower) => {
        const dx   = user.x - tower.x;
        const dy   = user.y - tower.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const rssi = tower.calculateRSSI(dist);
        return { tower, rssi, dist };
      });

      // Trilaterate this device
      const estimatedPos = trilateratePosition(readings);

      // Determine which tower(s) "own" this device (strongest signal)
      const sorted = [...readings].sort((a, b) => b.rssi - a.rssi);
      const primaryTower = sorted[0].tower;

      // Register device on primary tower
      primaryTower.connectedDevices.push({
        id:           user.id,
        rssi:         sorted[0].rssi,
        quality:      CellTower.classifySignal(sorted[0].rssi),
        estimatedPos,
        actualPos:    { x: user.x, y: user.y },
        groupId:      user.groupId || null,
      });

      // Update histogram
      const quality = CellTower.classifySignal(sorted[0].rssi);
      primaryTower.signalHistogram[quality]++;

      return {
        userId:      user.id,
        primaryTower: primaryTower.id,
        rssi:         sorted[0].rssi,
        quality,
        estimatedPos,
        readings:     readings.map((r) => ({
          towerId: r.tower.id,
          rssi:    Math.round(r.rssi),
          dist:    Math.round(r.dist),
        })),
      };
    });

    // Build per-zone signal intelligence
    const zoneSignalData = this.towers.map((tower) => {
      const deviceCount  = tower.connectedDevices.length;
      const avgRSSI      = deviceCount > 0
        ? tower.connectedDevices.reduce((s, d) => s + d.rssi, 0) / deviceCount
        : NOISE_FLOOR_DBM;

      // Signal-based density: ratio of connected devices to what the zone can hold
      // We estimate capacity from signal coverage (larger radius → more capacity)
      const estimatedCapacity = Math.PI * tower.radius * tower.radius * 0.02;
      const signalDensity     = Math.min(100, (deviceCount / Math.max(1, estimatedCapacity)) * 100);

      // Congestion index: combines density + signal quality degradation
      const poorRatio     = tower.signalHistogram.poor / Math.max(1, deviceCount);
      const congestionIdx = Math.min(100, signalDensity * (1 + poorRatio * 0.5));

      return {
        towerId:          tower.id,
        towerName:        tower.name,
        x:                tower.x,
        y:                tower.y,
        radius:           tower.radius,
        zoneType:         tower.zoneType,
        deviceCount,
        avgRSSI:          Math.round(avgRSSI),
        signalDensity:    Math.round(signalDensity),
        congestionIndex:  Math.round(congestionIdx),
        histogram:        { ...tower.signalHistogram },
        // Signal strength ring radii for heatmap rendering
        signalRings: [
          { radius: tower.radius * 0.4, quality: 'excellent', color: '#10b981' },
          { radius: tower.radius * 0.7, quality: 'good',      color: '#22d3ee' },
          { radius: tower.radius * 1.0, quality: 'fair',      color: '#f59e0b' },
          { radius: tower.radius * 1.4, quality: 'poor',      color: '#ef4444' },
        ],
      };
    });

    // Snapshot for time-series analytics
    const snapshot = {
      timestamp,
      totalDevices:   userPositions.length,
      zones:          zoneSignalData.map((z) => ({
        id: z.towerId, density: z.signalDensity, congestion: z.congestionIndex,
      })),
      realDevice:     this.realDevicePosition,
    };
    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) this.snapshots.shift();

    // Fire callback
    if (this._onSignalUpdate) {
      this._onSignalUpdate({ zoneSignalData, deviceSignalMaps, snapshot });
    }

    return { zoneSignalData, deviceSignalMaps, snapshot };
  }

  // ─── Helpers ──────────────────────────────────
  /**
   * Get trend for a zone over the last N snapshots.
   * Returns: 'rising' | 'falling' | 'stable'
   */
  getZoneTrend(zoneId, windowSize = 10) {
    const recentSnapshots = this.snapshots.slice(-windowSize);
    if (recentSnapshots.length < 3) return 'stable';

    const densities = recentSnapshots
      .map((s) => s.zones.find((z) => z.id === zoneId)?.density || 0);

    const first = densities.slice(0, Math.floor(densities.length / 2));
    const last  = densities.slice(Math.floor(densities.length / 2));

    const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
    const avgLast  = last.reduce((a, b) => a + b, 0) / last.length;

    if (avgLast - avgFirst > 8) return 'rising';
    if (avgFirst - avgLast > 8) return 'falling';
    return 'stable';
  }

  /**
   * Predict density N seconds into the future using linear extrapolation
   * of signal snapshots.
   */
  predictDensity(zoneId, secondsAhead = 30) {
    const window = this.snapshots.slice(-20);
    if (window.length < 5) return null;

    const points = window.map((s, i) => ({
      t: i,
      d: s.zones.find((z) => z.id === zoneId)?.density || 0,
    }));

    // Simple linear regression
    const n    = points.length;
    const sumX = points.reduce((a, p) => a + p.t, 0);
    const sumY = points.reduce((a, p) => a + p.d, 0);
    const sumXY = points.reduce((a, p) => a + p.t * p.d, 0);
    const sumX2 = points.reduce((a, p) => a + p.t * p.t, 0);

    const slope     = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Each snapshot ≈ 100ms apart, so secondsAhead = secondsAhead * 10 ticks
    const futureTick  = n + (secondsAhead * 10);
    const predicted   = Math.max(0, Math.min(100, slope * futureTick + intercept));

    return Math.round(predicted);
  }

  // ─── GPS ↔ Venue coordinate mapping ───────────
  // For demo: map longitude range to 0–800, latitude range to 0–500
  _gpsToVenueX(lng) {
    // Default center: use modulo to get a position within venue
    return ((lng * 10000) % 800 + 800) % 800;
  }
  _gpsToVenueY(lat) {
    return ((lat * 10000) % 500 + 500) % 500;
  }
  _simulateDevicePosition() {
    return {
      lat: 37.7749 + (Math.random() - 0.5) * 0.001,
      lng: -122.4194 + (Math.random() - 0.5) * 0.001,
      accuracy: 15,
      speed: null,
      heading: null,
      timestamp: Date.now(),
      venueX: 200 + Math.random() * 400,
      venueY: 100 + Math.random() * 300,
    };
  }
}

// ─── Utility: format RSSI for display ───────────
export const formatRSSI = (rssi) => {
  if (rssi > -50) return { label: 'Excellent', color: '#10b981', bars: 4 };
  if (rssi > -65) return { label: 'Good',      color: '#22d3ee', bars: 3 };
  if (rssi > -75) return { label: 'Fair',       color: '#f59e0b', bars: 2 };
  return { label: 'Weak', color: '#ef4444', bars: 1 };
};

export const formatDeviceCount = (count) => {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
};
