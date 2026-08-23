import React, { useState, useEffect, useRef } from 'react';
import { Dumbbell, Sun, Coffee, Utensils, Apple, Moon, Droplets, BedDouble,
  TrendingUp, ChevronDown, ChevronUp, Check, LayoutList, Clock, Scale, Plus, Eye, Timer } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from './NavBar';
import { supabase } from '../supabase';

const GLASS = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.06)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};

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
    subtitle: '🌅 Quick energy boost · ~1g protein',
    icon: Sun,
    color: '#facc15',
    items: ['1 banana 🍌', 'Black coffee/tea'],
    tip: 'Simple fuel for your workout session',
    workoutOnly: true,
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&q=80',
  },
  {
    time: 'Post-Workout',
    subtitle: '💪 Recovery meal · ~26g protein',
    icon: Dumbbell,
    color: '#4ade80',
    items: ['3 whole eggs 🥚', '2 bread slices 🍞', '1 tbsp peanut butter 🥜'],
    tip: 'Strong start: protein + calories',
    workoutOnly: true,
    image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&q=80',
  },
  {
    time: 'Breakfast',
    subtitle: '🍳 Choose one · ~8–10g protein',
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
    subtitle: '🍛 Biggest meal · ~30g protein',
    icon: Utensils,
    color: '#22d3ee',
    items: [
      'Rice 🍚',
      '50g dry soya chunks curry 🌱',
      'Dal/vegetables',
    ],
    tip: 'Soya chunks are your main protein source here',
    workoutOnly: false,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
  },
  {
    time: 'Evening Snack',
    subtitle: '☕ Light snack · ~8–10g protein',
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
    subtitle: '🌙 Evening fuel · ~18–22g protein',
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
  { icon: TrendingUp, color: '#4ade80', label: 'Protein Target', value: '1.6–2g per kg body weight' },
  { icon: Droplets,   color: '#22d3ee', label: 'Water Daily',    value: '3 litres minimum' },
  { icon: BedDouble,  color: '#818cf8', label: 'Sleep',          value: '7–8 hours every night' },
  { icon: TrendingUp, color: '#facc15', label: 'Weight Gain',    value: '0.25–0.5 kg per week' },
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
  const { icon: Icon, color, time, subtitle, items, tip, image } = meal;

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02]"
      style={{ ...GLASS, borderColor: checked ? color + '50' : color + '20',
        boxShadow: checked ? `0 0 25px ${color}25` : GLASS.boxShadow }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 p-5 text-left group"
        style={{ background: 'transparent' }}>
        {/* check circle */}
        <button onClick={e => { e.stopPropagation(); onCheck(time); }}
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 hover:scale-110"
          style={{ background: checked ? color + '30' : 'rgba(255,255,255,0.05)',
            border: `2px solid ${checked ? color : 'rgba(255,255,255,0.15)'}`,
            boxShadow: checked ? `0 0 15px ${color}50` : 'none' }}>
          {checked && <Check size={14} style={{ color }} />}
        </button>
        {/* meal thumbnail */}
        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-300 group-hover:scale-110"
          style={{ border: `1px solid ${color}40` }}>
          <img src={image} alt={time} className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-base leading-tight transition-all duration-300 ${checked ? 'line-through opacity-50' : 'text-slate-100 group-hover:text-[#3D52A0]'}`}>{time}</p>
          <p className="text-xs font-mono text-slate-400 mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {checked && <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">✓ Done</span>}
          {open ? <ChevronUp size={16} className="text-slate-500 transition-transform duration-300" />
                 : <ChevronDown size={16} className="text-slate-500 transition-transform duration-300" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5">
          <div className="h-px mb-4" style={{ background: `linear-gradient(90deg, ${color}50, transparent)` }} />
          {/* full-width image */}
          <div className="rounded-xl overflow-hidden mb-4 bg-black/30">
            <img src={image} alt={time} className="w-full object-contain max-h-72" loading="lazy" />
          </div>
          <div className="space-y-3 mb-4">
            {items.map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm text-slate-200 group/item">
                <div className="mt-2 w-2 h-2 rounded-full flex-shrink-0 transition-all duration-300 group-hover/item:scale-125"
                     style={{ background: color }} />
                <span className="leading-relaxed group-hover/item:text-[#3D52A0] transition-colors duration-300">{item}</span>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-xl transition-all duration-300 hover:scale-[1.02]"
            style={{ background: color + '12', border: `1px solid ${color}30` }}>
            <p className="text-xs font-mono leading-relaxed" style={{ color }}>
              💡 {tip}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Timeline View ──────────────────────────────────────────────────────────
function TimelineView({ meals, checked, onCheck }) {
  const currentMeal = getCurrentMeal();
  return (
    <div className="relative pl-10">
      {/* vertical line */}
      <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gradient-to-b from-transparent via-slate-600 to-transparent" />
      <div className="space-y-6">
        {meals.map((meal) => {
          const tl = TIMELINE_TIMES.find(t => t.time === meal.time);
          const isCurrent = meal.time === currentMeal;
          const isChecked = checked[meal.time];
          return (
            <div key={meal.time} className="relative flex items-start gap-5 group">
              {/* dot */}
              <div className="absolute -left-7 mt-2 w-4 h-4 rounded-full flex-shrink-0 transition-all duration-300 group-hover:scale-125"
                style={{ background: isChecked ? meal.color : isCurrent ? meal.color : '#1e293b',
                  border: `3px solid ${isCurrent || isChecked ? meal.color : '#475569'}`,
                  boxShadow: isCurrent ? `0 0 20px ${meal.color}80` : isChecked ? `0 0 15px ${meal.color}60` : 'none' }} />
              
              <div className="flex-1 rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] group-hover:shadow-lg"
                style={{ ...GLASS, borderColor: isCurrent ? meal.color + '50' : meal.color + '20',
                  background: isCurrent ? meal.color + '08' : GLASS.background }}>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-400">{tl?.label}</span>
                        {isCurrent && <span className="text-[10px] font-mono px-2 py-1 rounded-full animate-pulse"
                          style={{ background: meal.color + '25', color: meal.color }}>CURRENT</span>}
                      </div>
                      <p className={`font-bold text-lg transition-all duration-300 ${isChecked ? 'line-through opacity-40' : 'text-slate-100 group-hover:text-[#3D52A0]'}`}>{meal.time}</p>
                    </div>
                  </div>
                  <button onClick={() => onCheck(meal.time)}
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 hover:scale-110"
                    style={{ background: isChecked ? meal.color + '30' : 'rgba(255,255,255,0.05)',
                      border: `2px solid ${isChecked ? meal.color : 'rgba(255,255,255,0.15)'}`,
                      boxShadow: isChecked ? `0 0 15px ${meal.color}50` : 'none' }}>
                    {isChecked && <Check size={14} style={{ color: meal.color }} />}
                  </button>
                </div>
                
                <div className="space-y-2 mb-4">
                  {meal.items.map((item, idx) => (
                    <div key={item} className="flex items-start gap-3 text-sm text-slate-200 group/item">
                      <div className="mt-2 w-2 h-2 rounded-full flex-shrink-0 transition-all duration-300 group-hover/item:scale-125" 
                           style={{ background: meal.color }} />
                      <span className="leading-relaxed group-hover/item:text-[#3D52A0] transition-colors duration-300">{item}</span>
                    </div>
                  ))}
                </div>
                
                <div className="p-3 rounded-xl transition-all duration-300"
                  style={{ background: meal.color + '12', border: `1px solid ${meal.color}25` }}>
                  <p className="text-xs font-mono leading-relaxed" style={{ color: meal.color }}>
                    💡 {meal.tip}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Weight Tracker ─────────────────────────────────────────────────────────
function WeightTracker({ bodyWeight }) {
  const [logs, setLogs] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    const { data } = await supabase
      .from('weight_logs')
      .select('*')
      .order('date', { ascending: true })
      .limit(30);
    setLogs(data || []);
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

  return (
    <div className="rounded-2xl p-5" style={GLASS}>
      <div className="flex items-center gap-2 mb-4">
        <Scale size={16} className="text-cyan-400" />
        <p className="font-mono text-xs tracking-[0.2em] uppercase text-slate-400">Body Weight Tracker</p>
      </div>

      {/* stats row */}
      {latest && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Current', value: `${latest} kg`, color: '#22d3ee' },
            { label: 'Total Gained', value: gained !== null ? `${gained > 0 ? '+' : ''}${gained} kg` : '—', color: gained > 0 ? '#4ade80' : '#f87171' },
            { label: 'Goal/week', value: '+0.25–0.5 kg', color: '#facc15' },
          ].map(s => (
            <div key={s.label} className="text-center p-2 rounded-xl"
              style={{ background: s.color + '08', border: `1px solid ${s.color}20` }}>
              <p className="text-sm font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] font-mono text-slate-600 uppercase mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* chart */}
      {chartData.length > 1 && (
        <div className="mb-4 h-28">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ background: '#EDE8F5', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#22d3ee' }} />
              <Line type="monotone" dataKey="kg" stroke="#22d3ee" strokeWidth={2} dot={{ fill: '#22d3ee', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* input */}
      <div className="flex gap-2">
        <input
          type="number" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && logWeight()}
          placeholder={`Today's weight (kg)`}
          className="flex-1 px-3 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
        <button onClick={logWeight} disabled={loading}
          className="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all"
          style={{ background: '#22d3ee18', border: '1px solid #22d3ee40', color: '#22d3ee' }}>
          <Plus size={14} /> Log
        </button>
      </div>

      {/* protein target based on body weight */}
      {bodyWeight > 0 && (
        <p className="text-[11px] font-mono mt-3 text-center"
          style={{ color: '#4ade80' }}>
          💪 Your protein target: {Math.round(bodyWeight * 1.6)}–{Math.round(bodyWeight * 2)}g / day
        </p>
      )}
    </div>
  );
}

// ── Eye Health Data ────────────────────────────────────────────────────────
const EYE_HABITS = [
  { id: 'rule_20_20_20', emoji: '🖥️', color: '#22d3ee', title: '20-20-20 Rule',
    desc: 'Every 20 min → look 20 feet away for 20 sec. Most important habit to slow power increase.',
    tips: ["Keep phone/laptop at arm's distance", "Don't use phone in dark rooms", 'Reduce brightness at night'] },
  { id: 'lighting', emoji: '💡', color: '#facc15', title: 'Proper Lighting',
    desc: 'Study/work in a well-lit room. Avoid glare directly into eyes.',
    tips: ["Don't sit too close to screens or TV", 'No screen use in pitch dark'] },
  { id: 'glasses', emoji: '👓', color: '#818cf8', title: 'Wear Glasses Correctly',
    desc: 'If prescribed, wear them when needed — driving, classes, screens.',
    tips: ['Not wearing them causes eye strain and headaches'] },
  { id: 'diet', emoji: '🥕', color: '#fb923c', title: 'Eat for Eye Support',
    desc: 'Include daily: carrot, spinach/moringa, eggs, fish, almonds, walnuts, banana, orange.',
    tips: ['These support eye health and reduce stress damage'] },
  { id: 'sleep', emoji: '😴', color: '#4ade80', title: 'Sleep 7–8 Hours',
    desc: 'Poor sleep = more blur + eye fatigue.',
    tips: ['Minimum 7–8 hours every night'] },
  { id: 'relaxation', emoji: '🌿', color: '#34d399', title: 'Eye Relaxation',
    desc: 'Palming: warm hands over closed eyes. Focus change: near → far object.',
    tips: ['Helps reduce strain and comfort eyes'] },
  { id: 'outdoor', emoji: '🏃', color: '#a78bfa', title: 'Outdoor Time',
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
  const color = phase === 'work' ? '#22d3ee' : '#4ade80';

  return (
    <div className="rounded-2xl p-5 mb-5" style={{ ...GLASS, borderColor: color + '30' }}>
      <div className="flex items-center gap-2 mb-4">
        <Timer size={15} style={{ color }} />
        <p className="font-mono text-xs tracking-[0.2em] uppercase text-slate-400">20-20-20 Timer</p>
        <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full"
          style={{ background: color + '15', color, border: `1px solid ${color}30` }}>
          {phase === 'work' ? '🖥️ Screen Time' : '👀 Look Away!'}
        </span>
      </div>
      <div className="flex flex-col items-center mb-4">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle cx="50" cy="50" r="44" fill="none" stroke={color} strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - pct / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 6px ${color})` }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black font-mono" style={{ color }}>{mm}:{ss}</span>
            <span className="text-[9px] font-mono text-slate-500 uppercase">{phase === 'work' ? 'until break' : 'look away'}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setRunning(r => !r)}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all"
          style={{ background: color + '18', border: `1px solid ${color}40`, color }}>
          {running ? '⏸ Pause' : '▶ Start'}
        </button>
        <button onClick={reset} className="px-4 py-2.5 rounded-xl text-slate-500 text-sm"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>↺</button>
      </div>
    </div>
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
    <div>
      <div className="rounded-2xl p-4 mb-5" style={GLASS}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">Today's Eye Habits</p>
          <p className="text-xs font-bold" style={{ color: done === EYE_HABITS.length ? '#4ade80' : '#22d3ee' }}>
            {done} / {EYE_HABITS.length} done
          </p>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(done / EYE_HABITS.length) * 100}%`,
              background: done === EYE_HABITS.length ? 'linear-gradient(90deg,#4ade80,#22d3ee)' : 'linear-gradient(90deg,#22d3ee,#818cf8)' }} />
        </div>
        {done === EYE_HABITS.length && (
          <p className="text-[11px] font-mono text-green-400 text-center mt-2">👁️ Perfect eye care day!</p>
        )}
      </div>

      <EyeTimer />

      <div className="space-y-3 mb-5">
        {EYE_HABITS.map(h => (
          <div key={h.id} className="rounded-2xl p-4 transition-all"
            style={{ ...GLASS, borderColor: checked[h.id] ? h.color + '40' : h.color + '15',
              background: checked[h.id] ? h.color + '06' : GLASS.background }}>
            <div className="flex items-start gap-3">
              <button onClick={() => toggle(h.id)}
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                style={{ background: checked[h.id] ? h.color + '25' : 'rgba(255,255,255,0.04)',
                  border: `2px solid ${checked[h.id] ? h.color : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: checked[h.id] ? `0 0 10px ${h.color}40` : 'none' }}>
                {checked[h.id] && <Check size={12} style={{ color: h.color }} />}
              </button>
              <div className="flex-1">
                <p className={`font-bold text-sm mb-1 ${checked[h.id] ? 'line-through opacity-50' : 'text-slate-200'}`}>
                  {h.emoji} {h.title}
                </p>
                <p className="text-xs text-slate-400 mb-2">{h.desc}</p>
                <div className="flex flex-col gap-1">
                  {h.tips.map((t, i) => (
                    <span key={i} className="text-[11px] font-mono text-slate-500 flex items-start gap-1">
                      <span style={{ color: h.color }}>›</span> {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-4 mb-5" style={{ ...GLASS, borderColor: '#f8717120' }}>
        <p className="text-xs font-mono uppercase tracking-widest text-rose-400 mb-3">❌ Avoid These</p>
        <div className="space-y-2">
          {EYE_AVOID.map((a, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-slate-400">
              <span className="text-rose-500 mt-0.5">✕</span> {a}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-4" style={{ ...GLASS, borderColor: '#4ade8020' }}>
        <p className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-2">🧠 Bottom Line</p>
        <p className="text-sm text-slate-400">You can keep your power stable for years if you follow these.</p>
        <p className="text-sm text-slate-400 mt-1">Small habits daily &gt; big changes occasionally.</p>
      </div>
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
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-green-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-cyan-900/20 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-3 sm:px-4 py-8">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl mb-4"
            style={{ ...GLASS, boxShadow: '0 0 24px rgba(74,222,128,0.2)', border: '1px solid rgba(74,222,128,0.3)' }}>
            <Dumbbell size={32} className="text-green-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-green-200 to-cyan-400 mb-2">
            ATHLETIC DIET PLAN
          </h1>
          <p className="text-green-400/50 font-mono text-xs tracking-[0.3em] uppercase">Affordable · ₹80–120/day · Real Gains</p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-2xl overflow-hidden mb-6" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          {[
            { val: 'diet', icon: Dumbbell, label: 'Diet & Workout', color: '#4ade80' },
            { val: 'eye',  icon: Eye,      label: 'Eye Health',     color: '#22d3ee' },
          ].map(t => (
            <button key={t.val} onClick={() => setTab(t.val)}
              className="flex-1 py-3 text-xs font-bold font-mono tracking-wider flex items-center justify-center gap-2 transition-all"
              style={{
                background: tab === t.val ? t.color + '15' : 'transparent',
                color: tab === t.val ? t.color : '#475569',
                borderRight: t.val === 'diet' ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'eye' ? <EyeHealthTab /> : (<>
        {/* Protein Calculator */}
        <div className="rounded-2xl p-4 mb-4" style={GLASS}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={15} className="text-green-400" />
            <p className="font-mono text-xs tracking-[0.2em] uppercase text-slate-400">Protein Calculator</p>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="number" value={bodyWeight || ''} onChange={e => handleBodyWeight(parseFloat(e.target.value) || 0)}
              placeholder="Your body weight (kg)"
              className="flex-1 px-3 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            {bodyWeight > 0 && (
              <div className="px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap"
                style={{ background: '#4ade8018', border: '1px solid #4ade8040', color: '#4ade80' }}>
                {Math.round(bodyWeight * 1.6)}–{Math.round(bodyWeight * 2)}g protein
              </div>
            )}
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          {/* Workout / Rest toggle */}
          <div className="flex rounded-xl overflow-hidden flex-1" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {[{ label: '💪 Workout Day', val: true }, { label: '😴 Rest Day', val: false }].map(opt => (
              <button key={String(opt.val)} onClick={() => setIsWorkoutDay(opt.val)}
                className="flex-1 py-2 text-xs font-bold font-mono tracking-wider transition-all"
                style={{
                  background: isWorkoutDay === opt.val ? (opt.val ? '#4ade8020' : '#818cf820') : 'transparent',
                  color: isWorkoutDay === opt.val ? (opt.val ? '#4ade80' : '#818cf8') : '#475569',
                  borderRight: opt.val ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {[{ icon: LayoutList, val: 'cards' }, { icon: Clock, val: 'timeline' }].map(opt => (
              <button key={opt.val} onClick={() => setView(opt.val)}
                className="p-2.5 transition-all"
                style={{
                  background: view === opt.val ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: view === opt.val ? '#3D52A0' : '#475569',
                  borderRight: opt.val === 'cards' ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}>
                <opt.icon size={15} />
              </button>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="rounded-2xl p-4 mb-5" style={GLASS}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">Today's Meals</p>
            <p className="text-xs font-bold" style={{ color: completedCount === totalCount ? '#4ade80' : '#22d3ee' }}>
              {completedCount} / {totalCount} done
            </p>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${totalCount ? (completedCount / totalCount) * 100 : 0}%`,
                background: completedCount === totalCount
                  ? 'linear-gradient(90deg,#4ade80,#22d3ee)'
                  : 'linear-gradient(90deg,#22d3ee,#818cf8)' }} />
          </div>
          {completedCount === totalCount && totalCount > 0 && (
            <p className="text-[11px] font-mono text-green-400 text-center mt-2">🎉 All meals done! Great discipline.</p>
          )}
        </div>

        {/* Meal list */}
        {view === 'cards' ? (
          <div className="space-y-3 mb-6">
            {meals.map(meal => (
              <MealCard key={meal.time} meal={meal} checked={!!checked[meal.time]}
                onCheck={handleCheck}
                defaultOpen={meal.time === currentMeal} />
            ))}
          </div>
        ) : (
          <div className="mb-6">
            <TimelineView meals={meals} checked={checked} onCheck={handleCheck} />
          </div>
        )}

        {/* Weight Tracker */}
        <div className="mb-6">
          <WeightTracker bodyWeight={bodyWeight} />
        </div>

        {/* Key Rules */}
        <div className="rounded-2xl p-5" style={GLASS}>
          <p className="font-mono text-xs tracking-[0.25em] uppercase text-slate-500 mb-4">💡 Key Rules for Lean Bulk</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {RULES.map(({ icon: Icon, color, label, value }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: color + '08', border: `1px solid ${color}20` }}>
                <Icon size={16} style={{ color, flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p className="text-xs font-bold" style={{ color }}>{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-600 font-mono mt-4 text-center">
            ❌ No junk · No fried foods · No excess sugar
          </p>
        </div>
        </>)}

      </div>
    </div>
  );
}
