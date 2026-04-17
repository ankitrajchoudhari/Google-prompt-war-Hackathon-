import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ShoppingBag, ShieldAlert, Heart, X, Zap } from 'lucide-react';

const NotificationCard = ({ n, onRemove }) => {
  const [redeemed, setRedeemed] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');

  const handleRedeem = () => {
    if (redeemed) return;
    setRedeemed(true);
    setRedeemCode(`VQ-${Math.floor(Math.random() * 8999) + 1000}`); // Generates 4 digit code
    // Remove after 4 seconds to read the code
    setTimeout(() => {
      onRemove(n.id);
    }, 4000);
  };

  return (
    <motion.div
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
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: 3,
        background: redeemed ? '#10b981' : 'var(--primary)',
        width: '100%',
        animation: redeemed ? 'none' : 'linear-progress 8s linear forwards',
      }} />

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: redeemed ? '#10b981' : 'var(--primary)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.3s ease',
        }}>
          {n.type === 'FLASH_OFFER' ? <Zap size={16} color="white" fill="white" /> : <ShoppingBag size={16} color="white" />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 900, marginBottom: 4 }}>{n.title}</div>
            <X size={12} style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => onRemove(n.id)} />
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 8 }}>
            {n.message}
          </div>
          <button 
            className="btn-primary" 
            aria-label={`Redeem offer: ${n.title}`}
            style={{ 
              padding: '6px 14px', fontSize: '0.55rem', borderRadius: 8,
              background: redeemed ? '#10b981' : 'var(--primary)', border: 'none', color: 'white',
              fontWeight: 800, cursor: redeemed ? 'default' : 'pointer',
              transition: 'background 0.3s ease',
            }}
            onClick={handleRedeem}
          >
            {redeemed ? `REDEEMED: ${redeemCode}` : 'REDEEM OFFER'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const NotificationCenter = React.memo(({ opportunities, emergencyMode, sentiment }) => {
  const [visibleNotifications, setVisibleNotifications] = useState([]);
  const seenIds = useRef(new Set());

  // Handle incoming opportunities/deals
  useEffect(() => {
    if (opportunities && opportunities.length > 0) {
      const latest = opportunities[opportunities.length - 1];
      
      // Prevent duplicates and re-adding dismissed ones
      if (!seenIds.current.has(latest.id)) {
        seenIds.current.add(latest.id);
        const newNotif = {
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

  const removeNotif = useCallback((id) => {
    setVisibleNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <div 
      role="region" 
      aria-live="polite" 
      aria-atomic="false"
      aria-label="Notification Center"
      style={{
        position: 'fixed',
        top: 80,
        right: 24,
        width: 380,
        zIndex: 9999,
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
            <div role="alert" aria-live="assertive">
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
              alignSelf: 'flex-end',
              gap: 20,
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
          <NotificationCard key={n.id} n={n} onRemove={removeNotif} />
        ))}
      </AnimatePresence>
    </div>
  );
});

export default NotificationCenter;
