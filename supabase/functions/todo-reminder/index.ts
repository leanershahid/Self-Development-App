import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

webpush.setVapidDetails(
  'mailto:admin@shahidkm.app',
  'BNrODkDt3H2J88zld58M2P1mTHwGbpPFOQxsD55rg8pihHNCqV5bXoBFKU-9BgPrcSbJQCHJZ-5cd9Pk8Hxq6KA',
  '2x4MAnGU2IokfigacBlV6XyjhIYKENMJklHxEFI3wUQ'
);

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const type = body.type || 'reminder';

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, subscription');

  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: 'No subscribers' }));
  }

  let payload: string;

  if (type === 'morning') {
    payload = JSON.stringify({
      title: '🌅 Good Morning!',
      body: 'Start your day — add your tasks for today.',
      tag: 'morning-reminder',
    });
  } else if (type === 'night') {
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: todos } = await supabase
      .from('ToDo')
      .select('completed')
      .eq('active', true)
      .gte('created_at', `${todayStr}T00:00:00`)
      .lte('created_at', `${todayStr}T23:59:59`);

    const done = (todos ?? []).filter((t) => t.completed).length;
    const pending = (todos ?? []).filter((t) => !t.completed).length;

    payload = JSON.stringify({
      title: '🌙 Evening Check-in',
      body: pending > 0
        ? `${done} done, ${pending} still pending. Keep going!`
        : '🎉 All tasks completed today. Amazing!',
      tag: 'night-reminder',
    });
  } else {
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: todos, error } = await supabase
      .from('ToDo')
      .select('id, title')
      .eq('completed', false)
      .eq('active', true)
      .gte('created_at', `${todayStr}T00:00:00`)
      .lte('created_at', `${todayStr}T23:59:59`);

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    if (!todos || todos.length === 0) {
      payload = JSON.stringify({
        title: '📝 No tasks yet today!',
        body: 'Open the app and add your tasks for today.',
        tag: 'no-todos-reminder',
        renotify: true,
      });
    } else if (todos.filter(t => !t.completed).length === 0) {
      payload = JSON.stringify({
        title: '🎉 All Tasks Completed!',
        body: `Amazing! You crushed all ${todos.length} tasks today. Keep it up!`,
        tag: 'all-done',
        renotify: true,
      });
    } else {
      const todo = todos[Math.floor(Math.random() * todos.length)];
      payload = JSON.stringify({
        title: `⚡ ${todos.length} task${todos.length > 1 ? 's' : ''} pending`,
        body: todo.title,
        tag: 'todo-reminder',
        renotify: true,
      });
    }
  }

  let sent = 0;
  const staleIds: string[] = [];

  await Promise.all(
    subs.map(async (row) => {
      try {
        await webpush.sendNotification(JSON.parse(row.subscription), payload);
        sent++;
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) staleIds.push(row.id);
      }
    })
  );

  if (staleIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', staleIds);
  }

  return new Response(
    JSON.stringify({ sent, cleaned: staleIds.length }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
