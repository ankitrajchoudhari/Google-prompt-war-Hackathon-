/**
 * Enhanced Group Coordination Services.
 */

export const calculateGroupCentroid = (members) => {
  if (!members || members.length === 0) return null;
  const count = members.length;
  const sumX = members.reduce((acc, m) => acc + m.x, 0);
  const sumY = members.reduce((acc, m) => acc + m.y, 0);
  return { x: sumX / count, y: sumY / count };
};

export const getSmartTimingSuggestion = (momentValue, timeRemaining) => {
  // logic to avoid halftime / critical game moments
  if (momentValue > 0.8) return "Avoid moving now - Critical play in progress!";
  if (timeRemaining < 300) return "High traffic warning: Quarter ending soon.";
  return "Perfect time for a group meetup.";
};

export const calculateOptimalMeetingPoint = (members, venueConfig, densityMap, currentMomentum) => {
  if (!members || members.length === 0 || currentMomentum > 0.8) {
    // Return null if it's a critical game moment (high momentum)
    return null; 
  }

  // 1. Find Center of Gravity (average x, y)
  const avgX = members.reduce((sum, m) => sum + m.x, 0) / members.length;
  const avgY = members.reduce((sum, m) => sum + m.y, 0) / members.length;

  // 2. Score potential meeting points (all defined locations)
  const scores = venueConfig.locations.map(loc => {
    // Distance from the group center
    const distToCenter = Math.sqrt(Math.pow(loc.x - avgX, 2) + Math.pow(loc.y - avgY, 2));
    
    // Density penalty
    const densityData = densityMap.find(d => d.locationId === loc.id);
    const densityPenalty = (densityData?.density || 0) * 2; // High weight on low density

    // Final Score (lower is better)
    return {
      ...loc,
      score: distToCenter + densityPenalty
    };
  });

  // Sort and pick the best (lowest score)
  return scores.sort((a, b) => a.score - b.score)[0];
};

export const getProactiveAlert = (member, previousX, previousY, locations) => {
  // Detect if member is moving towards a specific location like a restroom
  // Simplified: Check if they entered the radius of a location
  const restroom = locations.find(l => l.name.toLowerCase().includes('restroom') || l.id === 'restroom_1');
  
  if (!restroom) return null;

  const prevDist = Math.sqrt(Math.pow(previousX - restroom.x, 2) + Math.pow(previousY - restroom.y, 2));
  const currDist = Math.sqrt(Math.pow(member.x - restroom.x, 2) + Math.pow(member.y - restroom.y, 2));

  // If they were outside and now inside the restroom radius
  if (prevDist > restroom.radius && currDist < restroom.radius) {
    return `${member.name} is heading to the restroom - this is your chance to meet up!`;
  }

  return null;
};
