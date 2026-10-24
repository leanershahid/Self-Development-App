import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { ClipboardList, TrendingUp, Award, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardBody, Badge, Button, KpiCard, Table, SkeletonCard } from './ui';

const supabase = createClient(
  'https://qwjujuvtfqahapohhfzs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3anVqdXZ0ZnFhaGFwb2hoZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTEyMzYsImV4cCI6MjEwMzY2NzIzNn0.CEnppxWU5d4jKGtjlB6u3U2V_3hjgqUxzoU1KRx7fZI'
);

// Maps letter grade -> design-system tone. These are purely presentational
// (which color/badge-variant a grade renders as) and do not affect the
// underlying completionPct calculation.
const TONE_TEXT = {
  success: 'text-accent',
  info: 'text-info',
  primary: 'text-primary',
  warning: 'text-warning',
  danger: 'text-danger',
};
const TONE_BG = {
  success: 'bg-accent',
  info: 'bg-info',
  primary: 'bg-primary',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

function getGrade(pct) {
  if (pct >= 95) return { grade: 'S', label: 'Legendary', tone: 'success' };
  if (pct >= 85) return { grade: 'A+', label: 'Excellent', tone: 'success' };
  if (pct >= 75) return { grade: 'A', label: 'Great', tone: 'success' };
  if (pct >= 65) return { grade: 'B+', label: 'Good', tone: 'info' };
  if (pct >= 55) return { grade: 'B', label: 'Above Avg', tone: 'primary' };
  if (pct >= 45) return { grade: 'C', label: 'Average', tone: 'warning' };
  if (pct >= 35) return { grade: 'D', label: 'Below Avg', tone: 'danger' };
  return { grade: 'F', label: 'Failed', tone: 'danger' };
}

function getWeekRange(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

export default function WeeklyReportCard() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [report, setReport]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [allWeeks, setAllWeeks]     = useState([]);

  useEffect(() => { loadReport(weekOffset); }, [weekOffset]);
  useEffect(() => { loadAllWeeks(); }, []);

  const loadReport = async (offset) => {
    setLoading(true);
    const { start, end } = getWeekRange(offset);
    const { data: todos } = await supabase.from('ToDo').select('*')
      .gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
    const { data: moods } = await supabase.from('mood_tracker').select('*')
      .gte('date', start.toISOString().split('T')[0]).lte('date', end.toISOString().split('T')[0]);

    const active = (todos || []).filter(t => t.active);
    const completed = active.filter(t => t.completed).length;
    const total = active.length;
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const avgMood = moods?.length ? (moods.reduce((s, m) => s + m.mood, 0) / moods.length) : 0;
    const daysActive = new Set(active.map(t => t.created_at.split('T')[0])).size;
    const consistency = Math.round((daysActive / 7) * 100);

    // per-day breakdown
    const dayMap = {};
    active.forEach(t => {
      const d = t.created_at.split('T')[0];
      if (!dayMap[d]) dayMap[d] = { total: 0, done: 0 };
      dayMap[d].total++;
      if (t.completed) dayMap[d].done++;
    });
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const radarData = days.map((day, i) => {
      const date = new Date(start); date.setDate(start.getDate() + i);
      const key = date.toISOString().split('T')[0];
      const d = dayMap[key];
      return { day, rate: d ? Math.round((d.done / d.total) * 100) : 0 };
    });

    setReport({ completionPct, completed, total, avgMood, consistency, daysActive, radarData, start, end });
    setLoading(false);
  };

  const loadAllWeeks = async () => {
    const { data } = await supabase.from('ToDo').select('created_at, completed, active').order('created_at');
    if (!data?.length) return;
    const first = new Date(data[0].created_at);
    const now = new Date();
    const totalWeeks = Math.ceil((now - first) / (7 * 86400000));
    const weeks = [];
    for (let i = 0; i < Math.min(totalWeeks, 12); i++) {
      const { start, end } = getWeekRange(-i);
      const active = data.filter(t => t.active && new Date(t.created_at) >= start && new Date(t.created_at) <= end);
      const done = active.filter(t => t.completed).length;
      weeks.push({ offset: -i, pct: active.length ? Math.round((done / active.length) * 100) : 0, label: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
    }
    setAllWeeks(weeks.reverse());
  };

  const { start, end } = getWeekRange(weekOffset);
  const dateLabel = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const historyColumns = [
    {
      key: 'grade',
      header: 'Grade',
      width: '70px',
      render: (row) => {
        const g = getGrade(row.pct);
        return <Badge variant={g.tone}>{g.grade}</Badge>;
      },
    },
    {
      key: 'pct',
      header: 'Completion',
      render: (row) => {
        const g = getGrade(row.pct);
        return (
          <div className="flex items-center gap-3 min-w-[140px]">
            <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-hover)] overflow-hidden">
              <div className={`h-full rounded-full ${TONE_BG[g.tone]}`} style={{ width: `${row.pct}%` }} />
            </div>
            <span className="text-xs font-medium text-[var(--text-muted)] w-9 text-right">{row.pct}%</span>
          </div>
        );
      },
    },
    {
      key: 'label',
      header: 'Week Of',
      width: '110px',
      render: (row) => <span className="text-xs text-[var(--text-muted)]">{row.label}</span>,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <motion.div initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 bg-primary/10 text-primary">
          <ClipboardList size={28} />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Weekly Report Card</h1>
        <p className="text-sm text-[var(--text-muted)]">Auto-generated every week based on your activity.</p>
      </motion.div>

      {/* Week Navigator */}
      <Card>
        <CardBody className="flex items-center justify-between gap-4">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={16} />} onClick={() => setWeekOffset(w => w - 1)}>
            Prev
          </Button>
          <div className="text-center">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              {weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : `${Math.abs(weekOffset)} weeks ago`}
            </p>
            <p className="text-sm font-semibold text-[var(--text)] mt-0.5">{dateLabel}</p>
          </div>
          <Button variant="ghost" size="sm" disabled={weekOffset === 0} onClick={() => setWeekOffset(w => Math.min(0, w + 1))}>
            Next <ChevronRight size={16} />
          </Button>
        </CardBody>
      </Card>

      {loading ? (
        <div className="flex flex-col gap-6">
          <SkeletonCard />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
          <SkeletonCard />
        </div>
      ) : report && (
        <>
          {/* Grade Card */}
          {(() => {
            const g = getGrade(report.completionPct);
            return (
              <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}>
                <Card className="text-center">
                  <CardBody className="py-8">
                    <p className="text-xs font-medium tracking-widest uppercase mb-2 text-[var(--text-muted)]">Weekly Grade</p>
                    <div className={`text-8xl font-black mb-3 ${TONE_TEXT[g.tone]}`}>{g.grade}</div>
                    <Badge variant={g.tone} className="mb-4 px-4 py-1 text-sm">{g.label}</Badge>
                    <div className={`text-3xl font-semibold ${TONE_TEXT[g.tone]}`}>{report.completionPct}%</div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{report.completed} / {report.total} tasks completed</p>
                  </CardBody>
                </Card>
              </motion.div>
            );
          })()}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Completion', value: `${report.completionPct}%`, icon: <ClipboardList size={18} />, tone: 'primary' },
              { label: 'Consistency', value: `${report.consistency}%`, icon: <TrendingUp size={18} />, tone: 'accent' },
              { label: 'Avg Mood', value: report.avgMood ? `${report.avgMood.toFixed(1)}/5` : 'N/A', icon: <Award size={18} />, tone: 'warning' },
              { label: 'Active Days', value: `${report.daysActive}/7`, icon: <Calendar size={18} />, tone: 'primary' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 + i * 0.05 }}>
                <KpiCard label={s.label} value={s.value} icon={s.icon} tone={s.tone} />
              </motion.div>
            ))}
          </div>

          {/* Radar Chart */}
          <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader title="Daily Performance Radar" icon={<TrendingUp size={16} />} />
              <CardBody>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={report.radarData}>
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <Radar dataKey="rate" stroke="#10B981" fill="#10B981" fillOpacity={0.25} strokeWidth={2}
                        dot={{ fill: '#10B981', r: 3 }} activeDot={{ r: 5, fill: '#10B981', stroke: 'var(--surface)' }} />
                      <RechartsTooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 12 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* All Weeks History */}
          {allWeeks.length > 0 && (
            <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
              <Card>
                <CardHeader title="Grade History" icon={<Calendar size={16} />} />
                <CardBody>
                  <Table
                    columns={historyColumns}
                    data={allWeeks}
                    rowKey={(row) => row.offset}
                    pageSize={0}
                    onRowClick={(row) => setWeekOffset(row.offset)}
                  />
                </CardBody>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
