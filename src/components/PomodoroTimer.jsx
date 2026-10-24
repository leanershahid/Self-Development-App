import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, Zap, Flame } from 'lucide-react';
import { supabase } from '../supabase';
import { Card, CardHeader, CardBody, Badge, Button, IconButton, Input, EmptyState } from './ui';

const MODES = [
  { key: 'focus', label: 'Focus', minutes: 25, icon: Brain, text: 'text-primary', soft: 'bg-primary/10', badge: 'primary' },
  { key: 'short', label: 'Short Break', minutes: 5, icon: Coffee, text: 'text-accent', soft: 'bg-accent/10', badge: 'success' },
  { key: 'long', label: 'Long Break', minutes: 15, icon: Zap, text: 'text-info', soft: 'bg-info/10', badge: 'info' },
];

export default function PomodoroTimer() {
  const [mode, setMode]         = useState('focus');
  const [seconds, setSeconds]   = useState(25 * 60);
  const [running, setRunning]   = useState(false);
  const [sessions, setSessions] = useState(() => parseInt(localStorage.getItem('pomo_sessions') || '0'));
  const [log, setLog]           = useState(() => JSON.parse(localStorage.getItem('pomo_log') || '[]'));
  const [task, setTask]         = useState('');
  const intervalRef = useRef(null);

  const currentMode = MODES.find(m => m.key === mode);
  const total = currentMode.minutes * 60;
  const progress = ((total - seconds) / total) * 100;
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (mode === 'focus') {
              const newSessions = sessions + 1;
              setSessions(newSessions);
              localStorage.setItem('pomo_sessions', newSessions);
              const entry = { task: task || 'Focus session', time: new Date().toLocaleTimeString(), date: new Date().toLocaleDateString() };
              const newLog = [entry, ...log].slice(0, 20);
              setLog(newLog);
              localStorage.setItem('pomo_log', JSON.stringify(newLog));
              // Log to Supabase
              supabase.from('pomodoro_sessions').insert({
                task: task || 'Focus session',
                mode: 'focus',
                completed_at: new Date().toISOString(),
                date: new Date().toISOString().split('T')[0],
              }).then(() => {});
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, mode]);

  const switchMode = (m) => {
    setMode(m);
    setRunning(false);
    setSeconds(MODES.find(x => x.key === m).minutes * 60);
  };

  const reset = () => { setRunning(false); setSeconds(currentMode.minutes * 60); };

  // SVG circle
  const r = 110, circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress / 100);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 ${currentMode.soft} ${currentMode.text}`}>
          <Brain size={28} />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Pomodoro Timer</h1>
        <p className="text-sm text-[var(--text-muted)]">Focus, break, repeat.</p>
      </div>

      {/* Mode Switcher */}
      <Card className="p-1.5 flex gap-1.5">
        {MODES.map(m => {
          const Icon = m.icon;
          const active = mode === m.key;
          return (
            <button
              key={m.key}
              onClick={() => switchMode(m.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-colors duration-200 ${
                active ? `${m.soft} ${m.text}` : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <Icon size={16} /> {m.label}
            </button>
          );
        })}
      </Card>

      {/* Timer */}
      <Card>
        <CardBody className="flex flex-col items-center gap-6 py-8">
          <div className={`relative w-64 h-64 transition-transform duration-1000 ${running ? 'scale-[1.01]' : ''}`}>
            <svg className="w-full h-full -rotate-90" viewBox="0 0 260 260">
              <circle cx="130" cy="130" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
              <circle
                cx="130"
                cy="130"
                r={r}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className={currentMode.text}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className={`text-5xl font-black tabular-nums ${currentMode.text}`}>
                {mins}:{secs}
              </div>
              <Badge variant={currentMode.badge}>{currentMode.label}</Badge>
              {running && <span className={`w-2 h-2 rounded-full animate-pulse ${currentMode.text.replace('text-', 'bg-')}`} />}
            </div>
          </div>

          <Input
            value={task}
            onChange={e => setTask(e.target.value)}
            placeholder="What are you working on? (optional)"
            className="w-full"
          />

          <div className="flex gap-3 w-full">
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              icon={running ? <Pause size={20} /> : <Play size={20} />}
              onClick={() => setRunning(r => !r)}
            >
              {running ? 'Pause' : 'Start'}
            </Button>
            <IconButton variant="default" size="lg" label="Reset" onClick={reset}>
              <RotateCcw size={20} />
            </IconButton>
          </div>
        </CardBody>
      </Card>

      {/* Sessions Counter */}
      <Card>
        <CardHeader title="Today's Focus Sessions" icon={<Flame size={18} />} />
        <CardBody className="flex flex-col items-center gap-3">
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from({ length: Math.max(sessions, 4) }).map((_, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm border ${
                  i < sessions
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-muted)]'
                }`}
              >
                🍅
              </div>
            ))}
          </div>
          <p className="text-2xl font-bold text-primary">
            {sessions} <span className="text-sm text-[var(--text-muted)] font-normal">sessions</span>
          </p>
        </CardBody>
      </Card>

      {/* Log */}
      <Card>
        <CardHeader title="Session Log" />
        <CardBody>
          {log.length === 0 ? (
            <EmptyState
              icon={<Brain size={20} />}
              title="No sessions yet"
              message="Complete a focus session to see it logged here."
            />
          ) : (
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {log.map((l, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--surface-hover)]">
                  <span className="text-base">🍅</span>
                  <span className="flex-1 text-xs text-[var(--text)] truncate">{l.task}</span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] whitespace-nowrap">{l.time}</span>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
