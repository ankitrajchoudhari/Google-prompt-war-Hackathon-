/**
 * Firebase Service - Gracefully handles missing configuration.
 * For hackathon demo, all features work without Firebase.
 * Connect your Firebase project by replacing the config below.
 */

let app = null;
let auth = null;
let rtdb = null;
let db = null;

const FIREBASE_CONFIGURED = false; // Set to true when config is added

try {
  if (FIREBASE_CONFIGURED) {
    const { initializeApp } = await import('firebase/app');
    const { getAuth } = await import('firebase/auth');
    const { getDatabase } = await import('firebase/database');
    const { getFirestore } = await import('firebase/firestore');
    const { getAnalytics, logEvent } = await import('firebase/analytics');

    const firebaseConfig = {
      apiKey: process.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
      databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
      appId: process.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
      measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "YOUR_MEASUREMENT_ID",
    };

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    rtdb = getDatabase(app);
    db = getFirestore(app);
    
    // Initialize Analytics for usage tracking
    const analytics = getAnalytics(app);
    logEvent(analytics, 'app_initialized');
  }
} catch (err) {
  console.warn('[Firebase] Not configured - using mock mode. Consider completing Google Cloud setup.', err.message);
}

export { auth, rtdb, db };

// Mock-safe exports - all work without Firebase
export const loginAnonymously = () => {
  console.log('[Firebase Mock] Anonymous login');
  return Promise.resolve({ uid: 'demo_user_001' });
};

export const createGroup = async (userId) => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  console.log(`[Firebase Mock] Group created: ${code}`);
  return code;
};

export const broadcastLocation = (_groupId, _userId, _coords) => {
  // No-op in demo mode
};

export const listenToGroupLocations = (_groupId, callback) => {
  console.log(`[Firebase Analytics] Tracking listener for group: ${_groupId}`);
  callback({});
  return () => {};
};

export const updateLiveLocation = (_userId, _lat, _lng) => {
  // No-op in demo mode, normally synchronizes to RTDB
};

export const saveHistoricalPattern = async (_venueId, _eventType, _timeSegment, locationId, waitTime) => {
  console.log(`[Firebase Mock] Saving pattern: ${locationId} = ${waitTime}min`);
};

export const fetchHistoricalData = async (_venueId, _eventType, _timeSegment, _locationId) => {
  return { averageWait: Math.floor(Math.random() * 15) + 5 };
};
