import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send } from 'lucide-react';

const Chatbot = ({ 
  isChatOpen, 
  setIsChatOpen, 
  chatMessages, 
  inputValue, 
  setInputValue, 
  handleSendMessage, 
  chatEndRef 
}) => {
  return (
    <>
      <button className="chatbot-trigger" onClick={() => setIsChatOpen(true)} aria-label="Open AI Chat">
        <MessageSquare size={22} />
      </button>

      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="chatbot-overlay"
          >
            {/* Chat Header */}
            <div style={{ flexShrink: 0, padding: '14px 20px', background: 'var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white', animation: 'pulse-soft 2s infinite' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>VenueIQ AI</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {chatMessages.map((m) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: m.isBot ? 'flex-start' : 'flex-end' }}>
                  <div style={{
                    maxWidth: '82%', padding: '10px 14px', borderRadius: 16,
                    background: m.isBot ? 'rgba(255,255,255,0.05)' : 'var(--primary)',
                    borderTopLeftRadius: m.isBot ? 4 : 16,
                    borderTopRightRadius: m.isBot ? 16 : 4,
                    fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.5,
                    border: m.isBot ? '1px solid var(--glass-border)' : 'none',
                  }}>
                    {m.text}
                    {m.buttons && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                        {m.buttons.map((b) => (
                          <button key={b} className="btn-ghost" style={{ fontSize: '0.6rem', padding: '5px 10px' }}>{b}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div style={{ flexShrink: 0, padding: '12px 16px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: 10, background: 'var(--surface)' }}>
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about wait times, routes, groups..."
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 14, padding: '10px 16px', color: 'white', fontSize: '0.75rem', outline: 'none' }}
              />
              <button className="btn-primary" onClick={handleSendMessage} style={{ padding: '10px 12px', borderRadius: 14, display: 'flex' }}>
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
