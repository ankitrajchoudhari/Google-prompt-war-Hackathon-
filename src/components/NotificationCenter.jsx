import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ShoppingBag, ShieldAlert, Heart, X, Zap } from 'lucide-react';

const NotificationCenter = ({ opportunities, emergencyMode, sentiment }) => {
  const [visibleNotifications, setVisibleNotifications] = useState([]);

  // Handle incoming opportunities/deals
  useEffect(() => {
    if (opportunities && opportunities.length > 0) {
      const latest = opportunities[opportunities.length - 1];
      
      // Prevent duplicates
      if (!visibleNotifications.some(n => n.id === latest.expiry)) {
        const newNotif = {
          id: latest.expiry,
          ...latest,
          timestamp: Date.now(),
        };
        setVisibleNotifications(prev => [newNotif, ...prev].slice(0, 3));
        
        // Auto-dismiss after 8 seconds
        setTimeout(() => {
          setVisibleNotifications(prev => prev.filter(n => n.id !== newNotif.id));
        }, 8000);
      }
    }
  }, [opportunities]);

  const removeNotif = (id) => {
    setVisibleNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 80,
      right: 24,
      width: 320,
      zIndex: 1000,
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <AnimatePresence>
        {/* Emergency Banner */}
        {emergencyMode && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            style={{
              padding: '16px 20px',
              background: '#ef4444',
              borderRadius: 16,
              color: 'white',
              boxShadow: '0 0 30px rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              pointerEvents: 'auto',
              border: '2px solid white',
            }}
          >
            <ShieldAlert size={28} className="pulse-fast" />
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Emergency Mode
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.9 }}>
                Follow green arrows to safest exits.
              </div>
            </div>
          </motion.div>
        )}

        {/* Sentiment Display */}
        {sentiment && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{
              padding: '10px 16px',
              background: 'rgba(11, 15, 25, 0.8)',
              backdropFilter: 'blur(12px)',
              borderRadius: 12,
              border: `1px solid ${sentiment.color}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pointerEvents: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Heart size={14} fill={sentiment.color} stroke={sentiment.color} />
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Crowd Pulse
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: sentiment.color, textTransform: 'uppercase' }}>
              {sentiment.label}
            </div>
          </motion.div>
        )}

        {/* Dynamic Flash Notifications */}
        {visibleNotifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ x: 350, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 350, opacity: 0 }}
            whileHover={{ scale: 1.02 }}
            style={{
              padding: '16px',
              background: 'rgba(99, 102, 241, 0.1)',
              backdropFilter: 'blur(16px)',
              borderRadius: 20,
              border: '1px solid rgba(99, 102, 241, 0.3)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              pointerEvents: 'auto',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Animated background bar */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: 3,
              background: 'var(--primary)',
              width: '100%',
              animation: 'linear-progress 8s linear forwards',
            }} />

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'var(--primary)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {n.type === 'FLASH_OFFER' ? <Zap size={16} color="white" fill="white" /> : <ShoppingBag size={16} color="white" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 900, marginBottom: 4 }}>{n.title}</div>
                  <X size={12} style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => removeNotif(n.id)} />
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 8 }}>
                  {n.message}
                </div>
                <button 
                  className="btn-primary" 
                  style={{ 
                    padding: '6px 14px', fontSize: '0.55rem', borderRadius: 8,
                    background: 'var(--primary)', border: 'none', color: 'white',
                    fontWeight: 800, cursor: 'pointer',
                  }}
                  onClick={() => removeNotif(n.id)}
                >
                  REDEEM OFFER
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
