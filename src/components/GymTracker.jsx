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

const THEME_COLOR_VAR = {
  danger: 'var(--color-danger)',
  success: 'var(--color-accent)',
  info: 'var(--color-info)',
  warning: 'var(--color-warning)',
  primary: 'var(--color-primary)',
  neutral: 'var(--color-secondary)',
};

// Schematic start->end position diagrams: an outline circle marks the start
// position, a filled circle marks the finish, and the connecting arrow shows
// the direction of movement for that exercise. `curve` bows the path
// perpendicular to the line (positive/negative = opposite directions).
const MOTION_PATHS = {
  press:              { from: [30, 75], to: [30, 25] },
  'press-incline':    { from: [35, 78], to: [60, 22] },
  fly:                { from: [15, 42], to: [50, 58] },
  'pull-down':        { from: [50, 15], to: [50, 58] },
  'pull-up':          { from: [50, 78], to: [50, 25] },
  row:                { from: [72, 50], to: [28, 50] },
  'rear-fly':         { from: [50, 42], to: [18, 48] },
  hinge:              { from: [50, 78], to: [50, 40], curve: 18 },
  'press-overhead':   { from: [50, 78], to: [50, 20] },
  'raise-front':      { from: [50, 82], to: [50, 38] },
  'raise-lateral':    { from: [32, 62], to: [72, 35] },
  curl:               { from: [30, 78], to: [50, 28], curve: -22 },
  'triceps-overhead': { from: [50, 68], to: [50, 20], curve: 14 },
  kickback:           { from: [38, 50], to: [78, 50], curve: -12 },
  pushdown:           { from: [50, 22], to: [50, 72] },
  dip:                { from: [50, 72], to: [50, 28] },
  'leg-press':        { from: [28, 60], to: [72, 60] },
  'leg-extension':    { from: [50, 78], to: [50, 28] },
  lunge:              { from: [32, 82], to: [68, 38] },
  'leg-curl':         { from: [50, 25], to: [50, 72], curve: -16 },
  'leg-raise':        { from: [50, 82], to: [50, 32] },
  crunch:             { from: [28, 25], to: [62, 65] },
  twist:              { from: [28, 50], to: [72, 50], curve: 24 },
  rollout:            { from: [28, 62], to: [76, 54] },
  hold:               { static: true },
};

// Small badge overlaid on the real exercise photo: an arrow rotated to match
// that exercise's actual movement direction (derived from MOTION_PATHS), or
// a hold icon for isometric exercises like planks.
function MotionArrowOverlay({ pattern, color = 'var(--color-primary)' }) {
  const cfg = MOTION_PATHS[pattern] || MOTION_PATHS.press;

  if (cfg.static) {
    return (
      <span
        className="absolute bottom-2 left-2 inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed bg-black/50 backdrop-blur-sm"
        style={{ borderColor: color, color }}
      >
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      </span>
    );
  }

  const [x1, y1] = cfg.from;
  const [x2, y2] = cfg.to;
  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

  return (
    <span
      className="absolute bottom-2 left-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm"
      style={{ color }}
    >
      <ArrowRight size={16} style={{ transform: `rotate(${angle}deg)` }} />
    </span>
  );
}

const BODY_PARTS = [
  {
    name: 'Chest',
    theme: 'danger',
    emoji: '🫁',
    exercises: [
      { name: 'Decline Barbell Press', pattern: 'press',
        imgStart: 'https://wger.de/media/exercise-images/100/Decline-bench-press-1.png', imgEnd: 'https://wger.de/media/exercise-images/100/Decline-bench-press-2.png',
        cue: 'Lower bar to lower chest, elbows ~45°',
        steps: ['Lie on decline bench, grip bar shoulder-width', 'Lower bar to lower chest', 'Press up until arms extended'] },
      { name: 'Smith Machine Bench Press', pattern: 'press',
        imgStart: 'https://wger.de/media/exercise-images/916/9bf7555a-fec6-43a9-b343-aae496744e5e.png',
        cue: 'Flat back, bar to mid-chest, drive up',
        steps: ['Lie flat, bar above chest', 'Lower bar to mid-chest', 'Drive up to lockout'] },
      { name: 'Incline Smith Machine Press', pattern: 'press-incline',
        imgStart: 'https://wger.de/media/exercise-images/41/Incline-bench-press-1.png', imgEnd: 'https://wger.de/media/exercise-images/41/Incline-bench-press-2.png',
        cue: '30° bench, press up and slightly back',
        steps: ['Set 30° incline, bar at upper chest', 'Lower under control', 'Press up and slightly back'] },
      { name: 'Incline Dumbbell Fly', pattern: 'fly',
        imgStart: 'https://wger.de/media/exercise-images/308/2ca22a0a-9843-4bb4-9d12-faf5c8c89180.jpg', imgEnd: 'https://wger.de/media/exercise-images/308/dd825dd1-8b8c-4db1-bbdd-f2c81e65b7ff.jpg',
        cue: 'Slight elbow bend, arc dumbbells to chest',
        steps: ['Lie on incline bench, dumbbells above chest', 'Arc arms out with a slight elbow bend', 'Bring dumbbells back together above chest'] },
      { name: 'Incline Barbell Press', pattern: 'press-incline',
        imgStart: 'https://wger.de/media/exercise-images/41/Incline-bench-press-1.png', imgEnd: 'https://wger.de/media/exercise-images/41/Incline-bench-press-2.png',
        cue: 'Bar path to upper chest, feet planted',
        steps: ['Incline bench, bar at upper chest', 'Lower bar to upper chest', 'Press up, feet planted'] },
      { name: 'Decline Chest Press Machine', pattern: 'press',
        imgStart: 'https://wger.de/media/exercise-images/1831/2d9d509f-707b-4132-961e-91a2459ca198.jpg',
        cue: 'Seat low, press down and forward',
        steps: ['Seat low, handles at chest', 'Press down and forward', 'Extend arms fully, avoid hard lockout'] },
    ],
  },
  {
    name: 'Back',
    theme: 'success',
    emoji: '🔙',
    exercises: [
      { name: 'Wide-Grip Lat Pulldown', pattern: 'pull-down',
        imgStart: 'https://wger.de/media/exercise-images/1127/4942b7c0-6bda-4983-88e5-86547c3d445e.png',
        cue: 'Pull to upper chest, squeeze lats',
        steps: ['Wide grip, arms extended overhead', 'Pull bar to upper chest', 'Squeeze lats, control back up'] },
      { name: 'Pull-Ups', pattern: 'pull-up',
        imgStart: 'https://wger.de/media/exercise-images/475/b0554016-16fd-4dbe-be47-a2a17d16ae0e.jpg',
        cue: 'Full hang to chin over bar',
        steps: ['Full hang, arms extended', 'Pull chin over the bar', 'Lower under control to full hang'] },
      { name: 'Close-Grip Cable Row', pattern: 'row',
        imgStart: 'https://wger.de/media/exercise-images/1117/2555c4c3-a84d-47db-b83b-cbf721f12e45.png', imgEnd: 'https://wger.de/media/exercise-images/1117/e74255c0-67a0-4309-b78d-2d79e6ff8c11.png',
        cue: 'Pull to lower ribs, chest up',
        steps: ['Seated, arms extended, chest up', 'Pull handle to lower ribs', 'Squeeze shoulder blades, extend back out'] },
      { name: 'Reverse Pec Deck', pattern: 'rear-fly',
        imgStart: 'https://wger.de/media/exercise-images/822/74affc0d-03b6-4f33-b5f4-a822a2615f68.png', imgEnd: 'https://wger.de/media/exercise-images/822/6a770e5d-cd62-4754-a18c-eebe2103d7c5.png',
        cue: 'Squeeze shoulder blades together',
        steps: ['Chest against pad, arms forward', 'Pull arms back, squeeze shoulder blades', 'Return slow to the start'] },
      { name: 'Back Extensions', pattern: 'hinge',
        imgStart: 'https://wger.de/media/exercise-images/128/Hyperextensions-1.png', imgEnd: 'https://wger.de/media/exercise-images/128/Hyperextensions-2.png',
        cue: "Hinge at hips, don't hyperextend spine",
        steps: ['Hips on pad, body straight', 'Lower torso forward at the hips', 'Raise to a straight line, no hyperextension'] },
      { name: 'High Row Machine', pattern: 'row',
        imgStart: 'https://wger.de/media/exercise-images/1117/2555c4c3-a84d-47db-b83b-cbf721f12e45.png', imgEnd: 'https://wger.de/media/exercise-images/1117/e74255c0-67a0-4309-b78d-2d79e6ff8c11.png',
        cue: 'Pull elbows back and down',
        steps: ['Grip handles, arms extended', 'Pull elbows back and down', 'Squeeze, then control the return'] },
      { name: 'Iso-Lateral Row', pattern: 'row',
        imgStart: 'https://wger.de/media/exercise-images/1621/ca1bc68d-9c36-4dd3-8ec4-496c57b5c564.jpg', imgEnd: 'https://wger.de/media/exercise-images/1621/1bf3ee54-207c-4b53-b057-15adc1dd6128.png',
        cue: 'Drive elbows back, one arm at a time',
        steps: ['One handle, arm extended', 'Drive elbow straight back', 'Squeeze, return slow, switch arms'] },
    ],
  },
  {
    name: 'Shoulders',
    theme: 'info',
    emoji: '💪',
    exercises: [
      { name: 'Dumbbell Shoulder Press', pattern: 'press-overhead',
        imgStart: 'https://wger.de/media/exercise-images/123/dumbbell-shoulder-press-large-1.png', imgEnd: 'https://wger.de/media/exercise-images/123/dumbbell-shoulder-press-large-2.png',
        cue: 'Press up without arching lower back',
        steps: ['Dumbbells at shoulder height', 'Press up without arching your back', 'Lower under control to shoulders'] },
      { name: 'Barbell Overhead Press', pattern: 'press-overhead',
        imgStart: 'https://wger.de/media/exercise-images/119/seated-barbell-shoulder-press-large-1.png', imgEnd: 'https://wger.de/media/exercise-images/119/seated-barbell-shoulder-press-large-2.png',
        cue: 'Brace core, bar path close to face',
        steps: ['Bar at collarbone, shoulder-width grip', 'Press bar up, close to the face', 'Lock out overhead, lower slow'] },
      { name: 'Dumbbell Front Raise', pattern: 'raise-front',
        imgStart: 'https://wger.de/media/exercise-images/256/b7def5bc-2352-499b-b9e5-fff741003831.png',
        cue: 'Raise to shoulder height, controlled',
        steps: ['Dumbbells in front of thighs', 'Raise to shoulder height', 'Lower with control'] },
      { name: 'Dumbbell Lateral Raise', pattern: 'raise-lateral',
        imgStart: 'https://wger.de/media/exercise-images/148/lateral-dumbbell-raises-large-1.png', imgEnd: 'https://wger.de/media/exercise-images/148/lateral-dumbbell-raises-large-2.png',
        cue: 'Lead with elbows, raise to shoulder line',
        steps: ['Dumbbells at sides, slight elbow bend', 'Lead with elbows up to shoulder line', 'Lower slowly, no swing'] },
    ],
  },
  {
    name: 'Biceps',
    theme: 'warning',
    emoji: '💪',
    exercises: [
      { name: 'Standing Dumbbell Curl', pattern: 'curl',
        imgStart: 'https://wger.de/media/exercise-images/74/Bicep-curls-1.png', imgEnd: 'https://wger.de/media/exercise-images/74/Bicep-curls-2.png',
        cue: 'Elbows pinned, curl without swinging',
        steps: ['Stand tall, elbows pinned to sides', 'Curl up without swinging', 'Squeeze at top, lower slow'] },
      { name: 'Hammer Curl', pattern: 'curl',
        imgStart: 'https://wger.de/media/exercise-images/86/Bicep-hammer-curl-1.png', imgEnd: 'https://wger.de/media/exercise-images/86/Bicep-hammer-curl-2.png',
        cue: 'Neutral grip, curl straight up',
        steps: ['Neutral grip, arms at sides', 'Curl straight up', 'Squeeze, lower under control'] },
      { name: 'Cross-Body Hammer Curl', pattern: 'curl',
        imgStart: 'https://wger.de/media/exercise-images/86/Bicep-hammer-curl-1.png', imgEnd: 'https://wger.de/media/exercise-images/86/Bicep-hammer-curl-2.png',
        cue: 'Curl dumbbell across to opposite shoulder',
        steps: ['Neutral grip at side', 'Curl dumbbell across to the opposite shoulder', 'Lower back to side slowly'] },
      { name: 'Concentration Curl', pattern: 'curl',
        imgStart: 'https://wger.de/media/exercise-images/1109/00b0a0bf-c14a-4f13-bb14-62c09030a1aa.png',
        cue: 'Elbow braced on thigh, slow squeeze',
        steps: ['Seated, elbow braced on inner thigh', 'Curl dumbbell up slowly', 'Squeeze at top, full stretch down'] },
      { name: 'Preacher Curl Machine', pattern: 'curl',
        imgStart: 'https://wger.de/media/exercise-images/193/Preacher-curl-3-1.png', imgEnd: 'https://wger.de/media/exercise-images/193/Preacher-curl-3-2.png',
        cue: 'Full stretch at bottom, squeeze at top',
        steps: ['Arms on pad, full stretch', 'Curl up, squeeze biceps', 'Lower slow to full stretch'] },
      { name: 'Barbell Curl', pattern: 'curl',
        imgStart: 'https://wger.de/media/exercise-images/74/Bicep-curls-1.png', imgEnd: 'https://wger.de/media/exercise-images/74/Bicep-curls-2.png',
        cue: 'Shoulder-width grip, no hip swing',
        steps: ['Shoulder-width grip, arms extended', 'Curl bar up, no hip swing', 'Squeeze top, lower controlled'] },
      { name: 'Close-Grip EZ-Bar Curl', pattern: 'curl',
        imgStart: 'https://wger.de/media/exercise-images/94/6dee2f60-aea2-4f2d-9bf6-aef50c4f9483.png',
        cue: 'Narrow grip targets outer biceps',
        steps: ['Narrow grip on EZ-bar', 'Curl up, elbows tucked in', 'Squeeze, lower slow'] },
      { name: 'Standing Cable Curl', pattern: 'curl',
        imgStart: 'https://wger.de/media/exercise-images/912/e10a034f-6370-4dd6-b1c2-416b27844529.png',
        cue: 'Constant tension, squeeze at peak',
        steps: ['Cable at low pulley, arms extended', 'Curl up keeping constant tension', 'Squeeze at top, control down'] },
      { name: 'Cable Rope Hammer Curl', pattern: 'curl',
        imgStart: 'https://wger.de/media/exercise-images/86/Bicep-hammer-curl-1.png', imgEnd: 'https://wger.de/media/exercise-images/86/Bicep-hammer-curl-2.png',
        cue: 'Neutral grip, curl rope ends up',
        steps: ['Rope attachment, neutral grip', 'Curl rope ends up', 'Squeeze, lower with control'] },
    ],
  },
  {
    name: 'Triceps',
    theme: 'warning',
    emoji: '💪',
    exercises: [
      { name: 'Overhead Dumbbell Extension', pattern: 'triceps-overhead',
        imgStart: 'https://wger.de/media/exercise-images/1519/fab7f641-27d4-40b5-8edd-1a0a137bfd94.gif',
        cue: 'Elbows close to head, stretch behind',
        steps: ['Dumbbell overhead, elbows close to head', 'Lower behind head', 'Extend back to the top'] },
      { name: 'Dumbbell Kickback', pattern: 'kickback',
        imgStart: 'https://wger.de/media/exercise-images/1519/fab7f641-27d4-40b5-8edd-1a0a137bfd94.gif',
        cue: 'Upper arm parallel to floor, extend back',
        steps: ['Hinge forward, upper arm parallel to floor', 'Extend forearm back', 'Squeeze triceps, return slow'] },
      { name: 'Rope Pushdown', pattern: 'pushdown',
        imgStart: 'https://wger.de/media/exercise-images/1900/a8243245-8f8f-4e2b-93ca-694d416cb11d.png',
        cue: 'Spread rope ends apart at bottom',
        steps: ['Rope at chest height, elbows at sides', 'Push down, spreading rope ends apart', 'Squeeze at bottom, control up'] },
      { name: 'Straight-Bar Pushdown', pattern: 'pushdown',
        imgStart: 'https://wger.de/media/exercise-images/1185/c5ca283d-8958-4fd8-9d59-a3f52a3ac66b.jpg',
        cue: 'Elbows locked at sides, push down',
        steps: ['Elbows locked at sides, bar at chest', 'Push bar down', 'Squeeze, control back up'] },
      { name: 'Overhead Rope Extension', pattern: 'triceps-overhead',
        imgStart: 'https://wger.de/media/exercise-images/1519/fab7f641-27d4-40b5-8edd-1a0a137bfd94.gif',
        cue: 'Full stretch overhead, extend forward',
        steps: ['Rope overhead, elbows by ears', 'Extend forward and down', 'Full stretch overhead, repeat'] },
      { name: 'Bench Dips', pattern: 'dip',
        imgStart: 'https://wger.de/media/exercise-images/83/Bench-dips-1.png', imgEnd: 'https://wger.de/media/exercise-images/83/Bench-dips-2.png',
        cue: 'Lower until elbows ~90°, press up',
        steps: ['Hands on bench, legs extended', 'Lower until elbows reach ~90°', 'Press up to lockout'] },
      { name: 'Single-Arm Overhead Dumbbell Extension', pattern: 'triceps-overhead',
        imgStart: 'https://wger.de/media/exercise-images/1519/fab7f641-27d4-40b5-8edd-1a0a137bfd94.gif',
        cue: 'Support elbow, extend one arm overhead',
        steps: ['One arm overhead, elbow supported', 'Lower behind head', 'Extend back to the top'] },
    ],
  },
  {
    name: 'Legs',
    theme: 'primary',
    emoji: '🦵',
    exercises: [
      { name: 'Iso-Lateral Leg Press', pattern: 'leg-press',
        imgStart: 'https://wger.de/media/exercise-images/371/d2136f96-3a43-4d4c-9944-1919c4ca1ce1.webp',
        cue: 'Push through heels, full range',
        steps: ['Feet shoulder-width on platform', 'Push through your heels', 'Extend without locking knees'] },
      { name: 'Leg Press', pattern: 'leg-press',
        imgStart: 'https://wger.de/media/exercise-images/371/d2136f96-3a43-4d4c-9944-1919c4ca1ce1.webp',
        cue: "Knees track toes, don't lock out",
        steps: ['Feet on platform, knees bent', 'Push platform away, knees tracking toes', 'Stop short of lockout'] },
      { name: 'Leg Extension', pattern: 'leg-extension',
        imgStart: 'https://wger.de/media/exercise-images/369/78c915d1-e46d-4d30-8124-65d68664c3ef.png', imgEnd: 'https://wger.de/media/exercise-images/369/4d621b17-f6cb-4107-97c0-9f44e9a2dbc6.webp',
        cue: 'Controlled up, pause, lower slow',
        steps: ['Seated, pad on shins, knees bent', 'Extend legs up', 'Pause, lower slow'] },
      { name: 'Walking Lunges', pattern: 'lunge',
        imgStart: 'https://wger.de/media/exercise-images/113/Walking-lunges-1.png', imgEnd: 'https://wger.de/media/exercise-images/113/Walking-lunges-2.png',
        cue: 'Step long, knee over ankle',
        steps: ['Stand tall, step forward', 'Lower until both knees reach ~90°', 'Push through front heel, step into the next lunge'] },
      { name: 'Lying Leg Curl', pattern: 'leg-curl',
        imgStart: 'https://wger.de/media/exercise-images/154/lying-leg-curl-machine-large-1.png', imgEnd: 'https://wger.de/media/exercise-images/154/lying-leg-curl-machine-large-2.png',
        cue: 'Curl heels to glutes, squeeze',
        steps: ['Lie face down, pad on ankles', 'Curl heels to glutes', 'Squeeze, lower slow'] },
    ],
  },
  {
    name: 'Abs',
    theme: 'neutral',
    emoji: '🔥',
    exercises: [
      { name: 'Hanging Leg Raise', pattern: 'leg-raise',
        imgStart: 'https://wger.de/media/exercise-images/91/Crunches-1.png', imgEnd: 'https://wger.de/media/exercise-images/91/Crunches-2.png',
        cue: 'Raise legs to hip height, no swing',
        steps: ['Hang from bar, legs straight', 'Raise legs to hip height', 'Lower slow, no swing'] },
      { name: 'Cable Crunch', pattern: 'crunch',
        imgStart: 'https://wger.de/media/exercise-images/91/Crunches-1.png', imgEnd: 'https://wger.de/media/exercise-images/91/Crunches-2.png',
        cue: 'Round spine, crunch down to knees',
        steps: ['Kneel, rope behind head', 'Round spine, crunch down', 'Crunch to knees, return slow'] },
      { name: 'Plank', pattern: 'hold',
        imgStart: 'https://wger.de/media/exercise-images/458/b7bd9c28-9f1d-4647-bd17-ab6a3adf5770.png', imgEnd: 'https://wger.de/media/exercise-images/458/902e6836-394e-458b-b94e-101d714294e2.png',
        cue: 'Straight line head to heels',
        steps: ['Forearms and toes on the floor', 'Keep a straight line head to heels', 'Brace core, hold the position'] },
      { name: 'Russian Twist', pattern: 'twist',
        imgStart: 'https://wger.de/media/exercise-images/1193/70ca5d80-3847-4a8c-8882-c6e9e485e29e.png',
        cue: 'Rotate from torso, feet off floor',
        steps: ['Seated, lean back slightly, feet off floor', 'Rotate torso side to side', 'Control each rotation'] },
      { name: 'Ab Wheel Rollout', pattern: 'rollout',
        imgStart: 'https://wger.de/media/exercise-images/41/34b37423-269f-43d4-9d29-d2a90eeaa6b4.png',
        cue: "Core tight, roll out slow, don't sag",
        steps: ['Kneel, wheel under shoulders', 'Roll out slow, core tight', "Roll back without letting hips sag"] },
    ],
  },
];

const TODAY = new Date().toISOString().split('T')[0];

const WEEKLY_SPLIT = [
  { day: 'Sun', label: 'Sunday', focus: 'Legs + Abs' },
  { day: 'Mon', label: 'Monday', focus: 'Rest' },
  { day: 'Tue', label: 'Tuesday', focus: 'Chest + Triceps' },
  { day: 'Wed', label: 'Wednesday', focus: 'Back + Biceps' },
  { day: 'Thu', label: 'Thursday', focus: 'Legs + Abs' },
  { day: 'Fri', label: 'Friday', focus: 'Chest + Shoulders' },
  { day: 'Sat', label: 'Saturday', focus: 'Back + Biceps' },
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

function ExerciseCard({ exercise, theme, logged, onLog }) {
  const t = THEME_CLASSES[theme] || THEME_CLASSES.primary;
  return (
    <button
      type="button"
      onClick={() => onLog(exercise.name)}
      className={`group flex flex-col overflow-hidden rounded-xl border bg-[var(--surface)] text-left transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 ${logged ? t.border : 'border-[var(--border)]'}`}
    >
      <div className="relative h-28 overflow-hidden bg-[var(--surface-hover)] flex">
        {exercise.imgEnd ? (
          <>
            <div className="flex-1 h-full overflow-hidden">
              <img
                src={exercise.imgStart}
                alt={`${exercise.name} - start position`}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="flex items-center justify-center w-7 shrink-0 bg-[var(--surface)] border-x border-[var(--border)]">
              <ArrowRight size={14} className={t.text} />
            </div>
            <div className="flex-1 h-full overflow-hidden">
              <img
                src={exercise.imgEnd}
                alt={`${exercise.name} - end position`}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          </>
        ) : (
          <div className="relative flex-1 h-full overflow-hidden">
            <img
              src={exercise.imgStart}
              alt={exercise.name}
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <MotionArrowOverlay pattern={exercise.pattern} color={THEME_COLOR_VAR[theme] || THEME_COLOR_VAR.primary} />
          </div>
        )}
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
