import {
  Home, Activity, Gift, Bot, Settings, Smile, Flame, ScrollText, Timer, Heart,
  Images, Utensils, Dumbbell, Brain, BookOpen, Map, Sparkles, FileText, Briefcase,
  TrendingUp, ClipboardList, FolderOpen, Medal, Zap, Swords, Users, Wallet, Mic2, Shield, Trophy,
} from 'lucide-react';

export const NAV_DIRECT = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Performance', path: '/performance-dashboard', icon: Activity },
  { label: 'Rewards', path: '/reward-dashboard', icon: Gift },
  { label: 'AI Coach', path: '/ai-coach', icon: Bot },
];

export const NAV_GROUPS = [
  {
    label: 'Lifestyle',
    icon: Smile,
    items: [
      { label: 'Mood Tracker', path: '/mood', icon: Smile },
      { label: 'Habit Streaks', path: '/habits', icon: Flame },
      { label: 'Daily Journal', path: '/journal', icon: ScrollText },
      { label: 'Pomodoro', path: '/pomodoro', icon: Timer },
      { label: 'Manners', path: '/manners', icon: Heart },
      { label: 'Gallery', path: '/gallery', icon: Images },
      { label: 'Workout Diet', path: '/workout-diet', icon: Utensils },
      { label: 'Gym Tracker', path: '/gym', icon: Dumbbell },
    ],
  },
  {
    label: 'Growth',
    icon: Brain,
    items: [
      { label: 'Skills Tracker', path: '/skills', icon: Brain },
      { label: 'Books & Courses', path: '/books', icon: BookOpen },
      { label: 'Plans', path: '/plans', icon: Map },
      { label: 'Inspirations', path: '/inspirations', icon: Sparkles },
      { label: 'Script Writer', path: '/script-writer', icon: FileText },
      { label: 'Job Finder', path: '/job-finder', icon: Briefcase },
    ],
  },
  {
    label: 'Analytics',
    icon: TrendingUp,
    items: [
      { label: 'Life Success', path: '/life-success', icon: TrendingUp },
      { label: 'Report Card', path: '/report-card', icon: ClipboardList },
      { label: 'Previous Todos', path: '/previous-todos', icon: FolderOpen },
      { label: 'Achievements', path: '/achievements', icon: Medal },
    ],
  },
  {
    label: 'Mindset',
    icon: Mic2,
    items: [
      { label: 'Mirror Talk', path: '/mirror-talk', icon: Mic2 },
      { label: 'Fear Crusher', path: '/fear-crusher', icon: Swords },
      { label: 'Comfort Zone', path: '/comfort-zone', icon: Shield },
      { label: 'Patience Marker', path: '/patience-marker', icon: Heart },
    ],
  },
  {
    label: 'Social & Fun',
    icon: Trophy,
    items: [
      { label: 'Level System', path: '/level', icon: Zap },
      { label: 'Boss Fight', path: '/boss', icon: Swords },
      { label: 'Friends', path: '/freinds', icon: Users },
      { label: 'Money Vault', path: '/money', icon: Wallet },
    ],
  },
];

export const SETTINGS_ITEM = { label: 'Settings', path: '/settings', icon: Settings };

export const ROUTE_LABELS = Object.fromEntries([
  ...NAV_DIRECT.map((i) => [i.path, i.label]),
  ...NAV_GROUPS.flatMap((g) => g.items.map((i) => [i.path, i.label])),
  [SETTINGS_ITEM.path, SETTINGS_ITEM.label],
]);

export function getPageTitle(pathname) {
  return ROUTE_LABELS[pathname] || 'Dashboard';
}
