import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardBody, EmptyState, SkeletonCard } from './ui';
import { supabase } from '../supabase';
import { buildDayMap, dayPct } from '../utils/todoStats';

// A quick "last 7 days" completion-rate glance on the home page, using the same
// canonical buildDayMap()/dayPct() helpers the Progress tabs use, so this number
// always agrees with Performance/Life Success/Weekly Report rather than
// introducing yet another independent calculation.
export default function HomeTrendCard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      const { data: todos } = await supabase
        .from('ToDo')
        .select('created_at, completed, active')
        .gte('created_at', sevenDaysAgo.toISOString());
      if (cancelled) return;

      const dayMap = buildDayMap(todos);
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        days.push({
          label: d.toLocaleDateString('en-US', { weekday: 'short' }),
          rate: Math.round(dayPct(dayMap[key])),
        });
      }
      setData(days);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!data) return <SkeletonCard />;

  const hasAnyData = data.some((d) => d.rate > 0);

  return (
    <Card>
      <CardHeader title="7-Day Trend" subtitle="Task completion this week" icon={<TrendingUp size={18} />} />
      <CardBody>
        {hasAnyData ? (
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="homeTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" stroke="rgba(245,247,250,0.12)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Completion']}
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#homeTrendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState icon={<TrendingUp size={18} />} title="No activity yet this week" message="Complete a few tasks to see your trend." />
        )}
      </CardBody>
    </Card>
  );
}
