import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const HackathonSplash = ({ show, onLaunch }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="hackathon-overlay"
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="glass-card hackathon-card"
          >
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--primary)' }}>
                Hackathon 2026
              </span>
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 4, background: 'linear-gradient(135deg, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              VenueIQ
            </h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 32, fontWeight: 600 }}>
              Predictive Event Experience Orchestrator
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32, textAlign: 'left' }}>
              {[
                { icon: '🧠', label: 'ML Core', desc: 'Linear regression on 4-week Kaggle dataset predicts wait times 30 min ahead' },
                { icon: '⚡', label: '1,000 Agents', desc: 'Real-time crowd simulation engine running at 10fps for live demo validation' },
                { icon: '👥', label: 'Social Sync', desc: 'Centroid-based group meetup optimization with density-aware routing' },
              ].map((f) => (
                <div key={f.label} style={{ display: 'flex', gap: 12, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '1.2rem' }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 4 }}>{f.label}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={onLaunch} className="btn-primary" style={{ width: '100%', padding: '14px 20px', fontSize: '0.8rem', borderRadius: 16 }}>
              Launch Interactive Demo →
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HackathonSplash;
