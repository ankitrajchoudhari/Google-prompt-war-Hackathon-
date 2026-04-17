/**
 * Business Intelligence Service
 * ─────────────────────────────
 * Fuses crowd density with commercial logic to drive venue revenue.
 *
 * FEATURES:
 *  - Dynamic Pricing (lower prices during low density to attract users)
 *  - Flash Offers (push notifications based on real-time location)
 *  - Sentiment Analysis (simulated based on game performance + wait times)
 *  - Revenue Forecasting (predicting sales based on crowd flow)
 */

// ─── Commercial Rules ───────────────────────────
const DENSITY_LOW_THRESHOLD  = 30; // %
const DENSITY_HIGH_THRESHOLD = 80; // %

/**
 * Calculate dynamic pricing for a location.
 * Base price modified by density and trend.
 */
export function calculateDynamicPrice(basePrice, density, trend) {
  let multiplier = 1.0;

  if (density < DENSITY_LOW_THRESHOLD) {
    // Low density: Discount to attract users
    multiplier = 0.8; 
  } else if (density > DENSITY_HIGH_THRESHOLD) {
    // High density: Premium pricing or "Express" surcharge
    multiplier = 1.25;
  }

  // Trend modifier
  if (trend === 'falling') multiplier -= 0.05;
  if (trend === 'rising')  multiplier += 0.05;

  return (basePrice * multiplier).toFixed(2);
}

/**
 * Detect business opportunities (Flash Offers).
 */
export function detectOpportunities(zoneData) {
  const opportunities = [];

  for (const zone of zoneData) {
    // Opportunity 1: Empty food stand
    if (zone.zoneType === 'FOOD' && zone.signalDensity < 25) {
      opportunities.push({
        id: `FLASH_OFFER_${zone.towerId}`,
        type: 'FLASH_OFFER',
        zoneId: zone.towerId,
        title: 'Empty Line Alert!',
        message: `🍔 ${zone.towerName} is wide open! 20% OFF if you order in the next 3 mins.`,
        discount: '20%',
        expiry: Date.now() + 180000, // 3 mins
      });
    }

    // Opportunity 2: Merch surge (High intent)
    if (zone.zoneType === 'SHOP' && zone.signalDensity > 70) {
      opportunities.push({
        id: `VIP_UPGRADE_${zone.towerId}`,
        type: 'VIP_UPGRADE',
        zoneId: zone.towerId,
        title: 'VIP Access Available',
        message: `🏪 ${zone.towerName} is busy. Upgrade to VIP Express for $5 to skip the queue!`,
        price: '$5',
        expiry: Date.now() + 300000,
      });
    }
  }

  return opportunities;
}

/**
 * Simulate crowd sentiment.
 * Factors: Game Momentum (Score), Wait Times, Weather.
 */
export function computeSentiment(avgWait, eventMomentum, weatherImpact) {
  // Score: 0 (Angry) to 100 (Euphoric)
  let score = 50;

  // Game Momentum is the biggest factor
  score += (eventMomentum - 0.5) * 60;

  // Wait times frustrate users
  score -= (avgWait / 30) * 40;

  // Weather impact
  score -= weatherImpact * 20;

  // Bound check
  score = Math.max(0, Math.min(100, Math.round(score)));

  let label = 'Neutral';
  let color = '#94a3b8';

  if (score > 80) { label = 'Euphoric'; color = '#10b981'; }
  else if (score > 60) { label = 'Positive'; color = '#22d3ee'; }
  else if (score < 20) { label = 'Frustrated'; color = '#ef4444'; }
  else if (score < 40) { label = 'Anxious'; color = '#f59e0b'; }

  return { score, label, color };
}

/**
 * Revenue Forecast Intelligence.
 * Estimates spend trajectory based on current device counts.
 */
export function forecastRevenue(zoneData, activeEventMomentum) {
  const totalTracked = zoneData.reduce((s, z) => s + z.deviceCount, 0);
  
  // Model: $5 per device/hr base, scaled by momentum
  const spendingVelocity = totalTracked * (5 + activeEventMomentum * 10);
  
  return {
    velocity: Math.round(spendingVelocity),
    projectedEnd: Math.round(spendingVelocity * 3), // 3-hour event
    peakZone: [...zoneData].sort((a, b) => b.deviceCount - a.deviceCount)[0]?.towerName || 'None',
  };
}
