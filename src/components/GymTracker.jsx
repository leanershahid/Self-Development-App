import React, { useState, useEffect } from 'react';
import { Dumbbell, ChevronDown, ChevronUp, Plus, TrendingUp, History, Check } from 'lucide-react';
import { supabase } from '../supabase';
import {
  Button, Input, Card, CardHeader, CardBody, Badge, KpiCard, Table, Modal,
  Tabs, EmptyState, SkeletonCard, SkeletonText, useToast,
} from './ui';

// Theme tokens mapped onto body parts (navy / slate / emerald design system)
const THEME_CLASSES = {
  danger: { text: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/30', dot: 'bg-danger' },
  success: { text: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30', dot: 'bg-accent' },
  info: { text: 'text-info', bg: 'bg-info/10', border: 'border-info/30', dot: 'bg-info' },
  warning: { text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30', dot: 'bg-warning' },
  primary: { text: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30', dot: 'bg-primary' },
  neutral: { text: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/30', dot: 'bg-secondary' },
};

const BODY_PARTS = [
  {
    name: 'Chest',
    theme: 'danger',
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
    theme: 'success',
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
    theme: 'info',
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
    theme: 'warning',
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
    theme: 'primary',
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
    theme: 'neutral',
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

const getPartTheme = (exerciseName) =>
  BODY_PARTS.find((p) => p.exercises.some((e) => e.name === exerciseName))?.theme || 'primary';

const historyColumns = [
  { key: 'date', header: 'Date', sortable: true },
  {
    key: 'exercise',
    header: 'Exercise',
    sortable: true,
    render: (row) => {
      const t = THEME_CLASSES[getPartTheme(row.exercise)];
      return (
        <span className="inline-flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full shrink-0 ${t.dot}`} />
          {row.exercise}
        </span>
      );
    },
  },
  { key: 'weight', header: 'Weight (kg)', sortable: true },
  { key: 'reps', header: 'Reps', sortable: true },
  {
    key: 'volume',
    header: 'Volume',
    sortable: true,
    sortValue: (row) => row.weight * row.reps,
    render: (row) => `${(row.weight * row.reps).toLocaleString()} kg`,
  },
];

function LogModal({ open, exercise, theme, onClose, onSaved }) {
  const toast = useToast();
  const t = THEME_CLASSES[theme] || THEME_CLASSES.primary;
  const [weight, setWeight] = useState('');
  const [reps, setReps]     = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [trackedExercise, setTrackedExercise] = useState(exercise);

  // Reset the entry fields whenever a different exercise is opened in the modal.
  if (exercise !== trackedExercise) {
    setTrackedExercise(exercise);
    setWeight('');
    setReps('');
    setHistory([]);
  }

  useEffect(() => {
    if (!exercise) return;
    setHistoryLoading(true);
    supabase.from('gym_logs')
      .select('weight, reps, date')
      .eq('exercise', exercise)
      .order('date', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setHistory(data || []);
        setHistoryLoading(false);
      });
  }, [exercise]);

  const last = history[0];

  const save = async () => {
    const w = parseFloat(weight);
    const r = parseInt(reps);
    if (!w || !r) return;
    setSaving(true);
    const { error } = await supabase.from('gym_logs').insert({ exercise, weight: w, reps: r, date: TODAY });
    setSaving(false);
    if (error) {
      toast.error('Failed to log set');
      return;
    }
    toast.success(`Logged ${w} kg × ${r} reps`);
    onSaved(exercise);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={exercise}
      size="sm"
      footer={
        <Button variant="primary" className="w-full" onClick={save} loading={saving} disabled={!weight || !reps}>
          Log Set
        </Button>
      }
    >
      {historyLoading ? (
        <SkeletonText lines={2} className="mb-4" />
      ) : (
        last && (
          <div className={`flex items-center gap-3 rounded-lg px-3 py-2.5 mb-4 border ${t.bg} ${t.border}`}>
            <History size={14} className={`${t.text} shrink-0`} />
            <div>
              <p className="text-xs text-[var(--text-muted)]">Last logged</p>
              <p className={`text-sm font-semibold ${t.text}`}>
                {last.weight} kg × {last.reps} reps
                <span className="text-[var(--text-muted)] font-normal text-xs ml-2">{last.date}</span>
              </p>
            </div>
          </div>
        )
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Input
          type="number"
          label="Weight (kg)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder={last ? String(last.weight) : '0'}
        />
        <Input
          type="number"
          label="Reps"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          placeholder={last ? String(last.reps) : '0'}
        />
      </div>

      {history.length > 1 && (
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">Recent History</p>
          <div className="flex flex-col gap-1.5">
            {history.slice(1).map((h, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>{h.date}</span>
                <span className="text-[var(--text)]">{h.weight} kg × {h.reps} reps</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

function ExerciseCard({ exercise, theme, logged, onLog }) {
  const t = THEME_CLASSES[theme] || THEME_CLASSES.primary;
  const img = EXERCISE_IMAGES[exercise.name];
  return (
    <button
      type="button"
      onClick={() => onLog(exercise.name)}
      className={`group flex flex-col overflow-hidden rounded-xl border bg-[var(--surface)] text-left transition hover:shadow-[var(--shadow-sm)] ${logged ? t.border : 'border-[var(--border)]'}`}
    >
      <div className="relative h-24 overflow-hidden bg-[var(--surface-hover)]">
        <img
          src={img}
          alt={exercise.name}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        {logged && (
          <span className={`absolute top-2 right-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-white ${t.dot}`}>
            <Check size={12} />
          </span>
        )}
      </div>
      <div className="p-3 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-[var(--text)] truncate">{exercise.name}</span>
        <span className={`inline-flex items-center gap-1 text-xs font-medium shrink-0 ${t.text}`}>
          <Plus size={12} /> Log
        </span>
      </div>
    </button>
  );
}

function BodyPartSection({ part, logs, onLog }) {
  const [open, setOpen] = useState(false);
  const t = THEME_CLASSES[part.theme] || THEME_CLASSES.primary;
  const loggedNames = new Set(logs.map((l) => l.exercise));
  const doneCount = part.exercises.filter((e) => loggedNames.has(e.name)).length;

  return (
    <Card className="overflow-hidden">
      <button type="button" className="w-full flex items-center gap-4 px-5 py-4 text-left" onClick={() => setOpen((o) => !o)}>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${t.bg}`}>
          {part.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text)]">{part.name}</p>
          <p className="text-xs text-[var(--text-muted)]">{part.exercises.length} exercises · {doneCount} logged today</p>
        </div>
        {doneCount > 0 && <Badge variant={part.theme}>{doneCount}/{part.exercises.length}</Badge>}
        {open ? <ChevronUp size={16} className="text-[var(--text-muted)]" /> : <ChevronDown size={16} className="text-[var(--text-muted)]" />}
      </button>

      {open && (
        <CardBody className="pt-0 border-t border-[var(--border)]">
          <div className="grid grid-cols-2 gap-3 pt-4">
            {part.exercises.map((ex) => (
              <ExerciseCard key={ex.name} exercise={ex} theme={part.theme} logged={loggedNames.has(ex.name)} onLog={onLog} />
            ))}
          </div>
        </CardBody>
      )}
    </Card>
  );
}

export default function GymTracker() {
  const toast = useToast();
  const [todayLogs, setTodayLogs] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null); // { exercise, theme }
  const [activeTab, setActiveTab] = useState('workout'); // 'workout' | 'history'
  const [allLogs, setAllLogs]     = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadTodayLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('gym_logs')
      .select('*').eq('date', TODAY).order('created_at', { ascending: false });
    if (error) toast.error('Failed to load today\'s logs');
    setTodayLogs(data || []);
    setLoading(false);
  };

  useEffect(() => { loadTodayLogs(); }, []);

  const loadAllLogs = async () => {
    setHistoryLoading(true);
    const { data, error } = await supabase.from('gym_logs')
      .select('*').order('date', { ascending: false }).limit(100);
    if (error) toast.error('Failed to load history');
    setAllLogs(data || []);
    setHistoryLoading(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'history') loadAllLogs();
  };

  const openModal = (exerciseName) => {
    const part = BODY_PARTS.find((p) => p.exercises.some((e) => e.name === exerciseName));
    setModal({ exercise: exerciseName, theme: part?.theme || 'primary' });
  };

  const totalToday = todayLogs.length;
  const totalVolume = todayLogs.reduce((sum, l) => sum + (l.weight * l.reps), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Dumbbell size={24} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text)]">Gym Tracker</h1>
          <p className="text-sm text-[var(--text-muted)]">Log weights, track progress, get stronger</p>
        </div>
      </div>

      <Tabs
        tabs={[
          { value: 'workout', label: 'Workouts' },
          { value: 'history', label: 'History' },
        ]}
        value={activeTab}
        onChange={handleTabChange}
      />

      {activeTab === 'workout' ? (
        <div className="flex flex-col gap-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            totalToday > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <KpiCard icon={<Dumbbell size={18} />} label="Sets Today" value={totalToday} tone="primary" />
                <KpiCard icon={<TrendingUp size={18} />} label="Total Volume" value={totalVolume.toLocaleString()} unit="kg" tone="accent" />
              </div>
            )
          )}

          <div className="flex flex-col gap-3">
            {BODY_PARTS.map((part) => (
              <BodyPartSection key={part.name} part={part} logs={todayLogs} onLog={openModal} />
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader title="Workout History" subtitle={`${allLogs.length} logged sets`} icon={<History size={18} />} />
          <CardBody>
            <Table
              columns={historyColumns}
              data={allLogs}
              loading={historyLoading}
              pageSize={10}
              emptyState={
                <EmptyState
                  icon={<History size={28} />}
                  title="No logs yet"
                  message="Start logging a set to see your history here."
                />
              }
            />
          </CardBody>
        </Card>
      )}

      <LogModal
        open={!!modal}
        exercise={modal?.exercise}
        theme={modal?.theme}
        onClose={() => setModal(null)}
        onSaved={() => loadTodayLogs()}
      />
    </div>
  );
}
