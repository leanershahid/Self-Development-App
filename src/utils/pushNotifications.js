import { supabase } from '../supabase';

// Public VAPID key - you'll need to generate your own
const VAPID_PUBLIC_KEY = 'BNrODkDt3H2J88zld58M2P1mTHwGbpPFOQxsD55rg8pihHNCqV5bXoBFKU-9BgPrcSbJQCHJZ-5cd9Pk8Hxq6KA';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  return navigator.serviceWorker.register('/sw.js');
}

export async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  try {
    return await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  } catch (err) {
    throw new Error(`PushManager.subscribe failed: ${err.name} - ${err.message}`);
  }
}

export async function enablePushNotifications() {
  if (!('Notification' in window)) {
    return { success: false, error: 'DEBUG: Notification API not supported' };
  }
  if (!('serviceWorker' in navigator)) {
    return { success: false, error: 'DEBUG: ServiceWorker not supported' };
  }
  if (!('PushManager' in window)) {
    return { success: false, error: 'DEBUG: PushManager not supported' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { success: false, error: `DEBUG: Permission = ${permission}` };
  }

  try {
    const reg = await registerServiceWorker();
    if (!reg) return { success: false, error: 'DEBUG: SW registration failed' };

    const subscription = await subscribeToPush();
    if (!subscription) return { success: false, error: 'DEBUG: Subscription is null' };

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        endpoint: subscription.endpoint,
        subscription: JSON.stringify(subscription)
      }, { onConflict: 'endpoint' });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return { success: false, error: `DEBUG: ${error.message}` };
  }
}

export async function disablePushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', subscription.endpoint);
      
      await subscription.unsubscribe();
    }
    
    return { success: true };
  } catch (error) {
    console.error('Unsubscribe failed:', error);
    return { success: false, error: error.message };
  }
}

export function showLocalNotification(title, body) {
  if (Notification.permission !== 'granted') return;
  navigator.serviceWorker.ready.then((reg) => {
    reg.showNotification(title, { body, icon: '/icon-192.png', tag: 'local-reminder' });
  });
}

export async function isPushEnabled() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  if (Notification.permission !== 'granted') return false;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}