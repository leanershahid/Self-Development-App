import React, { useState, useEffect } from 'react';
import { Dumbbell, ChevronDown, ChevronUp, Plus, TrendingUp, History, Check, ArrowRight } from 'lucide-react';
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
      { name: 'Decline Barbell Press', cue: 'Lower bar to lower chest, elbows ~45°',
        steps: ['Lie on decline bench, grip bar shoulder-width', 'Lower bar to lower chest', 'Press up until arms extended'] },
      { name: 'Smith Machine Bench Press', cue: 'Flat back, bar to mid-chest, drive up',
        steps: ['Lie flat, bar above chest', 'Lower bar to mid-chest', 'Drive up to lockout'] },
      { name: 'Incline Smith Machine Press', cue: '30° bench, press up and slightly back',
        steps: ['Set 30° incline, bar at upper chest', 'Lower under control', 'Press up and slightly back'] },
      { name: 'Incline Dumbbell Fly', cue: 'Slight elbow bend, arc dumbbells to chest',
        steps: ['Lie on incline bench, dumbbells above chest', 'Arc arms out with a slight elbow bend', 'Bring dumbbells back together above chest'] },
      { name: 'Incline Barbell Press', cue: 'Bar path to upper chest, feet planted',
        steps: ['Incline bench, bar at upper chest', 'Lower bar to upper chest', 'Press up, feet planted'] },
      { name: 'Decline Chest Press Machine', cue: 'Seat low, press down and forward',
        steps: ['Seat low, handles at chest', 'Press down and forward', 'Extend arms fully, avoid hard lockout'] },
    ],
  },
  {
    name: 'Back',
    theme: 'success',
    emoji: '🔙',
    exercises: [
      { name: 'Wide-Grip Lat Pulldown', cue: 'Pull to upper chest, squeeze lats',
        steps: ['Wide grip, arms extended overhead', 'Pull bar to upper chest', 'Squeeze lats, control back up'] },
      { name: 'Pull-Ups', cue: 'Full hang to chin over bar',
        steps: ['Full hang, arms extended', 'Pull chin over the bar', 'Lower under control to full hang'] },
      { name: 'Close-Grip Cable Row', cue: 'Pull to lower ribs, chest up',
        steps: ['Seated, arms extended, chest up', 'Pull handle to lower ribs', 'Squeeze shoulder blades, extend back out'] },
      { name: 'Reverse Pec Deck', cue: 'Squeeze shoulder blades together',
        steps: ['Chest against pad, arms forward', 'Pull arms back, squeeze shoulder blades', 'Return slow to the start'] },
      { name: 'Back Extensions', cue: "Hinge at hips, don't hyperextend spine",
        steps: ['Hips on pad, body straight', 'Lower torso forward at the hips', 'Raise to a straight line, no hyperextension'] },
      { name: 'High Row Machine', cue: 'Pull elbows back and down',
        steps: ['Grip handles, arms extended', 'Pull elbows back and down', 'Squeeze, then control the return'] },
      { name: 'Iso-Lateral Row', cue: 'Drive elbows back, one arm at a time',
        steps: ['One handle, arm extended', 'Drive elbow straight back', 'Squeeze, return slow, switch arms'] },
    ],
  },
  {
    name: 'Shoulders',
    theme: 'info',
    emoji: '💪',
    exercises: [
      { name: 'Dumbbell Shoulder Press', cue: 'Press up without arching lower back',
        steps: ['Dumbbells at shoulder height', 'Press up without arching your back', 'Lower under control to shoulders'] },
      { name: 'Barbell Overhead Press', cue: 'Brace core, bar path close to face',
        steps: ['Bar at collarbone, shoulder-width grip', 'Press bar up, close to the face', 'Lock out overhead, lower slow'] },
      { name: 'Dumbbell Front Raise', cue: 'Raise to shoulder height, controlled',
        steps: ['Dumbbells in front of thighs', 'Raise to shoulder height', 'Lower with control'] },
      { name: 'Dumbbell Lateral Raise', cue: 'Lead with elbows, raise to shoulder line',
        steps: ['Dumbbells at sides, slight elbow bend', 'Lead with elbows up to shoulder line', 'Lower slowly, no swing'] },
    ],
  },
  {
    name: 'Biceps',
    theme: 'warning',
    emoji: '💪',
    exercises: [
      { name: 'Standing Dumbbell Curl', cue: 'Elbows pinned, curl without swinging',
        steps: ['Stand tall, elbows pinned to sides', 'Curl up without swinging', 'Squeeze at top, lower slow'] },
      { name: 'Hammer Curl', cue: 'Neutral grip, curl straight up',
        steps: ['Neutral grip, arms at sides', 'Curl straight up', 'Squeeze, lower under control'] },
      { name: 'Cross-Body Hammer Curl', cue: 'Curl dumbbell across to opposite shoulder',
        steps: ['Neutral grip at side', 'Curl dumbbell across to the opposite shoulder', 'Lower back to side slowly'] },
      { name: 'Concentration Curl', cue: 'Elbow braced on thigh, slow squeeze',
        steps: ['Seated, elbow braced on inner thigh', 'Curl dumbbell up slowly', 'Squeeze at top, full stretch down'] },
      { name: 'Preacher Curl Machine', cue: 'Full stretch at bottom, squeeze at top',
        steps: ['Arms on pad, full stretch', 'Curl up, squeeze biceps', 'Lower slow to full stretch'] },
      { name: 'Barbell Curl', cue: 'Shoulder-width grip, no hip swing',
        steps: ['Shoulder-width grip, arms extended', 'Curl bar up, no hip swing', 'Squeeze top, lower controlled'] },
      { name: 'Close-Grip EZ-Bar Curl', cue: 'Narrow grip targets outer biceps',
        steps: ['Narrow grip on EZ-bar', 'Curl up, elbows tucked in', 'Squeeze, lower slow'] },
      { name: 'Standing Cable Curl', cue: 'Constant tension, squeeze at peak',
        steps: ['Cable at low pulley, arms extended', 'Curl up keeping constant tension', 'Squeeze at top, control down'] },
      { name: 'Cable Rope Hammer Curl', cue: 'Neutral grip, curl rope ends up',
        steps: ['Rope attachment, neutral grip', 'Curl rope ends up', 'Squeeze, lower with control'] },
    ],
  },
  {
    name: 'Triceps',
    theme: 'warning',
    emoji: '💪',
    exercises: [
      { name: 'Overhead Dumbbell Extension', cue: 'Elbows close to head, stretch behind',
        steps: ['Dumbbell overhead, elbows close to head', 'Lower behind head', 'Extend back to the top'] },
      { name: 'Dumbbell Kickback', cue: 'Upper arm parallel to floor, extend back',
        steps: ['Hinge forward, upper arm parallel to floor', 'Extend forearm back', 'Squeeze triceps, return slow'] },
      { name: 'Rope Pushdown', cue: 'Spread rope ends apart at bottom',
        steps: ['Rope at chest height, elbows at sides', 'Push down, spreading rope ends apart', 'Squeeze at bottom, control up'] },
      { name: 'Straight-Bar Pushdown', cue: 'Elbows locked at sides, push down',
        steps: ['Elbows locked at sides, bar at chest', 'Push bar down', 'Squeeze, control back up'] },
      { name: 'Overhead Rope Extension', cue: 'Full stretch overhead, extend forward',
        steps: ['Rope overhead, elbows by ears', 'Extend forward and down', 'Full stretch overhead, repeat'] },
      { name: 'Bench Dips', cue: 'Lower until elbows ~90°, press up',
        steps: ['Hands on bench, legs extended', 'Lower until elbows reach ~90°', 'Press up to lockout'] },
      { name: 'Single-Arm Overhead Dumbbell Extension', cue: 'Support elbow, extend one arm overhead',
        steps: ['One arm overhead, elbow supported', 'Lower behind head', 'Extend back to the top'] },
    ],
  },
  {
    name: 'Legs',
    theme: 'primary',
    emoji: '🦵',
    exercises: [
      { name: 'Iso-Lateral Leg Press', cue: 'Push through heels, full range',
        steps: ['Feet shoulder-width on platform', 'Push through your heels', 'Extend without locking knees'] },
      { name: 'Leg Press', cue: "Knees track toes, don't lock out",
        steps: ['Feet on platform, knees bent', 'Push platform away, knees tracking toes', 'Stop short of lockout'] },
      { name: 'Leg Extension', cue: 'Controlled up, pause, lower slow',
        steps: ['Seated, pad on shins, knees bent', 'Extend legs up', 'Pause, lower slow'] },
      { name: 'Walking Lunges', cue: 'Step long, knee over ankle',
        steps: ['Stand tall, step forward', 'Lower until both knees reach ~90°', 'Push through front heel, step into the next lunge'] },
      { name: 'Lying Leg Curl', cue: 'Curl heels to glutes, squeeze',
        steps: ['Lie face down, pad on ankles', 'Curl heels to glutes', 'Squeeze, lower slow'] },
    ],
  },
  {
    name: 'Abs',
    theme: 'neutral',
    emoji: '🔥',
    exercises: [
      { name: 'Hanging Leg Raise', cue: 'Raise legs to hip height, no swing',
        steps: ['Hang from bar, legs straight', 'Raise legs to hip height', 'Lower slow, no swing'] },
      { name: 'Cable Crunch', cue: 'Round spine, crunch down to knees',
        steps: ['Kneel, rope behind head', 'Round spine, crunch down', 'Crunch to knees, return slow'] },
      { name: 'Plank', cue: 'Straight line head to heels',
        steps: ['Forearms and toes on the floor', 'Keep a straight line head to heels', 'Brace core, hold the position'] },
      { name: 'Russian Twist', cue: 'Rotate from torso, feet off floor',
        steps: ['Seated, lean back slightly, feet off floor', 'Rotate torso side to side', 'Control each rotation'] },
      { name: 'Ab Wheel Rollout', cue: "Core tight, roll out slow, don't sag",
        steps: ['Kneel, wheel under shoulders', 'Roll out slow, core tight', "Roll back without letting hips sag"] },
    ],
  },
];

// One representative photo per body part — kept to a small, known-reliable
// set of Unsplash IDs rather than guessing a distinct URL per exercise.
const BODY_PART_IMAGES = {
  Chest:     'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&h=200&fit=crop',
  Back:      'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=300&h=200&fit=crop',
  Shoulders: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=300&h=200&fit=crop',
  Biceps:    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300&h=200&fit=crop',
  Triceps:   'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=200&fit=crop',
  Legs:      'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=300&h=200&fit=crop',
  Abs:       'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop',
};

const TODAY = new Date().toISOString().split('T')[0];

const WEEKLY_SPLIT = [
  { day: 'Sun', label: 'Sunday', focus: 'Rest' },
  { day: 'Mon', label: 'Monday', focus: 'Chest + Triceps' },
  { day: 'Tue', label: 'Tuesday', focus: 'Back + Biceps' },
  { day: 'Wed', label: 'Wednesday', focus: 'Legs + Abs' },
  { day: 'Thu', label: 'Thursday', focus: 'Chest + Shoulders' },
  { day: 'Fri', label: 'Friday', focus: 'Back + Biceps' },
  { day: 'Sat', label: 'Saturday', focus: 'Legs + Abs' },
];

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

function LogModal({ open, exercise, theme, steps, onClose, onSaved }) {
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
      {steps?.length > 0 && (
        <div className={`rounded-lg px-3 py-3 mb-4 border ${t.bg} ${t.border}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide mb-2.5 ${t.text}`}>Correct Position</p>
          <div className="flex flex-col">
            {steps.map((step, i) => (
              <React.Fragment key={i}>
                <div className="flex items-start gap-2">
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white shrink-0 ${t.dot}`}>
                    {i + 1}
                  </span>
                  <span className="text-sm text-[var(--text)] leading-snug">{step}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="pl-[5px] py-0.5">
                    <ArrowRight size={14} className={`${t.text} rotate-90`} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

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

function ExerciseCard({ exercise, theme, img, logged, onLog }) {
  const t = THEME_CLASSES[theme] || THEME_CLASSES.primary;
  return (
    <button
      type="button"
      onClick={() => onLog(exercise.name)}
      className={`group flex flex-col overflow-hidden rounded-xl border bg-[var(--surface)] text-left transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 ${logged ? t.border : 'border-[var(--border)]'}`}
    >
      <div className="relative h-28 overflow-hidden bg-[var(--surface-hover)]">
        <img
          src={img}
          alt={exercise.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
        {logged && (
          <span className={`absolute top-2 right-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-white ring-2 ring-[var(--surface)] ${t.dot}`}>
            <Check size={12} />
          </span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-[var(--text)] leading-snug">{exercise.name}</span>
        {exercise.cue && (
          <span className="flex items-start gap-1.5 text-xs text-[var(--text-muted)] leading-snug">
            <ArrowRight size={12} className={`${t.text} shrink-0 mt-0.5`} />
            {exercise.cue}
          </span>
        )}
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${t.text} mt-1`}>
          <Plus size={12} /> Log set
        </span>
      </div>
    </button>
  );
}

function WeeklySplitCard() {
  const todayIdx = new Date().getDay();
  return (
    <Card>
      <CardHeader icon={<Dumbbell size={18} />} title="Weekly Workout Split" />
      <CardBody className="flex flex-col gap-2">
        {WEEKLY_SPLIT.map((d, i) => {
          const isToday = i === todayIdx;
          const isRest = d.focus === 'Rest';
          return (
            <div
              key={d.day}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                isToday ? 'bg-primary/10 border-primary/30' : 'bg-[var(--bg)] border-[var(--border)]'
              }`}
            >
              <span className={`text-xs font-bold w-9 shrink-0 ${isToday ? 'text-primary' : 'text-[var(--text-muted)]'}`}>
                {d.day}
              </span>
              <p className={`text-sm flex-1 ${isRest ? 'text-[var(--text-muted)] italic' : 'text-[var(--text)] font-medium'}`}>
                {d.focus}
              </p>
              {isToday && <Badge variant="primary">Today</Badge>}
            </div>
          );
        })}
      </CardBody>
    </Card>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
            {part.exercises.map((ex) => (
              <ExerciseCard
                key={ex.name}
                exercise={ex}
                theme={part.theme}
                img={BODY_PART_IMAGES[part.name]}
                logged={loggedNames.has(ex.name)}
                onLog={onLog}
              />
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
    const ex = part?.exercises.find((e) => e.name === exerciseName);
    setModal({ exercise: exerciseName, theme: part?.theme || 'primary', steps: ex?.steps });
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

          <WeeklySplitCard />

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
        steps={modal?.steps}
        onClose={() => setModal(null)}
        onSaved={() => loadTodayLogs()}
      />
    </div>
  );
}
