# VenueIQ - Predictive Event Experience Orchestrator

**Winning Hackathon Submission: Predictive Crowd Management & Social Coordination**

VenueIQ is not just a status app—it's an **Orchestrator**. Using a combination of real-time multi-agent simulation and ML-based regression models, it proactively shifts crowd flows before bottlenecks occur, ensuring a seamless experience for 50,000+ stadium attendees.

## 🚀 Key Differentiators
- **PREDICTIVE vs REACTIVE**: Most apps show current wait times. VenueIQ predicts wait times 30 minutes into the future based on historical patterns (Kaggle) and live momentum (ESPN API).
- **GROUP ORCHESTRATION**: Syncs entire social groups (e.g., friend circles) to meet at optimal "Centroid" points during low-congestion windows.
- **AUTONOMOUS SIMULATION**: Built-in 1,000 user high-performance engine for real-time demo validation without requiring physical testing.

## 🛠️ Technology Stack
- **Frontend**: React.js / Tailwind CSS / Framer Motion
- **AI/ML**: Custom Linear Regression Model (Client-side)
- **Backend**: Firebase (Firestore, Realtime DB, Auth)
- **Maps**: Google Maps Platform / Custom Graph-based Navigation
- **Sim Engine**: Custom 30fps Multi-Agent Simulation

## 🏗️ Architecture
1. **Perception Layer**: Collects real-time grid-based density data from 1,000 simulated users.
2. **ML Prediction Engine**: Forecasts wait times using [Density × History × Momentum × Weather] coefficients.
3. **Strategy Layer**: Constraint-satisfaction engine that re-optimizes user timelines every 60 seconds.
4. **Action Layer**: Push notifications and AR-ready navigation overlays for the end-user.

## 🏁 Installation
1. Clone the repository.
2. `npm install`
3. `npm run dev`
4. Use the **Hackathon Presentation Mode** (Settings Icon) to trigger demo scenarios like "Halftime Rush".

---
*Built for the 2026 Future Venue Hackathon.*
