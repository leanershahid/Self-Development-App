import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { enablePushNotifications, disablePushNotifications, isPushEnabled } from '../utils/pushNotifications';

export default function NotificationSetup() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    isPushEnabled().then(setEnabled);
  }, []);

  const toggle = async () => {
    setLoading(true);
    
    if (enabled) {
      const result = await disablePushNotifications();
      if (result.success) {
        setEnabled(false);
      }
    } else {
      const result = await enablePushNotifications();
      if (result.success) {
        setEnabled(true);
      } else {
        alert(`Error: ${result.error}`);
      }
    }
    
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={enabled ? 'Disable background notifications' : 'Enable background notifications'}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 36, height: 36, borderRadius: 10, cursor: loading ? 'wait' : 'pointer',
        background: enabled ? 'rgba(217,70,239,0.15)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${enabled ? 'rgba(217,70,239,0.4)' : 'rgba(255,255,255,0.1)'}`,
        color: enabled ? '#d946ef' : '#64748b',
        transition: 'all 0.2s', flexShrink: 0,
        boxShadow: enabled ? '0 0 10px rgba(217,70,239,0.2)' : 'none',
      }}
    >
      {loading ? (
        <div style={{ 
          width: 14, height: 14, 
          border: '2px solid currentColor', 
          borderTopColor: 'transparent', 
          borderRadius: '50%', 
          animation: 'spin 0.6s linear infinite' 
        }} />
      ) : enabled ? (
        <Bell size={15} />
      ) : (
        <BellOff size={15} />
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}