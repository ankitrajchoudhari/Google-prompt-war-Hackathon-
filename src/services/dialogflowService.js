/**
 * Dialogflow CX-style Chatbot Engine (Simulated).
 */

const ENTITIES = {
  locations: ['section_101', 'stand_1', 'stand_2', 'restroom_1', 'main_entrance'],
  food_types: ['pizza', 'burger', 'taco', 'vegan', 'beer'],
  intent_modifiers: ['fastest', 'closest', 'least crowded']
};

export const detectIntentAndEntities = (text) => {
  const query = text.toLowerCase();
  
  // 1. Entity Extraction (Simulated)
  const extracted = {
    location: ENTITIES.locations.find(l => query.includes(l.replace('_', ' '))),
    food: ENTITIES.food_types.find(f => query.includes(f)),
    modifier: ENTITIES.intent_modifiers.find(m => query.includes(m))
  };

  // 2. Intent Detection
  let intent = 'DEFAULT_FALLBACK';
  if (query.includes('how to get') || query.includes('direction') || query.includes('where is')) intent = 'NAVIGATION';
  else if (query.includes('when') || query.includes('time') || query.includes('halftime')) intent = 'TIMING';
  else if (query.includes('pizza') || query.includes('burger') || query.includes('food') || query.includes('best')) intent = 'RECOMMENDATION';
  else if (query.includes('friend') || query.includes('group') || query.includes('sarah')) intent = 'SOCIAL';

  return { intent, entities: extracted };
};

export const generateDialogflowResponse = (intentData, context) => {
  const { intent, entities } = intentData;
  const { densities, group, timeline } = context;

  switch (intent) {
    case 'NAVIGATION':
      return {
        text: `Mapping your route to ${entities.location || 'the requested spot'}. I've picked the fastest path!`,
        action: 'NAVIGATE',
        visual: 'MAP'
      };
    case 'RECOMMENDATION':
      const food = entities.food || 'food';
      const best = [...densities].sort((a, b) => a.predictedWait - b.predictedWait)[0];
      return {
        text: `Looking for ${food}? The closest and fastest option is ${best.name} with a ${best.predictedWait}-minute wait.`,
        action: 'ORDER',
        buttons: ['Navigate There', 'Order Now']
      };
    case 'TIMING':
      const nextTask = timeline[0] || { activity: 'the game' };
      return {
        text: `Based on your schedule, you should visit the stand in 10 minutes. Your next task is ${nextTask.activity}.`,
        action: 'REMIND',
        buttons: ['Set Reminder', 'Update Timeline']
      };
    case 'SOCIAL':
      const meet = group.meetingPoint;
      return {
        text: `Your friends are moving! I recommend meeting at ${meet ? meet.name : 'the central hub'}.`,
        action: 'SHARE_LOCATION',
        buttons: ['Share My Location', 'Get Directions']
      };
    default:
      return {
        text: "I'm not sure about that, but according to your preferences, the Team Store has low traffic right now. Want to check it out?",
        buttons: ['Show Me', 'Maybe Later']
      };
  }
};

/**
 * Proactive Follow-up Logic.
 */
export const checkProactiveOpportunities = (context, lastQueries) => {
  const { densities } = context;
  const opportunities = [];

  // If user previously asked about pizza and wait is now under 5 mins
  if (lastQueries.some(q => q.includes('pizza'))) {
    const pizzaStand = densities.find(d => d.name.toLowerCase().includes('pizza'));
    if (pizzaStand && pizzaStand.predictedWait <= 5) {
      opportunities.push({
        id: 'proactive_pizza',
        text: `Update: You asked about pizza earlier - ${pizzaStand.name} now has no line!`,
        buttons: ['Order Now']
      });
    }
  }

  return opportunities;
};
