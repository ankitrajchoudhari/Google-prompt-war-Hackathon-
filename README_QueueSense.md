# QueueSense AI - Predictive Queue Management

A state-of-the-art predictive crowd management system built for high-traffic venues.

## Features
- **Real-time Heatmapping**: Visualizes anonymous user movement across the venue.
- **Predictive Analytics**: Calculates estimated wait times using a 4-factor weighted algorithm.
- **Event Groups (Social)**: Create temporary groups with shareable codes.
- **Smart Meeting Points**: AI-suggested low-density meeting spots based on group proximity.
- **Proactive Social Alerts**: "Sarah is heading to restroom" notifications to trigger meetups.
- **AI Chatbot**: Provides proactive recommendations to users to optimize their experience.
- **Dynamic Simulation**: Integrated engine to demonstrate crowd flows during peak and off-peak times.

## The Algorithm
Our prediction engine uses a weighted sum of four key variables:
1. **Current Density (40%)**: Live data from Firebase RTDB tracking.
2. **Historical Average (30%)**: Patterns stored in Firestore (by venue, event, and time).
3. **Event Momentum (20%)**: Surge detection based on real-time event triggers (e.g., scoring).
4. **Weather Impact (10%)**: Adjustment factors for indoor vs. outdoor location preferences.

## Tech Stack
- **Frontend**: React, Framer Motion, Lucide Icons
- **Backend/Database**: Firebase (Realtime DB & Firestore)
- **Styling**: Vanilla CSS with Glassmorphism Design System

## Getting Started
1. Install dependencies: `npm install`
2. Connect Firebase: Update `src/services/firebase.js` with your credentials.
3. Start development server: `npm run dev`
