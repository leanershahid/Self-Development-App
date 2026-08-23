import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee, Brain, Zap } from 'lucide-react';
import Navbar from './NavBar';
import { supabase } from '../supabase';

const GLASS = { background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' };

const MODES = [
  { key: 'focus',  label: 'Focus',       minutes: 25, color: '#f87171', icon: <Brain size={16} /> },
  { key: 'short',  label: 'Short Break', minutes: 5,  color: '#4ade80', icon: <Coffee size={16} /> },
  { key: 'long',   label: 'Long Break',  minutes: 15, color: '#22d3ee', icon: <Zap size={16} /> },
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
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <Navbar />
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[35%] h-[35%] rounded-full blur-[120px]" style={{ background: currentMode.color + '15' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full blur-[120px]" style={{ background: currentMode.color + '10' }} />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-10">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl mb-4 border" style={{ ...GLASS, borderColor: currentMode.color + '40', boxShadow: `0 0 24px ${currentMode.color}30` }}>
            <Brain size={32} style={{ color: currentMode.color }} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500 mb-2">POMODORO</h1>
          <p className="font-mono text-xs tracking-[0.3em] uppercase" style={{ color: currentMode.color + '80' }}>Focus · Break · Repeat</p>
        </motion.div>

        {/* Mode Switcher */}
        <div className="flex gap-2 mb-8 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {MODES.map(m => (
            <button key={m.key} onClick={() => switchMode(m.key)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-300"
              style={mode === m.key
                ? { background: m.color + '20', border: `1px solid ${m.color}50`, color: m.color, boxShadow: `0 0 12px ${m.color}20` }
                : { background: 'transparent', border: '1px solid transparent', color: '#475569' }}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {/* Timer Circle */}
        <motion.div animate={{ scale: running ? [1, 1.01, 1] : 1 }} transition={{ repeat: Infinity, duration: 2 }} className="flex justify-center mb-8">
          <div className="relative w-64 h-64">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 260 260">
              <circle cx="130" cy="130" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
              <circle cx="130" cy="130" r={r} fill="none" stroke={currentMode.color} strokeWidth="8"
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 8px ${currentMode.color}80)` }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-6xl font-black tabular-nums" style={{ color: currentMode.color, textShadow: `0 0 30px ${currentMode.color}60` }}>
                {mins}:{secs}
              </div>
              <div className="text-xs font-mono uppercase tracking-widest mt-1" style={{ color: currentMode.color + '80' }}>{currentMode.label}</div>
              {running && <div className="mt-2 w-2 h-2 rounded-full animate-pulse" style={{ background: currentMode.color }} />}
            </div>
          </div>
        </motion.div>

        {/* Task Input */}
        <div className="mb-6">
          <input value={task} onChange={e => setTask(e.target.value)} placeholder="What are you working on? (optional)"
            className="w-full px-4 py-3 rounded-xl text-sm text-slate-300 placeholder-slate-600 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>

        {/* Controls */}
        <div className="flex gap-3 mb-8">
          <button onClick={() => setRunning(r => !r)}
            className="flex-1 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all"
            style={{ background: `linear-gradient(135deg, ${currentMode.color}30, ${currentMode.color}15)`, border: `2px solid ${currentMode.color}60`, color: currentMode.color, boxShadow: running ? `0 0 30px ${currentMode.color}30` : 'none' }}>
            {running ? <Pause size={24} /> : <Play size={24} />}
            {running ? 'Pause' : 'Start'}
          </button>
          <button onClick={reset} className="px-5 py-4 rounded-2xl transition-all text-slate-500 hover:text-slate-300"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <RotateCcw size={20} />
          </button>
        </div>

        {/* Sessions Counter */}
        <div className="rounded-2xl p-5 mb-6 text-center" style={GLASS}>
          <p className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-2">Today's Focus Sessions</p>
          <div className="flex justify-center gap-2 mb-2">
            {Array.from({ length: Math.max(sessions, 4) }).map((_, i) => (
              <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={i < sessions
                  ? { background: '#f87171' + '25', border: '1px solid #f87171' + '60', color: '#f87171' }
                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#334155' }}>
                🍅
              </div>
            ))}
          </div>
          <p className="text-2xl font-bold text-rose-400">{sessions} <span className="text-sm text-slate-500 font-normal">sessions</span></p>
        </div>

        {/* Log */}
        {log.length > 0 && (
          <div className="rounded-3xl p-6" style={GLASS}>
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-4">Session Log</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}>
              {log.map((l, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="text-base">🍅</span>
                  <span className="flex-1 text-xs text-slate-400">{l.task}</span>
                  <span className="text-[10px] font-mono text-slate-600">{l.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
