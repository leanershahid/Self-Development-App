self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const tag = data.tag || 'todo-reminder';

  const options = {
    body: data.body || 'You have pending tasks',
    icon: '/icon-512.png',
    badge: '/icon-192.png',
    tag,
    renotify: true,
    requireInteraction: tag === 'overdue-friends',
    silent: false,
    vibrate: [100, 50, 100],
    timestamp: Date.now(),
    actions: data.actions || getActions(tag),
    data: { url: data.url || '/' },
  };

  // Add image banner if provided
  if (data.image) options.image = data.image;

  const defaultTitles = {
    'morning-reminder': '🌅 Rise & Conquer',
    'night-reminder':   '🌙 Day Wrap-Up',
    'overdue-friends':  '👥 Stay Connected',
    'todo-reminder':    '⚡ Focus Time',
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || defaultTitles[tag] || '📋 Task Reminder',
      options
    )
  );
});

function getActions(tag) {
  if (tag === 'morning-reminder') return [
    { action: 'open',    title: '🚀 Let\'s Go' },
    { action: 'dismiss', title: '😴 5 More Mins' },
  ];
  if (tag === 'night-reminder') return [
    { action: 'open',    title: '📊 See Summary' },
    { action: 'dismiss', title: '🌙 Good Night' },
  ];
  if (tag === 'overdue-friends') return [
    { action: 'open',    title: '💬 Reach Out' },
    { action: 'dismiss', title: '🔕 Not Now' },
  ];
  return [
    { action: 'open',    title: '✅ View Tasks' },
    { action: 'dismiss', title: '⏰ Remind Later' },
  ];
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes(url));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});