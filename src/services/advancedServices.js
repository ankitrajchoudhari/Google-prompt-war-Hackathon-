/**
 * Live Score & Momentum Sync Service.
 */
export const mockLiveScoreAPI = () => {
    const events = [
      { score: '7-0', momentum: 0.8, description: 'TOUCHDOWN! High traffic at restrooms.' },
      { score: '7-7', momentum: 0.5, description: 'Interception! Momentum balance shifting.' },
      { score: '14-7', momentum: 0.9, description: 'GOAL! Crowds moving to concession.' },
      { score: '14-14', momentum: 0.2, description: 'Flat play. Optimal time for Merchandise.' }
    ];
    // Return random event for demo
    return events[Math.floor(Math.random() * events.length)];
};

/**
 * Enhanced Navigation with Accessibility.
 */
export const calculateEdgeWeight = (edge, congestion, isAccessibility) => {
    let weight = edge.length * (1 + (congestion / 100));
    
    // Penalize/Exclude stairs for accessibility mode
    if (isAccessibility && (edge.type === 'STAIRS' || edge.id === 'shortcut_corridor')) {
      weight *= 10; // 10x penalty or exclude
    }
    
    return weight;
};

/**
 * Service Requests (Food/Assist).
 */
export const mockPlaceOrder = (standId, _items) => {
    return {
      orderId: `ORD-${Math.random().toString(36).substring(7).toUpperCase()}`,
      status: 'PREPARING',
      eta: '12 mins'
    };
};
