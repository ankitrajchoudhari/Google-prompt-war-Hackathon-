/**
 * Intelligent Navigation & Dynamic Pathfinding.
 */

export const VENUE_GRAPH = {
  nodes: [
    { id: 'entrance', x: 400, y: 480, label: 'Main Entrance' },
    { id: 'hub_north', x: 400, y: 200, label: 'North Hub' },
    { id: 'hub_south', x: 400, y: 350, label: 'South Hub' },
    { id: 'stand_1', x: 150, y: 150, label: 'Burger Stand' },
    { id: 'stand_2', x: 650, y: 150, label: 'Pizza Stand' },
    { id: 'restroom_1', x: 650, y: 400, label: 'Restroom' },
  ],
  edges: [
    { from: 'entrance', to: 'hub_south', capacity: 100, length: 130 },
    { from: 'hub_south', to: 'hub_north', capacity: 80, length: 150 },
    { from: 'hub_north', to: 'stand_1', capacity: 50, length: 180 },
    { from: 'hub_north', to: 'stand_2', capacity: 50, length: 180 },
    { from: 'hub_south', to: 'restroom_1', capacity: 60, length: 150 },
  ]
};

export const calculateEdgeCongestion = (edge, userCount) => {
  const factor = (userCount / edge.capacity);
  return Math.min(100, factor * 100);
};

export const findOptimalPath = (startId, endId, densities, _eventPhase = 'ongoing') => {
  // Dijkstra with dynamic weights
  // Weight = length * (1 + congestion_factor)
  // If phase = exit, multiply exit edges by 2x
  
  const results = [];
  
  // MOCKED for demo: 3 paths
  results.push({
    id: 'fastest',
    label: 'Fastest Path',
    nodes: ['entrance', 'hub_south', 'hub_north', 'stand_1'],
    congestion: 45,
    style: 'YELLOW'
  });

  results.push({
    id: 'quiet',
    label: 'Least Crowded',
    nodes: ['entrance', 'hub_south', 'restroom_1', 'stand_1'], // Longer detour
    congestion: 15,
    style: 'GREEN'
  });

  return results;
};
