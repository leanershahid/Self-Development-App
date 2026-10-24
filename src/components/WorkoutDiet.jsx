import React, { useState, useEffect, useRef } from 'react';
import {
  Dumbbell, Sun, Coffee, Utensils, Apple, Moon, Droplets, BedDouble,
  TrendingUp, ChevronDown, ChevronUp, Check, LayoutList, Clock, Scale, Plus, Eye, Timer,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../supabase';
import {
  Card, CardHeader, CardBody, Badge, KpiCard, Button, IconButton, Input, Tabs, Table,
  EmptyState, SkeletonCard, cn,
} from './ui';

const TODAY = new Date().toISOString().split('T')[0];

// hour range when each meal is "current"
const MEAL_HOURS = {
  'Pre-Workout':   [5, 8],
  'Post-Workout':  [8, 10],
  'Breakfast':     [9, 12],
  'Lunch':         [12, 16],
  'Evening Snack': [16, 19],
  'Dinner':        [19, 22],
};

const MEALS_ALL = [
  {
    time: 'Pre-Workout',
    subtitle: 'Quick energy boost · ~1g protein',
    icon: Sun,
    color: '#facc15',
    items: ['1 banana', 'Black coffee/tea'],
    tip: 'Simple fuel for your workout session',
    workoutOnly: true,
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&q=80',
  },
  {
    time: 'Post-Workout',
    subtitle: 'Recovery meal · ~26g protein',
    icon: Dumbbell,
    color: '#4ade80',
    items: ['3 whole eggs', '2 bread slices', '1 tbsp peanut butter'],
    tip: 'Strong start: protein + calories',
    workoutOnly: true,
    image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&q=80',
  },
  {
    time: 'Breakfast',
    subtitle: 'Choose one · ~8–10g protein',
    icon: Coffee,
    color: '#fb923c',
    items: [
      '2 dosa + sambar',
      'OR 3 idli + sambar',
      'OR Oats',
    ],
    tip: 'Pick one option each morning',
    workoutOnly: false,
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80',
  },
  {
    time: 'Lunch',
    subtitle: 'Biggest meal · ~30g protein',
    icon: Utensils,
    color: '#22d3ee',
    items: [
      'Rice',
      '50g dry soya chunks curry',
      'Dal/vegetables',
    ],
    tip: 'Soya chunks are your main protein source here',
    workoutOnly: false,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
  },
  {
    time: 'Evening Snack',
    subtitle: 'Light snack · ~8–10g protein',
    icon: Apple,
    color: '#f97316',
    items: [
      'Roasted peanuts OR kadala',
      'Banana',
    ],
    tip: 'Keeps energy up before dinner',
    workoutOnly: false,
    image: 'https://images.unsplash.com/photo-1536591375667-f9a9a8a3e0e5?w=600&q=80',
  },
  {
    time: 'Dinner',
    subtitle: 'Evening fuel · ~18–22g protein',
    icon: Moon,
    color: '#818cf8',
    items: [
      '2–3 chapati OR medium rice',
      '2 eggs OR fish/chicken',
    ],
    tip: 'Finish strong with quality protein',
    workoutOnly: false,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80',
  },
];

const RULES = [
  { icon: TrendingUp, label: 'Protein Target', value: '1.6–2g per kg body weight' },
  { icon: Droplets,   label: 'Water Daily',    value: '3 litres minimum' },
  { icon: BedDouble,  label: 'Sleep',          value: '7–8 hours every night' },
  { icon: TrendingUp, label: 'Weight Gain',    value: '0.25–0.5 kg per week' },
];

const TIMELINE_TIMES = [
  { time: 'Pre-Workout',   label: '6:00 AM' },
  { time: 'Post-Workout',  label: '8:00 AM' },
  { time: 'Breakfast',     label: '9:30 AM' },
  { time: 'Lunch',         label: '1:00 PM' },
  { time: 'Evening Snack', label: '5:00 PM' },
  { time: 'Dinner',        label: '8:00 PM' },
];

function getCurrentMeal() {
  const h = new Date().getHours();
  for (const [name, [start, end]] of Object.entries(MEAL_HOURS)) {
    if (h >= start && h < end) return name;
  }
  return null;
}

// ── Meal Card ──────────────────────────────────────────────────────────────
function MealCard({ meal, checked, onCheck, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const { time, subtitle, items, tip, image } = meal;

  return (
    <Card className={checked ? 'border-accent/40' : ''}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-4 p-4 text-left">
        <button
          onClick={(e) => { e.stopPropagation(); onCheck(time); }}
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors',
            checked ? 'bg-accent/15 border-accent text-accent' : 'border-[var(--border)] text-transparent hover:border-primary/40'
          )}
        >
          <Check size={14} />
        </button>

        <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-[var(--border)]">
          <img src={image} alt={time} className="w-full h-full object-cover" loading="lazy" />
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn('font-semibold text-sm', checked ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]')}>{time}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {checked && <Badge variant="success">Done</Badge>}
          {open ? <ChevronUp size={16} className="text-[var(--text-muted)]" /> : <ChevronDown size={16} className="text-[var(--text-muted)]" />}
        </div>
      </button>

      {open && (
        <CardBody className="pt-0 border-t border-[var(--border)]">
          <div className="rounded-lg overflow-hidden mb-4 bg-[var(--bg)]">
            <img src={image} alt={time} className="w-full object-contain max-h-64" loading="lazy" />
          </div>
          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-[var(--text)]">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-xs text-primary">{tip}</p>
          </div>
        </CardBody>
      )}
    </Card>
  );
}

// ── Timeline View ──────────────────────────────────────────────────────────
function TimelineView({ meals, checked, onCheck }) {
  const currentMeal = getCurrentMeal();
  return (
    <div className="flex flex-col gap-3">
      {meals.map((meal) => {
        const tl = TIMELINE_TIMES.find((t) => t.time === meal.time);
        const isCurrent = meal.time === currentMeal;
        const isChecked = checked[meal.time];
        return (
          <Card key={meal.time} className={cn(isCurrent && 'border-primary/40', isChecked && 'border-accent/40')}>
            <CardBody className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-[var(--text-muted)]">{tl?.label}</span>
                    {isCurrent && <Badge variant="info">Current</Badge>}
                  </div>
                  <p className={cn('font-semibold text-sm', isChecked ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]')}>{meal.time}</p>
                </div>
                <button
                  onClick={() => onCheck(meal.time)}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors',
                    isChecked ? 'bg-accent/15 border-accent text-accent' : 'border-[var(--border)] text-transparent hover:border-primary/40'
                  )}
                >
                  <Check size={14} />
                </button>
              </div>

              <div className="space-y-1.5">
                {meal.items.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-[var(--text)]">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs text-primary">{meal.tip}</p>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}

// ── Weight Tracker ─────────────────────────────────────────────────────────
function WeightTracker({ bodyWeight }) {
  const [logs, setLogs] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    const { data } = await supabase
      .from('weight_logs')
      .select('*')
      .order('date', { ascending: true })
      .limit(30);
    setLogs(data || []);
    setLogsLoading(false);
  };

  const logWeight = async () => {
    const val = parseFloat(input);
    if (!val || val < 20 || val > 300) return;
    setLoading(true);
    const existing = logs.find(l => l.date === TODAY);
    if (existing) {
      await supabase.from('weight_logs').update({ weight: val }).eq('id', existing.id);
    } else {
      await supabase.from('weight_logs').insert({ date: TODAY, weight: val });
    }
    setInput('');
    await loadLogs();
    setLoading(false);
  };

  const latest = logs[logs.length - 1]?.weight;
  const first  = logs[0]?.weight;
  const gained = latest && first ? (latest - first).toFixed(1) : null;
  const chartData = logs.map(l => ({ date: l.date.slice(5), kg: l.weight }));
  const recentLogs = [...logs].reverse();

  return (
    <Card>
      <CardHeader icon={<Scale size={18} />} title="Body Weight Tracker" />
      <CardBody className="flex flex-col gap-4">
        {logsLoading ? (
          <SkeletonCard />
        ) : !latest ? (
          <EmptyState
            icon={<Scale size={20} />}
            title="No weight logged yet"
            message="Log today's weight below to start tracking your progress."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <KpiCard label="Current" value={latest} unit="kg" tone="primary" />
              <KpiCard
                label="Total Gained"
                value={gained !== null ? `${gained > 0 ? '+' : ''}${gained}` : '—'}
                unit="kg"
                tone={gained > 0 ? 'accent' : 'danger'}
              />
              <KpiCard label="Goal / week" value="+0.25–0.5" unit="kg" tone="warning" />
            </div>

            {chartData.length > 1 && (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="rgba(245,247,250,0.12)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8b95a5' }} axisLine={false} tickLine={false} />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#8b95a5' }} axisLine={false} tickLine={false} width={34} />
                    <Tooltip
                      contentStyle={{ background: '#0d1117', border: '1px solid rgba(245,247,250,0.12)', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: '#64748b' }}
                      itemStyle={{ color: '#10b981' }}
                    />
                    <Line type="monotone" dataKey="kg" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <Table
              columns={[
                { key: 'date', header: 'Date' },
                { key: 'weight', header: 'Weight (kg)' },
              ]}
              data={recentLogs}
              rowKey={(row) => row.id}
              pageSize={5}
            />
          </>
        )}

        <div className="flex gap-2">
          <Input
            type="number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && logWeight()}
            placeholder="Today's weight (kg)"
            className="flex-1"
          />
          <Button onClick={logWeight} disabled={loading} loading={loading} icon={<Plus size={14} />}>
            Log
          </Button>
        </div>

        {bodyWeight > 0 && (
          <p className="text-xs text-accent text-center">
            Your protein target: {Math.round(bodyWeight * 1.6)}–{Math.round(bodyWeight * 2)}g / day
          </p>
        )}
      </CardBody>
    </Card>
  );
}

// ── Eye Health Data ────────────────────────────────────────────────────────
const EYE_HABITS = [
  { id: 'rule_20_20_20', emoji: '🖥️', title: '20-20-20 Rule',
    desc: 'Every 20 min → look 20 feet away for 20 sec. Most important habit to slow power increase.',
    tips: ["Keep phone/laptop at arm's distance", "Don't use phone in dark rooms", 'Reduce brightness at night'] },
  { id: 'lighting', emoji: '💡', title: 'Proper Lighting',
    desc: 'Study/work in a well-lit room. Avoid glare directly into eyes.',
    tips: ["Don't sit too close to screens or TV", 'No screen use in pitch dark'] },
  { id: 'glasses', emoji: '👓', title: 'Wear Glasses Correctly',
    desc: 'If prescribed, wear them when needed — driving, classes, screens.',
    tips: ['Not wearing them causes eye strain and headaches'] },
  { id: 'diet', emoji: '🥕', title: 'Eat for Eye Support',
    desc: 'Include daily: carrot, spinach/moringa, eggs, fish, almonds, walnuts, banana, orange.',
    tips: ['These support eye health and reduce stress damage'] },
  { id: 'sleep', emoji: '😴', title: 'Sleep 7–8 Hours',
    desc: 'Poor sleep = more blur + eye fatigue.',
    tips: ['Minimum 7–8 hours every night'] },
  { id: 'relaxation', emoji: '🌿', title: 'Eye Relaxation',
    desc: 'Palming: warm hands over closed eyes. Focus change: near → far object.',
    tips: ['Helps reduce strain and comfort eyes'] },
  { id: 'outdoor', emoji: '🏃', title: 'Outdoor Time',
    desc: 'Spend 30–60 mins outside daily.',
    tips: ['Proven to help slow worsening, especially for myopia'] },
];

const EYE_AVOID = [
  'Using phone lying down for long time',
  'Constant scrolling without breaks',
  'Believing "7-day eyesight cure" tricks',
];

// ── 20-20-20 Timer ─────────────────────────────────────────────────────────
function EyeTimer() {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState('work');
  const [secs, setSecs] = useState(20 * 60);
  const ref = useRef(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => {
        setSecs(s => {
          if (s <= 1) {
            setPhase(p => {
              const next = p === 'work' ? 'break' : 'work';
              setSecs(next === 'work' ? 20 * 60 : 20);
              return next;
            });
            return s;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [running]);

  const reset = () => { setRunning(false); setPhase('work'); setSecs(20 * 60); };
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  const total = phase === 'work' ? 20 * 60 : 20;
  const pct = ((total - secs) / total) * 100;
  const color = phase === 'work' ? '#1E3A5F' : '#10B981';

  return (
    <Card>
      <CardHeader
        icon={<Timer size={18} />}
        title="20-20-20 Timer"
        action={<Badge variant={phase === 'work' ? 'primary' : 'success'}>{phase === 'work' ? 'Screen Time' : 'Look Away'}</Badge>}
      />
      <CardBody className="flex flex-col items-center gap-4">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="var(--border)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="44" fill="none" stroke={color} strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - pct / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-[var(--text)]">{mm}:{ss}</span>
            <span className="text-[10px] text-[var(--text-muted)] uppercase">{phase === 'work' ? 'until break' : 'look away'}</span>
          </div>
        </div>
        <div className="flex gap-2 w-full">
          <Button className="flex-1" variant={phase === 'work' ? 'primary' : 'success'} onClick={() => setRunning(r => !r)}>
            {running ? 'Pause' : 'Start'}
          </Button>
          <Button variant="secondary" onClick={reset}>Reset</Button>
        </div>
      </CardBody>
    </Card>
  );
}

// ── Eye Health Tab ──────────────────────────────────────────────────────────
function EyeHealthTab() {
  const [checked, setChecked] = useState({});
  const [logId, setLogId] = useState(null);

  useEffect(() => { loadLog(); }, []);

  const loadLog = async () => {
    const { data } = await supabase.from('eye_health_logs')
      .select('*').eq('date', TODAY).maybeSingle();
    if (data) { setChecked(data.habits || {}); setLogId(data.id); }
  };

  const toggle = async (id) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    if (logId) {
      await supabase.from('eye_health_logs').update({ habits: next }).eq('id', logId);
    } else {
      const { data } = await supabase.from('eye_health_logs')
        .insert({ date: TODAY, habits: next }).select().single();
      setLogId(data?.id);
    }
  };

  const done = Object.values(checked).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4">
      <KpiCard
        icon={<Eye size={18} />}
        label="Today's Eye Habits"
        value={`${done}/${EYE_HABITS.length}`}
        tone={done === EYE_HABITS.length ? 'accent' : 'primary'}
        progress={(done / EYE_HABITS.length) * 100}
        footer={done === EYE_HABITS.length ? <p className="text-xs text-accent">Perfect eye care day!</p> : null}
      />

      <EyeTimer />

      <div className="flex flex-col gap-3">
        {EYE_HABITS.map((h) => (
          <Card key={h.id} className={checked[h.id] ? 'border-accent/40' : ''}>
            <CardBody className="flex items-start gap-3">
              <button
                onClick={() => toggle(h.id)}
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border-2 transition-colors',
                  checked[h.id] ? 'bg-accent/15 border-accent text-accent' : 'border-[var(--border)] text-transparent hover:border-primary/40'
                )}
              >
                <Check size={12} />
              </button>
              <div className="flex-1">
                <p className={cn('font-semibold text-sm mb-1', checked[h.id] ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]')}>
                  {h.emoji} {h.title}
                </p>
                <p className="text-xs text-[var(--text-muted)] mb-2">{h.desc}</p>
                <div className="flex flex-col gap-1">
                  {h.tips.map((t, i) => (
                    <span key={i} className="text-xs text-[var(--text-muted)] flex items-start gap-1">
                      <span className="text-primary">›</span> {t}
                    </span>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="border-danger/20">
        <CardBody>
          <p className="text-xs font-semibold uppercase tracking-wide text-danger mb-3">Avoid These</p>
          <div className="space-y-2">
            {EYE_AVOID.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                <span className="text-danger mt-0.5">✕</span> {a}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card className="border-accent/20">
        <CardBody>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent mb-2">Bottom Line</p>
          <p className="text-sm text-[var(--text-muted)]">You can keep your power stable for years if you follow these.</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Small habits daily &gt; big changes occasionally.</p>
        </CardBody>
      </Card>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function WorkoutDiet() {
  const [tab, setTab] = useState('diet'); // 'diet' | 'eye'
  const [isWorkoutDay, setIsWorkoutDay] = useState(true);
  const [view, setView] = useState('cards'); // 'cards' | 'timeline'
  const [bodyWeight, setBodyWeight] = useState(() => parseFloat(localStorage.getItem('wd_bodyweight') || '0'));
  const [checked, setChecked] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('wd_checked') || '{}');
      return saved.date === TODAY ? saved.meals : {};
    } catch { return {}; }
  });

  const currentMeal = getCurrentMeal();

  const meals = isWorkoutDay ? MEALS_ALL : MEALS_ALL.filter(m => !m.workoutOnly);

  const completedCount = Object.values(checked).filter(Boolean).length;
  const totalCount = meals.length;

  const handleCheck = (mealTime) => {
    const next = { ...checked, [mealTime]: !checked[mealTime] };
    setChecked(next);
    localStorage.setItem('wd_checked', JSON.stringify({ date: TODAY, meals: next }));
  };

  const handleBodyWeight = (val) => {
    setBodyWeight(val);
    localStorage.setItem('wd_bodyweight', val);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

      <div>
        <h1 className="text-2xl font-bold text-[var(--text)] flex items-center gap-2">
          <Dumbbell className="text-primary" size={24} /> Athletic Diet Plan
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Affordable · ₹80–120/day · Real gains</p>
      </div>

      <Tabs
        tabs={[
          { value: 'diet', label: 'Diet & Workout' },
          { value: 'eye', label: 'Eye Health' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'eye' ? (
        <EyeHealthTab />
      ) : (
        <div className="flex flex-col gap-6">

          {/* Protein Calculator */}
          <Card>
            <CardHeader icon={<TrendingUp size={18} />} title="Protein Calculator" />
            <CardBody className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <Input
                label="Body weight (kg)"
                type="number"
                value={bodyWeight || ''}
                onChange={(e) => handleBodyWeight(parseFloat(e.target.value) || 0)}
                placeholder="Your body weight (kg)"
                className="flex-1"
              />
              {bodyWeight > 0 && (
                <div className="h-10 px-4 flex items-center rounded-lg bg-accent/10 text-accent text-sm font-semibold whitespace-nowrap">
                  {Math.round(bodyWeight * 1.6)}–{Math.round(bodyWeight * 2)}g protein
                </div>
              )}
            </CardBody>
          </Card>

          {/* Controls row */}
          <Card>
            <CardBody className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex gap-2">
                <Button size="sm" variant={isWorkoutDay ? 'primary' : 'secondary'} onClick={() => setIsWorkoutDay(true)}>
                  Workout Day
                </Button>
                <Button size="sm" variant={!isWorkoutDay ? 'primary' : 'secondary'} onClick={() => setIsWorkoutDay(false)}>
                  Rest Day
                </Button>
              </div>
              <div className="flex gap-1">
                <IconButton
                  label="Card view"
                  className={view === 'cards' ? 'bg-primary/10 text-primary' : ''}
                  onClick={() => setView('cards')}
                >
                  <LayoutList size={16} />
                </IconButton>
                <IconButton
                  label="Timeline view"
                  className={view === 'timeline' ? 'bg-primary/10 text-primary' : ''}
                  onClick={() => setView('timeline')}
                >
                  <Clock size={16} />
                </IconButton>
              </div>
            </CardBody>
          </Card>

          {/* Progress */}
          <KpiCard
            icon={<Check size={18} />}
            label="Today's Meals"
            value={`${completedCount}/${totalCount}`}
            tone={completedCount === totalCount ? 'accent' : 'primary'}
            progress={totalCount ? (completedCount / totalCount) * 100 : 0}
            footer={completedCount === totalCount && totalCount > 0 ? <p className="text-xs text-accent">All meals done! Great discipline.</p> : null}
          />

          {/* Meal list */}
          {view === 'cards' ? (
            <div className="flex flex-col gap-3">
              {meals.map(meal => (
                <MealCard key={meal.time} meal={meal} checked={!!checked[meal.time]}
                  onCheck={handleCheck}
                  defaultOpen={meal.time === currentMeal} />
              ))}
            </div>
          ) : (
            <TimelineView meals={meals} checked={checked} onCheck={handleCheck} />
          )}

          {/* Weight Tracker */}
          <WeightTracker bodyWeight={bodyWeight} />

          {/* Key Rules */}
          <Card>
            <CardHeader icon={<TrendingUp size={18} />} title="Key Rules for Lean Bulk" />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {RULES.map((rule) => {
                  const Icon = rule.icon;
                  return (
                  <div key={rule.label} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <Icon size={16} className="text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-primary">{rule.label}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{rule.value}</p>
                    </div>
                  </div>
                  );
                })}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-4 text-center">
                No junk · No fried foods · No excess sugar
              </p>
            </CardBody>
          </Card>

        </div>
      )}
    </div>
  );
}
