/**
 * Adaptive Timeline Orchestration Engine.
 */

export const generateInitialTimeline = (userPrefs, _venueConfig, _currentDensities) => {
  const { priorities, seatLocation: _seatLocation } = userPrefs;
  
  // 1. Define hard constraints (Must-dos)
  const timeline = [
    { id: 't1', activity: 'Pre-game Restroom', time: '17:45', location: 'restroom_1', type: 'MUST', urgency: 'SUGGESTED' },
    { id: 't2', activity: 'Halftime Food', time: '19:15', location: 'stand_1', type: 'MUST', urgency: 'CRITICAL' },
  ];

  // 2. Add nice-to-haves based on priority
  priorities.forEach((pref) => {
    if (pref === 'Merchandise') {
      timeline.push({ id: 't3', activity: 'Visit Team Store', time: '18:30', location: 'merch_1', type: 'NICE', urgency: 'SUGGESTED' });
    } else if (pref === 'Photo spots') {
      timeline.push({ id: 't4', activity: 'Photo at Plaque', time: '18:00', location: 'photo_1', type: 'NICE', urgency: 'FYI' });
    }
  });

  return sortTimeline(timeline);
};

export const adaptTimeline = (currentTimeline, densities, eventMomentum) => {
  return currentTimeline.map(item => {
    const locDensity = densities.find(d => d.locationId === item.location);
    const densityVal = locDensity?.density || 50;

    let status = 'GREEN';
    let suggestion = '';

    if (densityVal > 80 || eventMomentum > 0.8) {
      status = 'RED';
      suggestion = 'Wait queues peaking. Reschedule if possible.';
    } else if (densityVal > 60) {
      status = 'YELLOW';
      suggestion = 'Medium traffic. Be prepared for a 10-15m wait.';
    }

    // Adaptive logic: If density is low NOW but high later (history), push earlier
    if (densityVal < 40 && item.urgency !== 'CRITICAL') {
      suggestion = 'Queue is shorter than expected! Visit now?';
    }

    return { ...item, status, suggestion };
  });
};

const sortTimeline = (timeline) => {
  return timeline.sort((a, b) => a.time.localeCompare(b.time));
};
