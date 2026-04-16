/**
 * Enhanced Chatbot Service for VenueAssist.
 */

export const processUserMessage = (text, context) => {
  const query = text.toLowerCase();
  const { densities, group, weatherImpact, eventMomentum, locations } = context;

  // 1. RECOMMENDATION / SHORTEST WAIT
  if (query.includes('fastest') || query.includes('shortest') || query.includes('where to go') || query.includes('recommend')) {
    const sorted = [...densities].sort((a, b) => a.predictedWait - b.predictedWait);
    const best = sorted[0];
    return `Right now, ${best.name} is the best choice with only a ${best.predictedWait}-minute wait! It's currently at ${Math.round(best.density)}% capacity.`;
  }

  // 2. SPECIFIC STAND CHECK
  const matchingStand = densities.find(d => query.includes(d.name.toLowerCase()) || query.includes(d.locationId.toLowerCase()));
  if (matchingStand) {
    return `The ${matchingStand.name} has a predicted wait of ${matchingStand.predictedWait} minutes. Current density is ${Math.round(matchingStand.density)}%.`;
  }

  // 3. GROUP / FRIENDS
  if (query.includes('friend') || query.includes('group') || query.includes('where are they') || query.includes('meet')) {
    if (group.meetingPoint) {
      return `Your group (${group.code}) is spread out. I recommend meeting at ${group.meetingPoint.name} - it's centrally located and currently low-density.`;
    }
    if (eventMomentum > 0.8) {
      return `It's a critical moment in the game! I recommend staying put until this play finishes before meeting your friends.`;
    }
    return `Sarah and Ankit are currently moving through the venue. I'll alert you the moment they're in a good spot to meet.`;
  }

  // 4. WEATHER / ENVIRONMENT
  if (query.includes('weather') || query.includes('rain') || query.includes('outside')) {
    if (weatherImpact > 0.6) {
      return `Due to the current weather impact, indoor stands like Gourmet Burger and Stadium Brews are seeing higher density. Taco Terrace is outdoors and might be less crowded if you don't mind the drizzle!`;
    }
    return `Weather impact is minimal today. Most outdoor stands are operating with normal wait times.`;
  }

  // 5. HI / GREETING
  if (query.includes('hi') || query.includes('hello') || query.includes('hey')) {
    return "Hey! I'm your QueueSense AI assistant. Ask me about wait times, where to meet your group, or which food stand has the shortest line.";
  }

  // 6. FALLBACK
  return "I'm not sure about that, but I can tell you that the fastest line right now is at " + 
         [...densities].sort((a, b) => a.predictedWait - b.predictedWait)[0].name + "!";
};
