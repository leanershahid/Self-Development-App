export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function showNotification(title, body) {
  if (Notification.permission !== 'granted') return;
  new Notification(title, { body, tag: title });
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  return navigator.serviceWorker.register('/sw.js');
}