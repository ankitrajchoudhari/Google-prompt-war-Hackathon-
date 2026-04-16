import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserSimulator } from './services/simulator';
import { calculateGroupCentroid, calculateOptimalMeetingPoint } from './services/groupService';
import { generateInitialTimeline, adaptTimeline } from './services/timelineService';
import { VENUE_GRAPH } from './services/navigationService';
import { mockLiveScoreAPI, mockPlaceOrder } from './services/advancedServices';
import { detectIntentAndEntities, generateDialogflowResponse } from './services/dialogflowService';
import { model as mlModel } from './services/mlPredictionService';
import { SignalTrackingService } from './services/signalTrackingService';
import {
  detectAnomalies,
  buildHeatmapData,
  computeFlowVectors,
  smartCrowdPrediction,
  generateCrowdDigest,
  computeEvacuationRoutes,
} from './services/crowdIntelligenceService';
import { 
  detectOpportunities, 
  computeSentiment, 
  forecastRevenue 
} from './services/businessIntelligenceService';

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
import SignalDashboard from './components/SignalDashboard';
import NotificationCenter from './components/NotificationCenter';

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
  // ─── Core State ─────────────────────────────────
  const [users, setUsers] = useState([]);
  const [densities, setDensities] = useState([]);
  const [weatherImpact, setWeatherImpact] = useState(0.1);
  const [eventMomentum, setEventMomentum] = useState(0.5);
  const [liveEvent, setLiveEvent] = useState({ score: '24-21', description: 'Game in Progress', momentum: 0.5 });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showHackathonMode, setShowHackathonMode] = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // ─── Signal Tracking State ──────────────────────
  const [signalData, setSignalData] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [flowVectors, setFlowVectors] = useState([]);
  const [signalAlerts, setSignalAlerts] = useState([]);
  const [crowdDigest, setCrowdDigest] = useState(null);
  const [zonePredictions, setZonePredictions] = useState({});
  const [isSignalTracking, setIsSignalTracking] = useState(true);
  const [realDevicePos, setRealDevicePos] = useState(null);

  // ─── Winning Features State ──────────────────
  const [isEmergency, setIsEmergency] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [sentiment, setSentiment] = useState(null);
  const [evacuationRoutes, setEvacuationRoutes] = useState([]);
  const [revenueStats, setRevenueStats] = useState(null);

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
    { id: 1, text: "Welcome to VenueIQ! I've analyzed current crowd patterns using real-time signal triangulation. Ask me anything about wait times, signal strength, or your group.", isBot: true },
  ]);

  const simulatorRef = useRef(null);
  const signalServiceRef = useRef(null);
  const prevSignalDataRef = useRef(null);
  const prevDeviceMapRef = useRef(null);
  const chatEndRef = useRef(null);

  // ─── Initialize Signal Tracking Service ─────────
  useEffect(() => {
    const signalService = new SignalTrackingService(VENUE.locations);
    signalServiceRef.current = signalService;

    // Start real GPS tracking
    signalService.startRealTracking((data) => {
      // This fires whenever the real device position updates
    });

    return () => signalService.stopRealTracking();
  }, []);

  // ─── Simulation Engine + Signal Processing ──────
  useEffect(() => {
    const sim = new UserSimulator(VENUE, 1000);
    simulatorRef.current = sim;

    sim.start((newUsers) => {
      setUsers(newUsers);

      // ── Standard density computation ──
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

      // ── Signal Triangulation Processing ──
      const signalService = signalServiceRef.current;
      if (signalService && isSignalTracking) {
        const result = signalService.processSignals(newUsers);
        setSignalData(result.zoneSignalData);

        // Build heatmap from signal data
        const heatmap = buildHeatmapData(result.zoneSignalData);
        setHeatmapData(heatmap);

        prevDeviceMapRef.current = result.deviceSignalMaps;

        // ── Business & Safety Intelligence ──
        if (result.zoneSignalData) {
          // 1. Detect Opportunities (Flash Deals)
          const opps = detectOpportunities(result.zoneSignalData.map(z => ({
            ...z,
            zoneType: VENUE.locations.find(l => l.id === z.towerId)?.type
          })));
          setOpportunities(prev => [...prev, ...opps].slice(-10));

          // 2. Crowd Sentiment
          const avgWait = computed.reduce((s, d) => s + d.predictedWait, 0) / computed.length;
          setSentiment(computeSentiment(avgWait, eventMomentum, weatherImpact));

          // 3. Revenue Forecast
          setRevenueStats(forecastRevenue(result.zoneSignalData, eventMomentum));

          // 4. Emergency Routing
          if (isEmergency) {
            setEvacuationRoutes(computeEvacuationRoutes(result.zoneSignalData, VENUE.locations));
          }

          // Anomaly detection
          const alerts = detectAnomalies(result.zoneSignalData, prevSignalDataRef.current);
          if (alerts.length > 0) {
            setSignalAlerts((prev) => [...alerts, ...prev].slice(0, 10));
          }
          prevSignalDataRef.current = result.zoneSignalData;

          // Crowd digest
          const digest = generateCrowdDigest(result.zoneSignalData);
          setCrowdDigest(digest);

          // Per-zone predictions
          const predictions = {};
          for (const zone of result.zoneSignalData) {
            predictions[zone.towerId] = smartCrowdPrediction(
              signalService, zone.towerId, eventMomentum, weatherImpact
            );
          }
          setZonePredictions(predictions);

          // Update real device position
          if (signalService.realDevicePosition) {
            setRealDevicePos(signalService.realDevicePosition);
          }
        }
      }

      // ── Group coordination ──
      const groupUsers = newUsers.filter((u) => group.members.some((m) => m.id === u.id));
      if (groupUsers.length > 0) {
        const centroid = calculateGroupCentroid(groupUsers);
        const optimal = calculateOptimalMeetingPoint(groupUsers, VENUE, computed, eventMomentum);
        setGroup((prev) => ({ ...prev, meetingPoint: optimal, centroid }));
      }

      // ── Adaptive timeline ──
      setTimeline((prev) => {
        if (prev.length === 0) return generateInitialTimeline(userPrefs, VENUE, computed);
        return adaptTimeline(prev, computed, eventMomentum);
      });

      // ── Random live score events ──
      if (Math.random() > 0.995) {
        const ev = mockLiveScoreAPI();
        setLiveEvent(ev);
        setEventMomentum(ev.momentum);
      }
    });

    return () => sim.stop();
  }, [weatherImpact, eventMomentum, group.members, userPrefs, isSignalTracking]);

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
      const lowerQuery = query.toLowerCase();

      // ── Signal-aware chat responses ──
      if (lowerQuery.includes('signal') || lowerQuery.includes('rssi') || lowerQuery.includes('tower') || lowerQuery.includes('tracking')) {
        const digest = crowdDigest;
        if (digest) {
          setChatMessages((prev) => [...prev, {
            id: Date.now() + 1,
            isBot: true,
            text: `📡 Signal Intelligence Report:\n• ${digest.totalDevices} devices tracked via ${VENUE.locations.length} cell towers\n• Venue status: ${digest.overallStatus}\n• Hottest zone: ${digest.hottestZone?.name} (${digest.hottestZone?.density}%)\n• Coolest zone: ${digest.coolestZone?.name} (${digest.coolestZone?.density}%)\n\nI'm using RSSI triangulation from virtual cell towers to estimate crowd density in real-time.`,
            buttons: ['View Heatmap', 'Zone Details'],
          }]);
        }
        return;
      }

      if (lowerQuery.includes('crowd') || lowerQuery.includes('density') || lowerQuery.includes('busy')) {
        const predictions = Object.entries(zonePredictions);
        const rising = predictions.filter(([_, p]) => p.trend === 'rising');
        const falling = predictions.filter(([_, p]) => p.trend === 'falling');

        setChatMessages((prev) => [...prev, {
          id: Date.now() + 1,
          isBot: true,
          text: `📊 Crowd Analysis:\n• ${rising.length} zones trending UP (getting busier)\n• ${falling.length} zones trending DOWN (clearing out)\n${crowdDigest ? `• Average density: ${crowdDigest.avgDensity}%` : ''}\n\nBased on signal trajectory, ${falling.length > 0 ? `${falling[0][0]} is clearing up — good time to visit!` : 'all zones are busy. Wait 5 mins.'}`,
          buttons: ['Show Predictions', 'Best Time to Go'],
        }]);
        return;
      }

      // Fall back to standard Dialogflow
      const intentData = detectIntentAndEntities(query);
      const res = generateDialogflowResponse(intentData, {
        densities: [...densities],
        group,
        timeline,
        locations: VENUE.locations,
      });
      setChatMessages((prev) => [...prev, { ...res, id: Date.now() + 1, isBot: true }]);
    }, 600);
  }, [inputValue, densities, group, timeline, crowdDigest, zonePredictions]);

  // ─── Computed values ───────────────────────────
  const avgWait = densities.length > 0
    ? Math.round(densities.reduce((s, d) => s + d.predictedWait, 0) / densities.length)
    : 0;
  const crowdLevel = users.length > 0
    ? Math.round(densities.reduce((s, d) => s + d.density, 0) / Math.max(1, densities.length))
    : 0;

  // ═══════════════════════════════════════════════
  //                   RENDER
  // ═══════════════════════════════════════════════
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

        {/* ─── LEFT PANEL ─── */}
        <div className="panel-left">
          <TimelinePanel timeline={timeline} />
          <GroupPanel groupCode={group.code} members={group.members} />
        </div>

        {/* ─── CENTER PANEL: Map ─── */}
        <VenueMap
          VENUE_GRAPH={VENUE_GRAPH}
          densities={densities}
          users={users}
          locations={VENUE.locations}
          getDensityColor={getDensityColor}
          centroid={group.centroid}
          heatmapData={heatmapData}
          flowVectors={flowVectors}
          realDevice={realDevicePos}
          isEmergency={isEmergency}
          evacuationRoutes={evacuationRoutes}
        />

        {/* ─── RIGHT PANEL ─── */}
        <div className="panel-right">
          {/* Signal Intelligence Dashboard */}
          <SignalDashboard
            zoneSignalData={signalData}
            crowdDigest={crowdDigest}
            alerts={signalAlerts}
            predictions={zonePredictions}
            realDevice={realDevicePos}
            isTracking={isSignalTracking}
          />

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

      {/* ─── Footer Controls ─── */}
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
        <div>
          <label style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            Demo Safety
          </label>
          <button 
            onClick={() => setIsEmergency(!isEmergency)}
            className={isEmergency ? 'pulse-fast' : ''}
            style={{ 
              width: '100%', padding: '6px 12px', fontSize: '0.6rem',
              background: isEmergency ? '#ef4444' : 'rgba(255,255,255,0.05)',
              border: isEmergency ? 'none' : '1px solid var(--glass-border)',
              borderRadius: 6, color: 'white', fontWeight: 900
            }}
          >
            {isEmergency ? '⚠️ EXIT EVACUATION' : '🚨 Trigger Alarm'}
          </button>
        </div>
        <div>
          <label style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            Signal Tracking
          </label>
          <button 
            onClick={() => setIsSignalTracking(!isSignalTracking)}
            className={isSignalTracking ? 'btn-primary' : 'btn-ghost'}
            style={{ width: '100%', padding: '6px 12px', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            📡 {isSignalTracking ? 'Active' : 'Start'}
          </button>
        </div>
      </div>

      <NotificationCenter 
        opportunities={opportunities} 
        emergencyMode={isEmergency} 
        sentiment={sentiment} 
      />

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
