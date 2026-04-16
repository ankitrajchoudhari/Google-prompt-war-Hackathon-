import historicalData from './historical_data.json';

/**
 * Weighted prediction algorithm for queue wait times.
 * Formula: PredictedWait = (D * 0.4) + (H * 0.3) + (M * 0.2) + (W * 0.1)
 */
export const calculatePredictedWait = ({
  currentDensity, // 0 to 100 (percentage of capacity)
  historicalAvg,  // in minutes
  eventMomentum,  // 0 to 1 (0 = normal, 1 = peak surge like goal/halftime)
  weatherImpact,  // 0 to 1 (0 = no impact, 1 = high push towards indoor/outdoor)
  baselineWait    // base wait time in minutes for this location
}) => {
  // 1. Current Density Weight (40%)
  // Map density to minutes. If 100% density, maybe 20 mins wait.
  const densityWait = currentDensity * 0.2; // 100% -> 20 mins
  const dWeight = 0.4;

  // 2. Historical Average Weight (30%)
  const hWeight = 0.3;

  // 3. Event Momentum Weight (20%)
  // Surge adds up to 15 minutes
  const momentumWait = eventMomentum * 15;
  const mWeight = 0.2;

  // 4. Weather Impact Weight (10%)
  // Weather adds up to 10 minutes (e.g., rain pushes everyone to indoor food stands)
  const weatherWait = weatherImpact * 10;
  const wWeight = 0.1;

  // Normalized weighted sum
  // We need to scale these appropriately.
  // Let's assume the final prediction is a blend of these factors.
  
  const predicted = 
    (densityWait * dWeight) + 
    (historicalAvg * hWeight) + 
    (momentumWait * mWeight) + 
    (weatherWait * wWeight) +
    (baselineWait * 0.1); // Small baseline component

  return Math.round(predicted);
};

export const getRecommendation = (locations, timeSegment = 'Weekday') => {
  // Sort locations by predicted wait time
  const sorted = [...locations].map(loc => {
    // Find historical match
    const history = historicalData.find(h => h.location_id === loc.id && h.time_segment === timeSegment);
    const historicalAvg = history ? history.avg_wait : 8; // Default to 8 if no history

    return { ...loc, historicalAvg };
  }).sort((a, b) => a.predictedWait - b.predictedWait);
  
  const best = sorted[0];
  if (best.predictedWait <= 5) {
    return `Perfect time to grab food - ${best.name} has only ${best.predictedWait}-minute wait predicted!`;
  } else if (best.predictedWait <= 10) {
    return `Pretty good time! ${best.name} is your best bet with a ${best.predictedWait}-minute wait.`;
  }
  return `It's busy everywhere. ${best.name} is the fastest option right now (${best.predictedWait} mins).`;
};
