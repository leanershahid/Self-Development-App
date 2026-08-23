import React, { useState, useEffect } from 'react';
import { Dumbbell, ChevronDown, ChevronUp, Plus, TrendingUp, History, Check } from 'lucide-react';
import Navbar from './NavBar';
import { supabase } from '../supabase';

const GLASS = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.06)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};

// Wger exercise image API (free, no auth needed)
const IMG = (id) => `https://wger.de/api/v2/exerciseimage/?exercise_base=${id}&format=json`;

const BODY_PARTS = [
  {
    name: 'Chest',
    color: '#f87171',
    emoji: '🫁',
    exercises: [
      { name: 'Bench Press', img: 'https://wger.de/static/images/exercises/small/bench-press.png', wgerId: 192 },
      { name: 'Incline Dumbbell Press', img: 'https://wger.de/static/images/exercises/small/incline-dumbbell-press.png', wgerId: 314 },
      { name: 'Cable Fly', img: 'https://wger.de/static/images/exercises/small/cable-crossover.png', wgerId: 313 },
      { name: 'Push-Up', img: 'https://wger.de/static/images/exercises/small/push-up.png', wgerId: 10 },
    ],
  },
  {
    name: 'Back',
    color: '#34d399',
    emoji: '🔙',
    exercises: [
      { name: 'Pull-Up', img: 'https://wger.de/static/images/exercises/small/pull-up.png', wgerId: 31 },
      { name: 'Barbell Row', img: 'https://wger.de/static/images/exercises/small/barbell-row.png', wgerId: 63 },
      { name: 'Lat Pulldown', img: 'https://wger.de/static/images/exercises/small/lat-pulldown.png', wgerId: 159 },
      { name: 'Seated Cable Row', img: 'https://wger.de/static/images/exercises/small/seated-cable-row.png', wgerId: 118 },
    ],
  },
  {
    name: 'Shoulders',
    color: '#60a5fa',
    emoji: '💪',
    exercises: [
      { name: 'Overhead Press', img: 'https://wger.de/static/images/exercises/small/overhead-press.png', wgerId: 73 },
      { name: 'Lateral Raise', img: 'https://wger.de/static/images/exercises/small/lateral-raise.png', wgerId: 79 },
      { name: 'Front Raise', img: 'https://wger.de/static/images/exercises/small/front-raise.png', wgerId: 78 },
      { name: 'Face Pull', img: 'https://wger.de/static/images/exercises/small/face-pull.png', wgerId: 345 },
    ],
  },
  {
    name: 'Arms',
    color: '#f59e0b',
    emoji: '💪',
    exercises: [
      { name: 'Barbell Curl', img: 'https://wger.de/static/images/exercises/small/barbell-curl.png', wgerId: 84 },
      { name: 'Hammer Curl', img: 'https://wger.de/static/images/exercises/small/hammer-curl.png', wgerId: 85 },
      { name: 'Tricep Pushdown', img: 'https://wger.de/static/images/exercises/small/tricep-pushdown.png', wgerId: 91 },
      { name: 'Skull Crusher', img: 'https://wger.de/static/images/exercises/small/skull-crusher.png', wgerId: 93 },
    ],
  },
  {
    name: 'Legs',
    color: '#a78bfa',
    emoji: '🦵',
    exercises: [
      { name: 'Squat', img: 'https://wger.de/static/images/exercises/small/squat.png', wgerId: 111 },
      { name: 'Romanian Deadlift', img: 'https://wger.de/static/images/exercises/small/romanian-deadlift.png', wgerId: 113 },
      { name: 'Leg Press', img: 'https://wger.de/static/images/exercises/small/leg-press.png', wgerId: 116 },
      { name: 'Calf Raise', img: 'https://wger.de/static/images/exercises/small/calf-raise.png', wgerId: 126 },
    ],
  },
  {
    name: 'Core',
    color: '#fb923c',
    emoji: '🔥',
    exercises: [
      { name: 'Plank', img: 'https://wger.de/static/images/exercises/small/plank.png', wgerId: 10 },
      { name: 'Crunches', img: 'https://wger.de/static/images/exercises/small/crunch.png', wgerId: 11 },
      { name: 'Leg Raise', img: 'https://wger.de/static/images/exercises/small/leg-raise.png', wgerId: 12 },
      { name: 'Russian Twist', img: 'https://wger.de/static/images/exercises/small/russian-twist.png', wgerId: 13 },
    ],
  },
];

// Real exercise images from Unsplash (reliable, always loads)
const EXERCISE_IMAGES = {
  'Bench Press':             'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&h=200&fit=crop',
  'Incline Dumbbell Press':  'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=300&h=200&fit=crop',
  'Cable Fly':               'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=200&fit=crop',
  'Push-Up':                 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=300&h=200&fit=crop',
  'Pull-Up':                 'https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?w=300&h=200&fit=crop',
  'Barbell Row':             'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=300&h=200&fit=crop',
  'Lat Pulldown':            'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=200&fit=crop',
  'Seated Cable Row':        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=200&fit=crop',
  'Overhead Press':          'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=300&h=200&fit=crop',
  'Lateral Raise':           'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=300&h=200&fit=crop',
  'Front Raise':             'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=300&h=200&fit=crop',
  'Face Pull':               'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=200&fit=crop',
  'Barbell Curl':            'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300&h=200&fit=crop',
  'Hammer Curl':             'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300&h=200&fit=crop',
  'Tricep Pushdown':         'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=200&fit=crop',
  'Skull Crusher':           'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&h=200&fit=crop',
  'Squat':                   'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=300&h=200&fit=crop',
  'Romanian Deadlift':       'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=300&h=200&fit=crop',
  'Leg Press':               'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=200&fit=crop',
  'Calf Raise':              'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=200&fit=crop',
  'Plank':                   'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop',
  'Crunches':                'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop',
  'Leg Raise':               'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop',
  'Russian Twist':           'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop',
};

const TODAY = new Date().toISOString().split('T')[0];

function LogModal({ exercise, color, onClose, onSaved }) {
  const [weight, setWeight] = useState('');
  const [reps, setReps]     = useState('');
  const [history, setHistory] = useState([]);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    supabase.from('gym_logs')
      .select('weight, reps, date')
      .eq('exercise', exercise)
      .order('date', { ascending: false })
      .limit(5)
      .then(({ data }) => setHistory(data || []));
  }, [exercise]);

  const last = history[0];

  const save = async () => {
    const w = parseFloat(weight);
    const r = parseInt(reps);
    if (!w || !r) return;
    setSaving(true);
    await supabase.from('gym_logs').insert({ exercise, weight: w, reps: r, date: TODAY });
    setSaving(false);
    onSaved(exercise);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl p-5" style={{ ...GLASS, borderColor: color + '40' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-[#3D52A0] text-base">{exercise}</p>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-lg leading-none">✕</button>
        </div>

        {last && (
          <div className="rounded-xl p-3 mb-4 flex items-center gap-3"
            style={{ background: color + '10', border: `1px solid ${color}25` }}>
            <History size={14} style={{ color, flexShrink: 0 }} />
            <div>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Last logged</p>
              <p className="text-sm font-bold" style={{ color }}>
                {last.weight} kg × {last.reps} reps
                <span className="text-slate-500 font-normal text-xs ml-2">{last.date}</span>
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1.5">Weight (kg)</label>
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
              placeholder={last ? last.weight : '0'}
              className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.65)', border: `1px solid ${color}30` }} />
          </div>
          <div>
            <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1.5">Reps</label>
            <input type="number" value={reps} onChange={e => setReps(e.target.value)}
              placeholder={last ? last.reps : '0'}
              className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.65)', border: `1px solid ${color}30` }} />
          </div>
        </div>

        {history.length > 1 && (
          <div className="mb-4">
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-wider mb-2">Recent History</p>
            <div className="space-y-1.5">
              {history.slice(1).map((h, i) => (
                <div key={i} className="flex justify-between text-xs text-slate-400 px-1">
                  <span className="font-mono text-slate-600">{h.date}</span>
                  <span>{h.weight} kg × {h.reps} reps</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={save} disabled={saving || !weight || !reps}
          className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-40"
          style={{ background: color + '20', border: `1px solid ${color}50`, color }}>
          {saving ? 'Saving...' : '✓ Log Set'}
        </button>
      </div>
    </div>
  );
}

function ExerciseCard({ exercise, color, logged, onLog }) {
  const img = EXERCISE_IMAGES[exercise.name];
  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.02] cursor-pointer"
      style={{ ...GLASS, borderColor: logged ? color + '50' : color + '15',
        boxShadow: logged ? `0 0 20px ${color}20` : GLASS.boxShadow }}
      onClick={() => onLog(exercise.name)}>
      <div className="relative h-32 overflow-hidden">
        <img src={img} alt={exercise.name}
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(0.7) saturate(0.8)' }}
          onError={e => { e.target.style.display = 'none'; }} />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, rgba(61,82,160,0.55) 0%, transparent 60%)` }} />
        {logged && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: color + '30', border: `2px solid ${color}` }}>
            <Check size={12} style={{ color }} />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-bold text-slate-100 mb-1">{exercise.name}</p>
        <button className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider transition-all"
          style={{ color }}>
          <Plus size={11} /> Log Set
        </button>
      </div>
    </div>
  );
}

function BodyPartSection({ part, logs, onLog }) {
  const [open, setOpen] = useState(false);
  const loggedNames = new Set(logs.map(l => l.exercise));
  const doneCount = part.exercises.filter(e => loggedNames.has(e.name)).length;

  return (
    <div className="rounded-2xl overflow-hidden mb-3" style={{ ...GLASS, borderColor: part.color + '20' }}>
      <button className="w-full flex items-center gap-4 p-4 text-left"
        onClick={() => setOpen(o => !o)}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
          style={{ background: part.color + '15', border: `1px solid ${part.color}30` }}>
          {part.emoji}
        </div>
        <div className="flex-1">
          <p className="font-bold text-slate-100">{part.name}</p>
          <p className="text-xs font-mono text-slate-500">{part.exercises.length} exercises · {doneCount} logged today</p>
        </div>
        {doneCount > 0 && (
          <div className="px-2 py-1 rounded-full text-[10px] font-mono"
            style={{ background: part.color + '15', color: part.color, border: `1px solid ${part.color}30` }}>
            {doneCount}/{part.exercises.length}
          </div>
        )}
        {open ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
      </button>

      {open && (
        <div className="px-4 pb-4">
          <div className="h-px mb-4" style={{ background: `linear-gradient(90deg, ${part.color}40, transparent)` }} />
          <div className="grid grid-cols-2 gap-3">
            {part.exercises.map(ex => (
              <ExerciseCard key={ex.name} exercise={ex} color={part.color}
                logged={loggedNames.has(ex.name)} onLog={onLog} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GymTracker() {
  const [todayLogs, setTodayLogs] = useState([]);
  const [modal, setModal]         = useState(null); // { exercise, color }
  const [activeTab, setActiveTab] = useState('workout'); // 'workout' | 'history'
  const [allLogs, setAllLogs]     = useState([]);

  useEffect(() => { loadTodayLogs(); }, []);

  const loadTodayLogs = async () => {
    const { data } = await supabase.from('gym_logs')
      .select('*').eq('date', TODAY).order('created_at', { ascending: false });
    setTodayLogs(data || []);
  };

  const loadAllLogs = async () => {
    const { data } = await supabase.from('gym_logs')
      .select('*').order('date', { ascending: false }).limit(100);
    setAllLogs(data || []);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'history') loadAllLogs();
  };

  const openModal = (exerciseName) => {
    const part = BODY_PARTS.find(p => p.exercises.some(e => e.name === exerciseName));
    setModal({ exercise: exerciseName, color: part?.color || '#22d3ee' });
  };

  const totalToday = todayLogs.length;
  const totalVolume = todayLogs.reduce((sum, l) => sum + (l.weight * l.reps), 0);

  // Group history by date
  const historyByDate = allLogs.reduce((acc, log) => {
    if (!acc[log.date]) acc[log.date] = [];
    acc[log.date].push(log);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-violet-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-rose-900/15 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-3 sm:px-4 py-8">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl mb-4"
            style={{ ...GLASS, boxShadow: '0 0 24px rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.3)' }}>
            <Dumbbell size={32} className="text-violet-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-200 to-rose-400 mb-2">
            GYM TRACKER
          </h1>
          <p className="text-violet-400/50 font-mono text-xs tracking-[0.3em] uppercase">Log Weights · Track Progress · Get Stronger</p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-2xl overflow-hidden mb-5" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          {[
            { val: 'workout', label: '💪 Workouts' },
            { val: 'history', label: '📊 History' },
          ].map(t => (
            <button key={t.val} onClick={() => handleTabChange(t.val)}
              className="flex-1 py-3 text-xs font-bold font-mono tracking-wider transition-all"
              style={{
                background: activeTab === t.val ? 'rgba(167,139,250,0.12)' : 'transparent',
                color: activeTab === t.val ? '#a78bfa' : '#475569',
                borderRight: t.val === 'workout' ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'workout' ? (
          <>
            {/* Today's stats */}
            {totalToday > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: 'Sets Today', value: totalToday, color: '#a78bfa' },
                  { label: 'Total Volume', value: `${totalVolume.toLocaleString()} kg`, color: '#f87171' },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl p-4 text-center"
                    style={{ ...GLASS, borderColor: s.color + '20' }}>
                    <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[10px] font-mono text-slate-600 uppercase tracking-wider mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Body parts */}
            {BODY_PARTS.map(part => (
              <BodyPartSection key={part.name} part={part} logs={todayLogs} onLog={openModal} />
            ))}
          </>
        ) : (
          <div className="space-y-4">
            {Object.keys(historyByDate).length === 0 ? (
              <div className="text-center py-16 text-slate-600 font-mono text-sm">No logs yet. Start logging!</div>
            ) : (
              Object.entries(historyByDate).map(([date, logs]) => {
                const vol = logs.reduce((s, l) => s + l.weight * l.reps, 0);
                return (
                  <div key={date} className="rounded-2xl p-4" style={GLASS}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-bold text-slate-200 text-sm">{date}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-500">{logs.length} sets</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                          style={{ background: '#a78bfa15', color: '#a78bfa', border: '1px solid #a78bfa30' }}>
                          {vol.toLocaleString()} kg vol
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {logs.map((log, i) => {
                        const part = BODY_PARTS.find(p => p.exercises.some(e => e.name === log.exercise));
                        const color = part?.color || '#a78bfa';
                        return (
                          <div key={i} className="flex items-center justify-between text-sm px-1">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                              <span className="text-slate-300">{log.exercise}</span>
                            </div>
                            <span className="font-mono text-xs" style={{ color }}>
                              {log.weight} kg × {log.reps} reps
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {modal && (
        <LogModal exercise={modal.exercise} color={modal.color}
          onClose={() => setModal(null)}
          onSaved={() => loadTodayLogs()} />
      )}
    </div>
  );
}
