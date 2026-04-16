import React from 'react';
import { Wifi, Radio, TrendingUp as TrendUp, TrendingDown as TrendDown, Minus, AlertTriangle, Activity } from 'lucide-react';
import { formatRSSI } from '../services/signalTrackingService';

/**
 * SignalDashboard – shows real-time signal intelligence panel.
 */
const SignalDashboard = ({ 
  zoneSignalData, 
  crowdDigest, 
  alerts, 
  predictions, 
  realDevice, 
  isTracking 
}) => {
  if (!zoneSignalData || zoneSignalData.length === 0) return null;

  const TrendIcon = ({ trend }) => {
    if (trend === 'rising')  return <TrendUp size={10} style={{ color: '#ef4444' }} />;
    if (trend === 'falling') return <TrendDown size={10} style={{ color: '#10b981' }} />;
    return <Minus size={10} style={{ color: '#64748b' }} />;
  };

  return (
    <div className="panel-section signal-dashboard">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div className="panel-section-title" style={{ margin: 0 }}>
          <Radio size={12} /> Signal Intelligence
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 20,
            background: isTracking ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${isTracking ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: isTracking ? '#10b981' : '#ef4444',
              animation: isTracking ? 'pulse-soft 1.5s infinite' : 'none',
            }} />
            <span style={{ fontSize: '0.5rem', fontWeight: 800, color: isTracking ? '#10b981' : '#ef4444', textTransform: 'uppercase' }}>
              {isTracking ? 'Tracking' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Crowd Digest Bar */}
      {crowdDigest && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14,
        }}>
          <div style={{
            padding: '10px 12px', borderRadius: 12,
            background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)',
          }}>
            <div style={{ fontSize: '0.5rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
              Total Devices
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace" }}>
              {crowdDigest.totalDevices.toLocaleString()}
            </div>
          </div>
          <div style={{
            padding: '10px 12px', borderRadius: 12,
            background: `rgba(${crowdDigest.overallStatus === 'LOW' ? '16,185,129' : crowdDigest.overallStatus === 'MODERATE' ? '245,158,11' : '239,68,68'}, 0.06)`,
            border: `1px solid rgba(${crowdDigest.overallStatus === 'LOW' ? '16,185,129' : crowdDigest.overallStatus === 'MODERATE' ? '245,158,11' : '239,68,68'}, 0.15)`,
          }}>
            <div style={{ fontSize: '0.5rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
              Venue Status
            </div>
            <div style={{
              fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase',
              color: crowdDigest.overallStatus === 'LOW' ? '#10b981' : crowdDigest.overallStatus === 'MODERATE' ? '#f59e0b' : '#ef4444',
            }}>
              {crowdDigest.overallStatus}
            </div>
          </div>
        </div>
      )}

      {/* Zone Signal Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {zoneSignalData.map((zone) => {
          const rssiInfo = formatRSSI(zone.avgRSSI);
          const prediction = predictions?.[zone.towerId];
          const trend = prediction?.trend || 'stable';

          return (
            <div key={zone.towerId} style={{
              padding: '10px 12px', borderRadius: 12,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--glass-border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Wifi size={10} style={{ color: rssiInfo.color }} />
                  <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>{zone.towerName}</span>
                  <TrendIcon trend={trend} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.55rem', fontWeight: 700, color: rssiInfo.color }}>
                    {rssiInfo.label} ({zone.avgRSSI} dBm)
                  </span>
                  <span style={{ fontSize: '0.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {zone.deviceCount} devices
                  </span>
                </div>
                {prediction?.recommendation && (
                  <div style={{
                    marginTop: 4, fontSize: '0.5rem', fontWeight: 600,
                    color: prediction.urgency === 'high' ? '#ef4444' : prediction.urgency === 'medium' ? '#f59e0b' : '#64748b',
                    lineHeight: 1.3,
                  }}>
                    {prediction.recommendation}
                  </div>
                )}
              </div>

              {/* Density bar */}
              <div style={{ width: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace",
                  color: zone.signalDensity < 40 ? '#10b981' : zone.signalDensity < 70 ? '#f59e0b' : '#ef4444',
                }}>
                  {zone.signalDensity}%
                </span>
                <div style={{
                  width: '100%', height: 3, borderRadius: 2,
                  background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${zone.signalDensity}%`, height: '100%', borderRadius: 2,
                    background: zone.signalDensity < 40 ? '#10b981' : zone.signalDensity < 70 ? '#f59e0b' : '#ef4444',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Alerts */}
      {alerts && alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertTriangle size={10} /> Live Alerts
          </div>
          {alerts.slice(0, 3).map((alert, i) => (
            <div key={i} style={{
              padding: '8px 10px', borderRadius: 10, fontSize: '0.6rem', fontWeight: 600,
              background: alert.severity === 'critical' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
              border: `1px solid ${alert.severity === 'critical' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
              color: alert.severity === 'critical' ? '#ef4444' : '#f59e0b',
              lineHeight: 1.4,
            }}>
              {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Real Device Info */}
      {realDevice && (
        <div style={{
          marginTop: 12, padding: '8px 10px', borderRadius: 10,
          background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)',
        }}>
          <div style={{ fontSize: '0.5rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Activity size={9} /> Your Device
          </div>
          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
            {realDevice.lat?.toFixed(6)}, {realDevice.lng?.toFixed(6)} • ±{realDevice.accuracy}m
          </div>
        </div>
      )}
    </div>
  );
};

export default SignalDashboard;
