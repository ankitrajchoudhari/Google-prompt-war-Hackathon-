import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings } from 'lucide-react';

const AdminController = ({ 
  isAdminOpen, 
  setEventMomentum, 
  setWeatherImpact, 
  setShowHackathonMode 
}) => {
  return (
    <AnimatePresence>
      {isAdminOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
          style={{ overflow: 'hidden', gridColumn: '1 / -1' }}
        >
          <div className="admin-panel">
            <div className="panel-section-title"><Settings size={12} /> Demo Controller</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
              <button className="btn-ghost" onClick={() => setEventMomentum(1.0)}>🔥 Halftime Rush</button>
              <button className="btn-ghost" onClick={() => setWeatherImpact(0.8)}>🌧️ Rain Warning</button>
              <button className="btn-ghost" onClick={() => { setEventMomentum(0.1); setWeatherImpact(0.05); }}>🧊 Low Activity</button>
              <button className="btn-ghost" onClick={() => setShowHackathonMode(true)}>🔄 Restart Pitch</button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdminController;
