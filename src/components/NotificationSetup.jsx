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
      className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-lg border transition-colors duration-200 ${
        loading ? 'cursor-wait' : 'cursor-pointer'
      } ${
        enabled
          ? 'bg-accent/10 border-accent/30 text-accent'
          : 'bg-transparent border-transparent text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'
      }`}
    >
      {loading ? (
        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : enabled ? (
        <Bell size={16} />
      ) : (
        <BellOff size={16} />
      )}
    </button>
  );
}