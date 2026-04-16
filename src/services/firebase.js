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

    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
      databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_PROJECT_ID.appspot.com",
      messagingSenderId: "YOUR_SENDER_ID",
      appId: "YOUR_APP_ID",
    };

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    rtdb = getDatabase(app);
    db = getFirestore(app);
  }
} catch (err) {
  console.warn('[Firebase] Not configured - using mock mode:', err.message);
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
  callback({});
  return () => {};
};

export const updateLiveLocation = (_userId, _lat, _lng) => {
  // No-op in demo mode
};

export const saveHistoricalPattern = async (_venueId, _eventType, _timeSegment, locationId, waitTime) => {
  console.log(`[Firebase Mock] Saving pattern: ${locationId} = ${waitTime}min`);
};

export const fetchHistoricalData = async (_venueId, _eventType, _timeSegment, _locationId) => {
  return { averageWait: Math.floor(Math.random() * 15) + 5 };
};
