import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserSimulator } from './services/simulator';
import { calculateGroupCentroid, calculateOptimalMeetingPoint } from './services/groupService';
import { generateInitialTimeline, adaptTimeline } from './services/timelineService';
import { VENUE_GRAPH } from './services/navigationService';
import { mockLiveScoreAPI, mockPlaceOrder } from './services/advancedServices';
import { detectIntentAndEntities, generateDialogflowResponse } from './services/dialogflowService';
import { model as mlModel } from './services/mlPredictionService';

// Components
import HackathonSplash from './components/HackathonSplash';
import Header from './components/Header';
import StatsBar from './components/StatsBar';
import TimelinePanel from './components/TimelinePanel';
import GroupPanel from './components/GroupPanel';
import VenueMap from './components/VenueMap';
import SuggestionsPanel from './components/SuggestionsPanel';
import LiveEventFeed from './components/LiveEventFeed';
import Chatbot from './components/Chatbot';
import AdminController from './components/AdminController';

// ─── Venue Configuration ───────────────────────
const VENUE = {
  id: 'stadium_01',
  width: 800,
  height: 500,
  locations: [
    { id: 'gate_a', name: 'Main Gate', x: 50, y: 250, radius: 40, type: 'GATE', capacity: 200, baseline: 5 },
    { id: 'stand_1', name: 'Burger Queen', x: 200, y: 150, radius: 30, type: 'FOOD', capacity: 40, baseline: 12 },
    { id: 'stand_2', name: 'Pizza Point', x: 600, y: 150, radius: 30, type: 'FOOD', capacity: 40, baseline: 10 },
    { id: 'rest_1', name: 'Restrooms', x: 400, y: 50, radius: 25, type: 'RESTROOM', capacity: 50, baseline: 8 },
    { id: 'merch_1', name: 'Team Store', x: 400, y: 400, radius: 50, type: 'SHOP', capacity: 100, baseline: 15 },
    { id: 'photo_1', name: 'Trophy Zone', x: 700, y: 400, radius: 35, type: 'PHOTO', capacity: 30, baseline: 5 },
  ],
};

// ─── Density Color Helper ──────────────────────
const getDensityColor = (d) => (d < 40 ? '#10b981' : d < 70 ? '#f59e0b' : '#ef4444');
const getDensityLabel = (d) => (d < 40 ? 'Low' : d < 70 ? 'Med' : 'High');

function App() {
  // State
  const [users, setUsers] = useState([]);
  const [densities, setDensities] = useState([]);
  const [weatherImpact, setWeatherImpact] = useState(0.1);
  const [eventMomentum, setEventMomentum] = useState(0.5);
  const [liveEvent, setLiveEvent] = useState({ score: '24-21', description: 'Game in Progress', momentum: 0.5 });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showHackathonMode, setShowHackathonMode] = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const [userPrefs] = useState({
    seat: 'Sec 104, Row G',
    priorities: ['Food', 'Restrooms', 'Merchandise'],
    dietary: 'None',
  });

  const [group, setGroup] = useState({
    code: 'HACK-26',
    members: [
      { id: 'user_0', name: 'Ankit (You)', x: 100, y: 100 },
      { id: 'user_1', name: 'Sarah', x: 300, y: 300 },
      { id: 'user_2', name: 'Priya', x: 500, y: 140 },
    ],
    meetingPoint: null,
    centroid: null,
  });

  const [timeline, setTimeline] = useState([]);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: "Welcome to VenueIQ! I've analyzed current crowd patterns. Ask me anything about wait times, navigation or your group.", isBot: true },
  ]);

  const simulatorRef = useRef(null);
  const chatEndRef = useRef(null);

  // ─── Simulation Engine ─────────────────────────
  useEffect(() => {
    const sim = new UserSimulator(VENUE, 1000);
    simulatorRef.current = sim;

    sim.start((newUsers) => {
      setUsers(newUsers);

      // Compute densities for every venue location
      const computed = VENUE.locations.map((loc) => {
        const count = newUsers.filter((u) => {
          const dx = u.x - loc.x;
          const dy = u.y - loc.y;
          return Math.sqrt(dx * dx + dy * dy) < loc.radius;
        }).length;
        const density = Math.min(100, (count / loc.capacity) * 100);
        const predictedWait = mlModel.predict(density, loc.baseline, eventMomentum, weatherImpact);
        return { ...loc, locationId: loc.id, count, density, predictedWait };
      });
      setDensities(computed);

      // Group coordination
      const groupUsers = newUsers.filter((u) => group.members.some((m) => m.id === u.id));
      if (groupUsers.length > 0) {
        const centroid = calculateGroupCentroid(groupUsers);
        const optimal = calculateOptimalMeetingPoint(groupUsers, VENUE, computed, eventMomentum);
        setGroup((prev) => ({ ...prev, meetingPoint: optimal, centroid }));
      }

      // Adaptive timeline
      setTimeline((prev) => {
        if (prev.length === 0) return generateInitialTimeline(userPrefs, VENUE, computed);
        return adaptTimeline(prev, computed, eventMomentum);
      });

      // Random live score events
      if (Math.random() > 0.995) {
        const ev = mockLiveScoreAPI();
        setLiveEvent(ev);
        setEventMomentum(ev.momentum);
      }
    });

    return () => sim.stop();
  }, [weatherImpact, eventMomentum, group.members, userPrefs]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ─── Chat Handler ──────────────────────────────
  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim()) return;
    const userMsg = { id: Date.now(), text: inputValue, isBot: false };
    setChatMessages((prev) => [...prev, userMsg]);
    const query = inputValue;
    setInputValue('');

    setTimeout(() => {
      const intentData = detectIntentAndEntities(query);
      const res = generateDialogflowResponse(intentData, {
        densities: [...densities],
        group,
        timeline,
        locations: VENUE.locations,
      });
      setChatMessages((prev) => [...prev, { ...res, id: Date.now() + 1, isBot: true }]);
    }, 600);
  }, [inputValue, densities, group, timeline]);

  // ─── Computed values ───────────────────────────
  const avgWait = densities.length > 0
    ? Math.round(densities.reduce((s, d) => s + d.predictedWait, 0) / densities.length)
    : 0;
  const crowdLevel = users.length > 0
    ? Math.round(densities.reduce((s, d) => s + d.density, 0) / Math.max(1, densities.length))
    : 0;

  return (
    <div className="app-container">
      <HackathonSplash show={showHackathonMode} onLaunch={() => setShowHackathonMode(false)} />
      
      <Header 
        liveEvent={liveEvent} 
        usersCount={users.length} 
        onToggleSettings={() => setIsAdminOpen(!isAdminOpen)} 
        isSettingsOpen={isAdminOpen} 
      />

      <main className="dashboard-grid no-scrollbar">
        <AdminController 
          isAdminOpen={isAdminOpen} 
          setEventMomentum={setEventMomentum} 
          setWeatherImpact={setWeatherImpact} 
          setShowHackathonMode={setShowHackathonMode} 
        />

        <StatsBar 
          avgWait={avgWait} 
          crowdLevel={crowdLevel} 
          meetingPointName={group.meetingPoint?.name} 
        />

        <div className="panel-left">
          <TimelinePanel timeline={timeline} />
          <GroupPanel groupCode={group.code} members={group.members} />
        </div>

        <VenueMap 
          VENUE_GRAPH={VENUE_GRAPH} 
          densities={densities} 
          users={users} 
          locations={VENUE.locations} 
          getDensityColor={getDensityColor} 
          centroid={group.centroid} 
        />

        <div className="panel-right">
          <SuggestionsPanel 
            densities={densities} 
            getDensityColor={getDensityColor} 
            getDensityLabel={getDensityLabel} 
            onPlaceOrder={mockPlaceOrder} 
          />
          <LiveEventFeed 
            description={liveEvent.description} 
            eventMomentum={eventMomentum} 
            weatherImpact={weatherImpact} 
          />
        </div>
      </main>

      <div className="footer-controls">
        <div>
          <label style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            Weather Impact
          </label>
          <input type="range" min="0" max="100" value={weatherImpact * 100}
            onChange={(e) => setWeatherImpact(e.target.value / 100)}
            style={{ width: '100%', accentColor: 'var(--primary)', height: 4 }}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            Game Momentum
          </label>
          <input type="range" min="0" max="100" value={eventMomentum * 100}
            onChange={(e) => setEventMomentum(e.target.value / 100)}
            style={{ width: '100%', accentColor: 'var(--primary)', height: 4 }}
          />
        </div>
      </div>

      <Chatbot 
        isChatOpen={isChatOpen} 
        setIsChatOpen={setIsChatOpen} 
        chatMessages={chatMessages} 
        inputValue={inputValue} 
        setInputValue={setInputValue} 
        handleSendMessage={handleSendMessage} 
        chatEndRef={chatEndRef} 
      />
    </div>
  );
}

export default App;
